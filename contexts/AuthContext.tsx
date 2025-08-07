// LimpeJaApp/contexts/AuthContext.tsx

import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { AuthResponse, RegisterClientDto, RegisterProviderDto, UserRole, VerificationStatus } from '../types/backend/auth';
import authService from '../services/authService';
import { setUnauthorizedCallback } from '../services/api';
import { ProviderDisplayInfo } from '../types/backend/providers';
import { UserProfile } from '../types/backend/users';
import { ClientDetails } from '../types/backend/clients';
import { BookingAddress } from '../types/backend/bookings';
import userService from '../services/userService';

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
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any, userType: 'client' | 'provider') => Promise<void>;
  refreshUser: () => Promise<void>;
  signUpClient: (data: RegisterClientDto) => Promise<void>;
  signUpProvider: (data: RegisterProviderDto) => Promise<void>;
  isRegistrationInProgress: boolean;
  setIsRegistrationInProgress: (inProgress: boolean) => void;
  setAuthData: (authData: AuthResponse) => Promise<void>;
  updateUser: (updatedUser?: Partial<UserProfile>) => Promise<void>; // <-- Corrigido aqui
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
console.log('[AuthContext.tsx] AuthContext definido (após createContext):', AuthContext);

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
      console.error('[AuthContext | logout] Erro de logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedCallback(logout);
    loadStoredData();
  }, [logout]);

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
      console.error('[AuthContext | loadStoredData] Erro ao carregar dados armazenados:', error);
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
    } catch (error) {
      console.error('[AuthContext | login] Erro de login:', error);
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
      console.error('[AuthContext | register] Erro de registro:', error);
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
    } catch (error) {
      console.error('[AuthContext | signUpClient] Erro no cadastro de cliente:', error);
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
    } catch (error) {
      console.error('[AuthContext | signUpProvider] Erro no cadastro de provedor:', error);
      setIsRegistrationInProgress(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    console.log('[AuthContext | refreshUser] Recarregando dados do usuário do backend...');
    try {
      setIsLoading(true);
      const currentToken = user?.token || (await authService.loadAuthData()).token;
      if (!currentToken) {
        console.warn('[AuthContext | refreshUser] Nenhum token encontrado para refreshUser. Realizando logout.');
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
      console.log('[AuthContext | refreshUser] Dados do usuário atualizados com sucesso do backend.');
    } catch (error) {
      console.error('[AuthContext | refreshUser] Erro ao recarregar dados do usuário do backend:', error);
      await logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = useCallback(async (updatedUserData?: Partial<UserProfile>) => { // <-- updatedUserData agora é opcional
    if (user) {
      if (updatedUserData) { // Se novos dados foram fornecidos, use-os
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
        console.log('[AuthContext | updateUser] Perfil do usuário atualizado no contexto e no armazenamento.');
      } else { // Se nenhum dado foi fornecido, recarregue do backend
        await refreshUser();
      }
    } else {
      console.warn('[AuthContext | updateUser] Tentativa de atualizar usuário não logado.');
    }
  }, [user, refreshUser]); // <- Adicionado refreshUser às dependências

  const setAuthData = async (authData: AuthResponse) => {
    try {
      setIsLoading(true);
      const authenticatedUser: AuthenticatedUserProfile = {
        ...authData.user,
        token: authData.accessToken,
      };
      setUser(authenticatedUser);
      setRole(authData.user.role as UserRole);
    } catch (error) {
      console.error('[AuthContext | setAuthData] Erro ao definir dados de autenticação:', error);
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