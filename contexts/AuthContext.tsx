// LimpeJaApp/contexts/AuthContext.tsx

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../../app/types/backend/users'; // Caminho para UserProfile
import authService from '../services/authService'; // Mantém a importação como está
import { RegisterClientDto, RegisterProviderDto, UserRole } from '../types/backend/auth';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  // login: (credentials: { phone: string; otp: string }) => Promise<void>; // REMOVIDO: Não existe mais no authService
  logout: () => Promise<void>;
  register: (userData: any, userType: 'client' | 'provider') => Promise<void>;
  // sendOtp: (phone: string) => Promise<void>; // REMOVIDO: Não existe mais no authService
  refreshUser: () => Promise<void>;
  signUpClient: (data: RegisterClientDto) => Promise<void>;
  signUpProvider: (data: RegisterProviderDto) => Promise<void>;
  isRegistrationInProgress: boolean;
  setIsRegistrationInProgress: (inProgress: boolean) => void;
  // CORREÇÃO: Adicionado o método loginWithFirebaseIdToken à interface
  loginWithFirebaseIdToken: (idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
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
        // CORREÇÃO: Cast explícito para UserProfile e UserRole (para silenciar o erro de duplicação, mas a causa raiz é o cache)
        setUser(authData.user as UserProfile);
        setRole(authData.role as UserRole);
        console.log('[AuthContext | loadStoragedData] User authenticated from storage.');
      } else {
        console.log('[AuthContext | loadStoragedData] No token found or incomplete data in storage. User not authenticated via storage.');
        setUser(null);
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

  // REMOVIDO: O método sendOtp não existe mais no authService
  /*
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
  */

  // REMOVIDO: O método login não existe mais no authService
  /*
  const login = async (credentials: { phone: string; otp: string }) => {
    try {
      setIsLoading(true);
      const authData = await authService.login(credentials);

      // CORREÇÃO: Cast explícito para UserProfile e UserRole
      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);

      console.log('[AuthContext] Login successful:', authData.user.role);

    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  */

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

  const register = async (userData: any, userType: 'client' | 'provider') => {
    try {
      setIsLoading(true);

      let authData;
      if (userType === 'client') {
        authData = await authService.registerClient(userData);
      } else {
        authData = await authService.registerProvider(userData);
      }

      // CORREÇÃO: Cast explícito para UserProfile e UserRole
      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);

      console.log('[AuthContext] Registration successful:', authData.user.role);

    } catch (error) {
      console.error('[AuthContext] Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpClient = async (data: RegisterClientDto) => {
    try {
      setIsLoading(true);
      const authData = await authService.registerClient(data);
      // CORREÇÃO: Cast explícito para UserProfile e UserRole
      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);
      console.log('[AuthContext] Client registration successful.');
    } catch (error) {
      console.error('[AuthContext] Client registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpProvider = async (data: RegisterProviderDto) => {
    try {
      setIsLoading(true);
      setIsRegistrationInProgress(true);
      const authData = await authService.registerProvider(data);
      // CORREÇÃO: Cast explícito para UserProfile e UserRole
      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);
      console.log('[AuthContext] Provider registration successful.');
    } catch (error) {
      console.error('[AuthContext] Provider registration error:', error);
      setIsRegistrationInProgress(false);
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

  // NOVO: Método para login com o ID Token do Firebase
  const loginWithFirebaseIdToken = async (idToken: string) => {
    try {
      console.log('[AuthContext] Iniciando login com Firebase ID Token...');
      // ADICIONADO: Log para capturar o Firebase ID Token para teste
      console.log("Firebase ID Token para teste:", idToken);
      // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      setIsLoading(true);
      // Chama o novo método do authService para verificar o ID Token com o backend
      const authData = await authService.verifyFirebaseIdToken({ idToken });

      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);

      console.log('[AuthContext] Login com Firebase ID Token bem-sucedido:', authData.user.role);

    } catch (error) {
      console.error('[AuthContext] Erro no login com Firebase ID Token:', error);
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
    // login, // REMOVIDO do valor do contexto
    logout,
    register,
    // sendOtp, // REMOVIDO do valor do contexto
    refreshUser,
    signUpClient,
    signUpProvider,
    isRegistrationInProgress,
    setIsRegistrationInProgress,
    loginWithFirebaseIdToken, // Adicionado ao valor do contexto
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

export default AuthContext;