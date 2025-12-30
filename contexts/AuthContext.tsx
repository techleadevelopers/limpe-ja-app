// LimpeJaApp/contexts/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AuthResponse, RegisterClientDto, RegisterProviderDto, UserRole } from '../types/backend/auth';
import authService from '../services/authService';
import { registerDevicePushToken, unregisterDevicePushToken } from '../services/pushService';
import { setUnauthorizedCallback, resetRevocationCallbackFlag } from '../services/api';
import { AuthEventType, onAuthEvent } from '../services/authEvents';
import { UserProfile } from '../types/backend/users';
import userService from '../services/userService';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { appQueryClient } from '../components/provider/query-client-provider';
import { fetchPaymentIntent } from '../services/paymentService';
import { ackNotification } from '../services/notificationService';
import { resolveSocketUrl } from '../utils/socket';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { AUTH_ROUTES } from '../constants/routes';
import { usePushRegistration } from '../hooks/usePushRegistration';


// utils de log sem recursão
const safeString = (v: any) => {
  try {
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
  } catch {
    return '[Object]';
  }
};

const debugLog = (..._args: unknown[]) => {};
const debugWarn = (...args: unknown[]) => {
  if (__DEV__) console.warn('[Auth]', ...args.map(safeString));
};
const debugError = (...args: unknown[]) => {
  if (__DEV__) console.error('[Auth]', ...args.map(safeString));
};

type PaymentPayload = Record<string, unknown>;

const normalizeId = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
    return undefined;
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return String(value);
  }
  return undefined;
};

const getBookingIdFromPayload = (payload: PaymentPayload): string | undefined => {
  const candidate =
    payload.bookingId ??
    payload.booking?.id ??
    payload.payload?.bookingId ??
    payload.payload?.booking?.id ??
    payload.data?.bookingId ??
    payload.data?.booking?.id ??
    payload._id;
  return normalizeId(candidate);
};

const getNotificationIdFromPayload = (payload: PaymentPayload): string | undefined => {
  const candidate = payload.notificationId ?? payload.id;
  return normalizeId(candidate);
};

export const runPaymentPostActions = (payload: PaymentPayload) => {
  const bookingId = getBookingIdFromPayload(payload);
  const notificationId = getNotificationIdFromPayload(payload);

  if (notificationId) {
    ackNotification(notificationId).catch(() => {});
  }

  if (bookingId) {
    appQueryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    void fetchPaymentIntent(bookingId).catch(() => {});
  }
};

export const createPaymentConfirmedHandler = (
  setVisible: React.Dispatch<React.SetStateAction<boolean>>,
  runPostActions: (payload: PaymentPayload) => void,
) => {
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  const handler = (data: unknown) => {
    setVisible(true);
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    const payload =
      typeof data === 'object' && data !== null ? (data as PaymentPayload) : {};
    hideTimeout = setTimeout(() => setVisible(false), 3500);
    runPostActions(payload);
  };

  const cleanup = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  };

  return { handler, cleanup };
};

interface AuthDataFromStorage {
  token: string | null;
  user: UserProfile | null;
  id: string | null;
  role: UserRole | null;
}

interface AuthenticatedUserProfile extends UserProfile {
  token: string;
}

interface AuthContextType {
  user: AuthenticatedUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  token: string | null;

  // AUTH
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any, userType: 'client' | 'provider') => Promise<void>;
  refreshUser: () => Promise<void>;
  signUpClient: (data: RegisterClientDto) => Promise<void>;
  signUpProvider: (data: RegisterProviderDto) => Promise<void>;
  isRegistrationInProgress: boolean;
  setIsRegistrationInProgress: (inProgress: boolean) => void;
  setAuthData: (authData: AuthResponse) => Promise<void>;
  updateUser: (updatedUser?: Partial<UserProfile>) => Promise<void>;

  // 🔥 NOVO: overlay global do PIX confirmado
  paymentOverlayVisible: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isRegistrationInProgress, setIsRegistrationInProgress] = useState(false);
  const isAuthenticated = !!user && !!user.token;

  // 🔥 NOVO: controle do overlay
  const [paymentOverlayVisible, setPaymentOverlayVisible] = useState(false);
  const paymentSocketRef = useRef<Socket | null>(null);

  // ----------------------------------------------------------------------------
  // 🔥 WEBSOCKET LISTENER — PAGAMENTO PIX CONFIRMADO
  // ----------------------------------------------------------------------------
      useEffect(() => {
      if (!user?.token) {
        paymentSocketRef.current?.disconnect();
        paymentSocketRef.current = null;
        return;
      }

      console.log("?? Conectando ao WebSocket para pagamentos...");

      const clientSocket = io(resolveSocketUrl(), {
        transports: ['websocket'],
        auth: { token: user.token },
      });

      let hideTimeout: ReturnType<typeof setTimeout> | null = null;

      const { handler: handlePix, cleanup: clearPaymentTimeout } =
        createPaymentConfirmedHandler(setPaymentOverlayVisible, runPaymentPostActions);

      clientSocket.on('pixPaymentConfirmed', handlePix);

      paymentSocketRef.current?.disconnect();
      paymentSocketRef.current = clientSocket;

      return () => {
        clearPaymentTimeout();
        clientSocket.off('pixPaymentConfirmed', handlePix);
        clientSocket.disconnect();
        if (paymentSocketRef.current === clientSocket) {
          paymentSocketRef.current = null;
        }
      };
    }, [user?.token]);

  // ----------------------------------------------------------------------------

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setRole(null);
      setIsRegistrationInProgress(false);
    } catch (error) {
      debugError('[AuthContext | logout] Erro de logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUnauthorized = useCallback(
    async ({
      originalRequest,
    }: {
      originalRequest: AxiosRequestConfig;
      error?: AxiosError;
    }) => {
      const headers = (originalRequest.headers ?? {}) as Record<string, unknown>;
      const silentHeader = headers['x-silent'] ?? headers['X-Silent'];
      const isSilent = silentHeader === '1' || silentHeader === 1 || silentHeader === true;
      const isMetaSilent = (originalRequest as any).meta?.silent === true;
      const urlStr = String(originalRequest.url ?? '');
      const isAuthCritical = /\/users\/me/.test(urlStr) || /\/auth\/me/.test(urlStr) || /\/auth\/refresh/.test(urlStr);

      if (isSilent || isMetaSilent) return;

      if (!isAuthCritical) throw new Error('Unauthorized');

      await logout();
      try {
        router.replace(AUTH_ROUTES.LOGIN as any);
      } catch {
        // ignore navigation failures
      }
      throw new Error('Unauthorized');
    },
    [logout],
  );

  useEffect(() => {
    setUnauthorizedCallback(handleUnauthorized);
    loadStoredData();
  }, [handleUnauthorized]);

  usePushRegistration(Boolean(user?.id));

  useEffect(() => {
    const removeRefreshListener = onAuthEvent(
      AuthEventType.SESSION_REFRESHED,
      (authData) => {
        const refreshedUser: AuthenticatedUserProfile = {
          ...authData.user,
          token: authData.accessToken,
        };
        setUser(refreshedUser);
        setRole(authData.user.role as UserRole);
        resetRevocationCallbackFlag();
        registerDevicePushToken().catch(() => {});
      },
    );

    const removeRevokedListener = onAuthEvent(AuthEventType.SESSION_REVOKED, () => {
      unregisterDevicePushToken().catch(() => {});
      setUser(null);
      setRole(null);
      setIsRegistrationInProgress(false);
      try {
        paymentSocketRef.current?.disconnect();
        paymentSocketRef.current = null;
      } catch {
        // ignore
      }
    });

    return () => {
      removeRefreshListener();
      removeRevokedListener();
    };
  }, []);

  const updateAuthState = (authData: AuthDataFromStorage) => {
    if (authData.token && authData.role && authData.id && authData.user) {
      const authenticatedUser: AuthenticatedUserProfile = {
        ...authData.user,
        token: authData.token,
      };
      setUser(authenticatedUser);
      setRole(authData.role);
    } else {
      setUser(null);
      setRole(null);
    }
  };

  const loadStoredData = async () => {
    try {
      setIsLoading(true);
      const authData: AuthDataFromStorage = await authService.loadAuthData();
      updateAuthState(authData);
    } catch (error) {
      debugError('[AuthContext | loadStoredData] Erro ao carregar dados armazenados:', error);
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<void> => {
    try {
      setIsLoading(true);
      const authData: AuthResponse = await authService.login(credentials);
      const authenticatedUser: AuthenticatedUserProfile = {
        ...authData.user,
        token: authData.accessToken,
      };
      setUser(authenticatedUser);
      setRole(authData.user.role as UserRole);
      resetRevocationCallbackFlag();
      registerDevicePushToken().catch(() => {});
    } catch (error) {
      debugError('[AuthContext | login] Erro de login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any, userType: 'client' | 'provider') => {
    try {
      setIsLoading(true);
      let authData: AuthResponse;
      if (userType === 'client') {
        authData = await authService.registerClient(userData);
      } else {
        authData = await authService.registerProvider(userData);
      }
      const authenticatedUser: AuthenticatedUserProfile = {
        ...authData.user,
        token: authData.accessToken,
      };
      setUser(authenticatedUser);
      setRole(authData.user.role as UserRole);
    } catch (error) {
      debugError('[AuthContext | register] Erro de registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpClient = async (data: RegisterClientDto) => {
    try {
      setIsLoading(true);
      await authService.registerClient(data);
      await login({ email: data.email, password: data.password });
    } catch (error: any) {
      debugError('[AuthContext | signUpClient] Erro no cadastro de cliente:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpProvider = async (data: RegisterProviderDto) => {
    try {
      setIsLoading(true);
      setIsRegistrationInProgress(true);
      await authService.registerProvider(data);
      await login({ email: data.email, password: data.password });
    } catch (error: any) {
      setIsRegistrationInProgress(false);
      debugError('[AuthContext | signUpProvider] Erro no cadastro de provedor:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const currentToken = user?.token || (await authService.loadAuthData()).token;
      if (!currentToken) {
        await logout();
        return;
      }

      const latestUserProfile: UserProfile = await userService.getMe();
      const authenticatedUser: AuthenticatedUserProfile = {
        ...latestUserProfile,
        token: currentToken,
      };
      setUser(authenticatedUser);
      setRole(latestUserProfile.role as UserRole);
      resetRevocationCallbackFlag();
      registerDevicePushToken().catch(() => {});
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = useCallback(
    async (updatedUserData?: Partial<UserProfile>) => {
      if (user) {
        if (updatedUserData) {
          const updatedProfile: UserProfile = {
            ...user,
            ...updatedUserData,
          };
          const updatedAuthenticatedUser: AuthenticatedUserProfile = {
            ...updatedProfile,
            token: user.token,
          };
          setUser(updatedAuthenticatedUser);
          setRole(updatedProfile.role as UserRole);

          await authService.storeAuthData({
            token: user.token,
            user: updatedProfile,
            id: user.id,
            role: user.role,
          });
        } else {
          await refreshUser();
        }
      }
    },
    [user, refreshUser],
  );

  const setAuthData = async (authData: AuthResponse) => {
    try {
      setIsLoading(true);
      const authenticatedUser: AuthenticatedUserProfile = {
        ...authData.user,
        token: authData.accessToken,
      };
      setUser(authenticatedUser);
      setRole(authData.user.role as UserRole);
      resetRevocationCallbackFlag();
      registerDevicePushToken().catch(() => {});
    } catch (error) {
      debugError('[AuthContext | setAuthData] Erro ao definir dados de autenticação:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    role,
    token: user?.token || null,
    login,
    logout,
    register,
    refreshUser,
    signUpClient,
    signUpProvider,
    isRegistrationInProgress,
    setIsRegistrationInProgress,
    setAuthData,
    updateUser,

    // 🔥 NOVO
    paymentOverlayVisible,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
