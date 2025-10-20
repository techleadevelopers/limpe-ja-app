// LimpeJaApp/contexts/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { AuthResponse, RegisterClientDto, RegisterProviderDto, UserRole, VerificationStatus } from '../types/backend/auth';
import authService from '../services/authService';
import { registerDevicePushToken } from '../services/pushService';
import { setUnauthorizedCallback } from '../services/api';
import { ProviderDisplayInfo } from '../types/backend/providers';
import { UserProfile } from '../types/backend/users';
import { ClientDetails } from '../types/backend/clients';
import { BookingAddress } from '../types/backend/bookings';
import userService from '../services/userService';
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

// utils de log sem recursão
const safeString = (v: any) => {
  try {
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
  } catch {
    return '[Object]';
  }
};

const debugLog   = (...args: unknown[]) => { if (__DEV__) console.log('[Auth]', ...args.map(safeString)); };
const debugWarn  = (...args: unknown[]) => { if (__DEV__) console.warn('[Auth]', ...args.map(safeString)); };
const debugError = (...args: unknown[]) => { if (__DEV__) console.error('[Auth]', ...args.map(safeString)); };

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

  const handleUnauthorized = useCallback(async () => {
    // Backend não expõe /auth/refresh no momento; trate 401 como sessão inválida
    await logout();
    throw new Error('Unauthorized');
  }, [logout]);

  useEffect(() => {
    setUnauthorizedCallback(handleUnauthorized);
    loadStoredData();
  }, [handleUnauthorized]);

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
      // registra token de push de forma não bloqueante
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
      debugLog('[AuthContext | signUpClient] Iniciando registro de cliente com dados:', { ...data, password: '***' });
      await authService.registerClient(data);
      debugLog('[AuthContext | signUpClient] Registro de cliente bem-sucedido. Fazendo login...');
      await login({ email: data.email, password: data.password });
      debugLog('[AuthContext | signUpClient] Login após registro concluído.');
    } catch (error: any) {
      debugError('[AuthContext | signUpClient] Erro no cadastro de cliente:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Falha no registro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const signUpProvider = async (data: RegisterProviderDto) => {
    try {
      setIsLoading(true);
      setIsRegistrationInProgress(true);
      debugLog('[AuthContext | signUpProvider] Iniciando registro de provedor com dados:', { ...data, password: '***' }); // Log sem senha
      await authService.registerProvider(data);
      debugLog('[AuthContext | signUpProvider] Registro de provedor bem-sucedido. Fazendo login...');
      await login({ email: data.email, password: data.password });
      debugLog('[AuthContext | signUpProvider] Login após registro concluído.');
    } catch (error: any) {
      debugError('[AuthContext | signUpProvider] Erro no cadastro de provedor:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
      setIsRegistrationInProgress(false);
      throw new Error(`Falha no registro: ${error.message}`); // Mensagem mais amigável para UI
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    debugLog('[AuthContext | refreshUser] Recarregando dados do usuário do backend...');
    try {
      setIsLoading(true);
      const currentToken = user?.token || (await authService.loadAuthData()).token;
      if (!currentToken) {
        debugWarn('[AuthContext | refreshUser] Nenhum token encontrado para refreshUser. Realizando logout.');
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
      debugLog('[AuthContext | refreshUser] Dados do usuário atualizados com sucesso do backend.');
      // garante registro de token de push quando app reabre
      registerDevicePushToken().catch(() => {});
    } catch (error: any) {
      debugError('[AuthContext | refreshUser] Erro ao recarregar dados do usuário do backend:', error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          debugLog('[AuthContext | refreshUser] Token inválido/expirado, realizando logout.');
          await logout();
        } else if (status === 404) {
          debugWarn('[AuthContext | refreshUser] /users/me retornou 404. Mantendo sessão atual e seguindo.');
          // Não lança; mantém o usuário atual e segue o fluxo
        } else {
          debugError('[AuthContext | refreshUser] Falha ao atualizar perfil. Mantendo sessão atual.');
        }
      } else {
        debugError('[AuthContext | refreshUser] Erro inesperado no refreshUser. Mantendo sessão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = useCallback(async (updatedUserData?: Partial<UserProfile>) => {
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
        debugLog('[AuthContext | updateUser] Perfil do usuário atualizado no contexto e no armazenamento.');
      } else {
        await refreshUser();
      }
    } else {
      debugWarn('[AuthContext | updateUser] Tentativa de atualizar usuário não logado.');
    }
  }, [user, refreshUser]);

  const setAuthData = async (authData: AuthResponse) => {
    try {
      setIsLoading(true);
      const authenticatedUser: AuthenticatedUserProfile = {
        ...authData.user,
        token: authData.accessToken,
      };
      setUser(authenticatedUser);
      setRole(authData.user.role as UserRole);
      // registra token de push de forma não bloqueante
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