// LimpeJaApp/contexts/AuthContext.tsx

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
// IMPORTAÇÕES CORRIGIDAS AQUI:
// Usando o alias '@types' configurado no tsconfig.json para seus tipos
import { UserProfile } from '../types/backend/users';
import { RegisterClientDto, RegisterProviderDto, UserRole } from '../types/backend/auth';

// Importa authService e AuthResponse
import authService, { AuthResponse } from '../services/authService';
// Importa setUnauthorizedCallback do seu serviço de API (onde o Axios é configurado)
import { setUnauthorizedCallback } from '../services/api'; // <--- Importação adicionada

interface AuthContextType {
  user: UserProfile | null;
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
  // CORREÇÃO: Adicionando updateUser na interface
  updateUser: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
console.log('[AuthContext.tsx] AuthContext definido (após createContext):', AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isRegistrationInProgress, setIsRegistrationInProgress] = useState(false);

  const isAuthenticated = !!user;

  const logout = async () => {
    try {
      console.log('[AuthContext | logout] Iniciando logout...');
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setRole(null);
      console.log('[AuthContext | logout] Logout bem-sucedido.');
    } catch (error) {
      console.error('[AuthContext | logout] Erro de logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[AuthContext | useEffect] Configurando callback de logout e carregando dados.');
    setUnauthorizedCallback(logout);
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      console.log('[AuthContext | loadStoredData] Tentando carregar dados de autenticação armazenados...');
      setIsLoading(true);
      const authData = await authService.loadAuthData();
      if (authData.token && authData.role && authData.id && authData.user) {
        setUser(authData.user as UserProfile);
        setRole(authData.role as UserRole);
        console.log('[AuthContext | loadStoredData] Usuário autenticado a partir do armazenamento.');
      } else {
        console.log('[AuthContext | loadStoredData] Nenhum token encontrado ou dados incompletos no armazenamento. Usuário não autenticado via armazenamento.');
        setUser(null);
        setRole(null);
      }
    } catch (error) {
      console.error('[AuthContext | loadStoredData] Erro ao carregar dados armazenados:', error);
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
      console.log('[AuthContext | loadStoredData] Finalizado. isLoading:', false, 'isAuthenticated (derivado atual):', !!user);
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<void> => {
    try {
      setIsLoading(true);
      const authData = await authService.login(credentials);
      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);
      console.log('[AuthContext | login] Login bem-sucedido. Papel do usuário:', authData.user.role);
    } catch (error) {
      console.error('[AuthContext | login] Erro de login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any, userType: 'client' | 'provider') => {
    try {
      console.log(`[AuthContext | register] Iniciando registro como ${userType}...`);
      setIsLoading(true);
      let authData: AuthResponse;
      if (userType === 'client') {
        authData = await authService.registerClient(userData);
      } else {
        authData = await authService.registerProvider(userData);
      }
      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);
      console.log('[AuthContext | register] Registro bem-sucedido. Papel do usuário:', authData.user.role);
    } catch (error) {
      console.error('[AuthContext | register] Erro de registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpClient = async (data: RegisterClientDto) => {
    try {
      console.log('[AuthContext | signUpClient] Iniciando cadastro de cliente...');
      setIsLoading(true);
      const authData: AuthResponse = await authService.registerClient(data);
      await login({ email: data.email, password: data.password });
      console.log('[AuthContext | signUpClient] Cadastro de cliente bem-sucedido.');
    } catch (error) {
      console.error('[AuthContext | signUpClient] Erro no cadastro de cliente:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpProvider = async (data: RegisterProviderDto) => {
    try {
      console.log('[AuthContext | signUpProvider] Iniciando cadastro de provedor...');
      setIsLoading(true);
      setIsRegistrationInProgress(true);
      const authData: AuthResponse = await authService.registerProvider(data);
      await login({ email: data.email, password: data.password });
      console.log('[AuthContext | signUpProvider] Cadastro de provedor bem-sucedido.');
    } catch (error) {
      console.error('[AuthContext | signUpProvider] Erro no cadastro de provedor:', error);
      setIsRegistrationInProgress(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    console.log('[AuthContext | refreshUser] Atualizando dados do usuário...');
    await loadStoredData();
  };
  
  // CORREÇÃO: Implementação da função updateUser
  const updateUser = async (updatedUser: UserProfile) => {
    // A lógica aqui atualiza o estado do usuário no contexto
    // e também no armazenamento local (se for o caso)
    setUser(updatedUser);
    setRole(updatedUser.role as UserRole);
    // TODO: Adicionar lógica para salvar no armazenamento, se necessário
  };

  const setAuthData = async (authData: AuthResponse) => {
    try {
      console.log('[AuthContext | setAuthData] Definindo dados de autenticação no contexto...');
      setIsLoading(true);
      // A lógica de salvamento e atualização de estado está agora no método login
      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);
      console.log('[AuthContext | setAuthData] Dados de autenticação definidos no contexto. Papel:', authData.user.role);
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
    // CORREÇÃO: Adicionando updateUser ao objeto de valor do contexto
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  console.log('[useAuth] Valor de AuthContext antes de useContext:', AuthContext);
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };