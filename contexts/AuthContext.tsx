// LimpeJaApp/contexts/AuthContext.tsx

import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
// UserRole e VerificationStatus devem vir de onde são definidas (ex: '../types/backend/auth')
// Importa AuthResponse, RegisterClientDto, RegisterProviderDto, UserRole, VerificationStatus
import { AuthResponse, RegisterClientDto, RegisterProviderDto, UserRole, VerificationStatus } from '../types/backend/auth';

// Importa authService.
import authService from '../services/authService';
// Importa setUnauthorizedCallback do seu serviço de API (onde o Axios é configurado)
import { setUnauthorizedCallback } from '../services/api';

// [CORREÇÃO] Importa as interfaces de tipagem do arquivo centralizado
import { ProviderDisplayInfo } from '../types/backend/providers';
import { UserProfile } from '../types/backend/users';
import { ClientDetails } from '../types/backend/clients'; // [CORREÇÃO] Agora importa apenas ClientDetails de clients.ts
import { BookingAddress } from '../types/backend/bookings'; // [CORREÇÃO] Importa BookingAddress do arquivo correto

// NOVO: Importa o serviço de usuário para buscar o perfil completo do backend
import userService from '../services/userService'; // <--- ADICIONADO

// REMOVIDAS as definições locais de ClientDetails, ProviderDisplayInfo, BookingAddress e UserProfile
// para evitar conflitos e usar uma fonte única de tipos.

// NOVO: Tipo para dados carregados do armazenamento, que podem ser nulos.
// Isso corresponde ao tipo de retorno de authService.loadAuthData().
interface AuthDataFromStorage {
  token: string | null;
  user: UserProfile | null;
  id: string | null;
  role: UserRole | null;
}

// NOVO: Tipo que representa o perfil do usuário autenticado no contexto, incluindo o token
// Este tipo é interno ao contexto e combina UserProfile com o token de acesso.
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
  updateUser: (updatedUser: UserProfile) => Promise<void>;
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
      // CORREÇÃO: Reseta o estado de registro ao fazer logout
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

  // Helper para atualizar o estado do usuário no contexto
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

  // !!! CORREÇÃO CRÍTICA AQUI: refreshUser agora busca do backend !!!
  const refreshUser = async () => {
    console.log('[AuthContext | refreshUser] Recarregando dados do usuário do backend...');
    try {
      setIsLoading(true);
      // Pega o token atual do estado do usuário ou do armazenamento
      const currentToken = user?.token || (await authService.loadAuthData()).token;
      if (!currentToken) {
        console.warn('[AuthContext | refreshUser] Nenhum token encontrado para refreshUser. Realizando logout.');
        await logout(); // Sem token, significa que o usuário não está autenticado
        return;
      }

      // Faz uma chamada à API para buscar o perfil de usuário mais recente
      // Assumindo que userService.getMe() existe e retorna UserProfile
      const latestUserProfile: UserProfile = await userService.getMe(); // <--- CHAMA O BACKEND AQUI

      // Atualiza o estado do usuário no contexto
      const authenticatedUser: AuthenticatedUserProfile = {
        ...latestUserProfile,
        token: currentToken, // Mantém o token existente
      };
      setUser(authenticatedUser);
      setRole(latestUserProfile.role as UserRole);
      console.log('[AuthContext | refreshUser] Dados do usuário atualizados com sucesso do backend.');
    } catch (error) {
      console.error('[AuthContext | refreshUser] Erro ao recarregar dados do usuário do backend:', error);
      // Se a busca falhar, pode significar que o token é inválido ou expirou
      await logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUser: UserProfile) => {
    if (user) {
      const updatedAuthenticatedUser: AuthenticatedUserProfile = {
        ...updatedUser,
        token: user.token,
      };
      setUser(updatedAuthenticatedUser);
      setRole(updatedUser.role as UserRole);
    } else {
      console.warn('[AuthContext | updateUser] Tentativa de atualizar usuário não logado.');
    }
  };

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
