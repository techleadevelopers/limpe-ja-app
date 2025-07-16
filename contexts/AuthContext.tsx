// LimpeJaApp/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../app/services/authService';
import { UserProfile } from '../app/types/backend/users';
import { UserRole, RegisterClientDto, RegisterProviderDto } from '../app/types/backend/auth'; // Import RegisterClientDto e RegisterProviderDto

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (credentials: { phone: string; otp: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any, userType: 'client' | 'provider') => Promise<void>; // Manter se ainda usado, caso contrário, pode remover
  sendOtp: (phone: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  signUpClient: (data: RegisterClientDto) => Promise<void>;
  signUpProvider: (data: RegisterProviderDto) => Promise<void>;
  // NOVO: Adicionado estado e setter para o progresso do registro
  isRegistrationInProgress: boolean;
  setIsRegistrationInProgress: (inProgress: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  // NOVO: Estado para controlar o progresso do registro
  const [isRegistrationInProgress, setIsRegistrationInProgress] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      console.log('[AuthContext | loadStoragedData] Attempting to load stored authentication data...');
      setIsLoading(true);

      const authData = await authService.loadAuthData();

      console.log('[AuthContext | loadStoragedData] Raw stored data:', {
        token: !!authData.token,
        role: authData.role,
        id: authData.id
      });

      if (authData.token && authData.role && authData.id && authData.user) {
        setUser(authData.user);
        setRole(authData.role as UserRole); // Cast para UserRole
        console.log('[AuthContext | loadStoragedData] User authenticated from storage.');
      } else {
        console.log('[AuthContext | loadStoragedData] No token found or incomplete data in storage. User not authenticated via storage.');
        setUser(null); // Garante que o user é null se os dados estiverem incompletos
        setRole(null);
      }

    } catch (error) {
      console.error('[AuthContext | loadStoragedData] Error loading stored data:', error);
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
      console.log('[AuthContext | loadStoragedData] Finished. isLoading:', false, 'isAuthenticated (derived current):', !!user);
    }
  };

  const sendOtp = async (phone: string) => {
    try {
      setIsLoading(true);
      await authService.sendOtp(phone);
    } catch (error) {
      console.error('[AuthContext] Erro ao enviar OTP:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { phone: string; otp: string }) => {
    try {
      setIsLoading(true);
      const authData = await authService.login(credentials);

      setUser(authData.user);
      setRole(authData.user.role);

      console.log('[AuthContext] Login successful:', authData.user.role);

    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();

      setUser(null);
      setRole(null);

      console.log('[AuthContext] Logout successful');

    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro geral (manter se ainda usada, caso contrário, pode remover)
  const register = async (userData: any, userType: 'client' | 'provider') => {
    try {
      setIsLoading(true);

      let authData;
      if (userType === 'client') {
        authData = await authService.registerClient(userData);
      } else {
        authData = await authService.registerProvider(userData);
      }

      setUser(authData.user);
      setRole(authData.user.role);

      console.log('[AuthContext] Registration successful:', authData.user.role);

    } catch (error) {
      console.error('[AuthContext] Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função signUpClient
  const signUpClient = async (data: RegisterClientDto) => {
    try {
      setIsLoading(true);
      const authData = await authService.registerClient(data);
      setUser(authData.user);
      setRole(authData.user.role);
      console.log('[AuthContext] Client registration successful.');
    } catch (error) {
      console.error('[AuthContext] Client registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função signUpProvider
  const signUpProvider = async (data: RegisterProviderDto) => {
    try {
      setIsLoading(true);
      setIsRegistrationInProgress(true); // Define o flag de progresso
      const authData = await authService.registerProvider(data);
      setUser(authData.user);
      setRole(authData.user.role);
      console.log('[AuthContext] Provider registration successful.');
    } catch (error) {
      console.error('[AuthContext] Provider registration error:', error);
      setIsRegistrationInProgress(false); // Reseta o flag em caso de erro
      throw error;
    } finally {
      setIsLoading(false);
      // O flag isRegistrationInProgress será resetado para false pelo componente que chamou signUpProvider
      // uma vez que o processo de registro em várias etapas esteja completo.
    }
  };

  const refreshUser = async () => {
    await loadStoredData();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    role,
    login,
    logout,
    register,
    sendOtp,
    refreshUser,
    signUpClient,
    signUpProvider,
    // NOVO: Expor o estado e o setter
    isRegistrationInProgress,
    setIsRegistrationInProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Exporta o hook useAuth diretamente do contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;