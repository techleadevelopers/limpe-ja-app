// LimpeJaApp/contexts/AuthContext.tsx
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as authService from '../app/services/authService';
import { getUserProfile } from '../app/services/clientService';

import {
  AuthResponseDto,
  LoginDto,
  RegisterClientDto,
  RegisterProviderDto,
  UserRole
} from '../app/types/backend/auth';
import { UserProfile } from '../app/types/backend/users';
import { BookingAddress } from '../app/types/backend/bookings';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  address?: BookingAddress;
  walletBalance?: number;
  ordersCount?: number;
  totalEarningsLastMonth?: number;
  upcomingBookingsCount?: number;
  averageRating?: number;
  reviewCount?: number;
  clientDetails?: UserProfile['clientDetails'];
  providerDetails?: UserProfile['providerDetails'];
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRegistrationInProgress: boolean;
  signIn: (credentials: LoginDto) => Promise<void>;
  signUpClient: (data: RegisterClientDto) => Promise<void>;
  signUpProvider: (data: RegisterProviderDto) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  updateUser: (updatedUserData: Partial<User>) => void;
  setIsRegistrationInProgress: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextData | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistrationInProgress, setIsRegistrationInProgress] = useState(false);
  const router = useRouter();

  const fetchAndSetUserProfile = async (userId: string, userEmail: string, userRole: UserRole, authToken: string): Promise<UserProfile | null> => {
    console.log('[AuthContext] fetchAndSetUserProfile: Iniciando busca de perfil para:', userEmail);
    try {
      const fullProfile: UserProfile | null = await getUserProfile();

      if (!fullProfile) {
        console.warn('[AuthContext] fetchAndSetUserProfile: Perfil completo não recebido ou vazio. Retornando null.');
        return null;
      }

      console.log('[AuthContext] fetchAndSetUserProfile: Perfil completo recebido.', fullProfile.id);

      let userAddressForContext: BookingAddress | undefined = undefined;

      if (fullProfile.role === UserRole.CLIENT && fullProfile.clientDetails?.address) {
          userAddressForContext = fullProfile.clientDetails.address;
      } else if (fullProfile.role === UserRole.PROVIDER && fullProfile.providerDetails?.address) {
          userAddressForContext = fullProfile.providerDetails.address;
      }

      setUser({
        ...fullProfile as User,
        address: userAddressForContext
      });
      setToken(authToken);
      console.log('[AuthContext] Perfil completo carregado e estado atualizado.');
      console.log('[AuthContext] user.address no contexto APÓS ATUALIZAÇÃO:', userAddressForContext);
      return fullProfile;
    } catch (profileError) {
      console.error('[AuthContext] Erro ao buscar perfil completo:', profileError);
      setUser({ id: userId, email: userEmail, role: userRole });
      setToken(authToken);
      console.warn('[AuthContext] Não foi possível carregar o perfil completo. Usando dados básicos do JWT.');
      return null;
    }
  };

  useEffect(() => {
    async function loadStoragedData() {
      console.log('[AuthContext] loadStoragedData: Tentando carregar dados armazenados...');
      try {
        const storedAuthData = await authService.loadAuthData();
        console.log('[AuthContext] loadStoragedData: Dados brutos do armazenamento:', storedAuthData);
        const storedToken = storedAuthData.token;
        const storedRole = storedAuthData.role;
        const storedId = storedAuthData.id;

        if (typeof storedToken === 'string' && storedToken && storedRole && storedId) {
          console.log('[AuthContext] loadStoragedData: Token e dados básicos encontrados. Tentando decodificar...');
          try {
            const decodedToken: any = jwtDecode(storedToken);
            console.log('[AuthContext] loadStoragedData: Token decodificado:', decodedToken);

            const currentTime = Date.now() / 1000;
            if (decodedToken && decodedToken.sub && decodedToken.email && decodedToken.role && decodedToken.exp > currentTime) {
              console.log('[AuthContext] loadStoragedData: Token decodificado e válido. Buscando perfil completo...');
              await fetchAndSetUserProfile(storedId, decodedToken.email, decodedToken.role, storedToken);
              console.log('[AuthContext] loadStoragedData: Perfil completo carregado com sucesso.');
            } else {
              console.warn('[AuthContext] loadStoragedData: Token inválido ou expirado. Limpando armazenamento.');
              await authService.logout();
              setUser(null);
              setToken(null);
            }
          } catch (decodeError) {
            console.error('[AuthContext] loadStoragedData: Erro ao decodificar token JWT:', decodeError);
            await authService.logout();
            setUser(null);
            setToken(null);
          }
        } else {
          console.log('[AuthContext] loadStoragedData: Nenhum token encontrado ou dados incompletos no armazenamento.');
        }
      } catch (error) {
        console.error("[AuthContext] loadStoragedData: Falha ao carregar token do armazenamento:", error);
        try {
          console.log('[AuthContext] loadStoragedData: Tentando limpar armazenamento após erro de carregamento.');
          await authService.logout();
        } catch (deleteError) {
          console.error('[AuthContext] loadStoragedData: CRÍTICO - Falha ao limpar após erro de carregamento:', deleteError);
        }
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
        console.log('[AuthContext] loadStoragedData: Finalizado. isLoading:', false, 'isAuthenticated:', !!user && !!token);
      }
    }
    loadStoragedData();
  }, []);

  const signIn = async (credentials: LoginDto) => {
    console.log('[AuthContext] signIn: Chamado com credenciais:', credentials.email);
    setIsLoading(true);
    try {
      const response: AuthResponseDto = await authService.login(credentials);
      console.log('[AuthContext] signIn: Resposta de login recebida.');
      const decodedToken: any = jwtDecode(response.accessToken);
      await fetchAndSetUserProfile(decodedToken.sub, decodedToken.email, decodedToken.role, response.accessToken);
      console.log('[AuthContext] signIn: Perfil do usuário definido após login.');

      console.log('[AuthContext] signIn: Usuário logado com sucesso. (Redirecionamento será tratado pelo _layout.tsx)');
    } catch (error: any) {
      console.error("[AuthContext] signIn: Falha ao fazer login:", error.message);
      setUser(null);
      setToken(null);
      console.log('[AuthContext] signIn: Limpando armazenamento após falha de login.');
      await authService.logout();
      throw error;
    } finally {
      setIsLoading(false);
      console.log('[AuthContext] signIn: Finalizado. isLoading:', false);
    }
  };

  const signUpClient = async (data: RegisterClientDto) => {
    console.log('[AuthContext] signUpClient: Chamado para registrar cliente:', data.email);
    setIsLoading(true);
    try {
      const response: AuthResponseDto = await authService.registerClient(data);
      console.log('[AuthContext] signUpClient: Resposta de registro recebida.');
      const decodedToken: any = jwtDecode(response.accessToken);
      await fetchAndSetUserProfile(decodedToken.sub, decodedToken.email, decodedToken.role, response.accessToken);
      console.log('[AuthContext] signUpClient: Perfil do usuário definido após registro.');

      console.log('[AuthContext] signUpClient: Cliente registrado com sucesso. (Redirecionamento será tratado pelo _layout.tsx)');
    } catch (error: any) {
      console.error("[AuthContext] signUpClient: Falha ao registrar cliente:", error.message);
      setUser(null);
      setToken(null);
      console.log('[AuthContext] signUpClient: Limpando armazenamento após falha de registro.');
      await authService.logout();
      throw error;
    } finally {
      setIsLoading(false);
      console.log('[AuthContext] signUpClient: Finalizado. isLoading:', false);
    }
  };

  const signUpProvider = async (data: RegisterProviderDto): Promise<UserProfile | null> => {
    console.log('[AuthContext] signUpProvider: Chamado para registrar provedor:', data.email);
    setIsLoading(true);
    setIsRegistrationInProgress(true); // <--- Mantenha isso aqui
    try {
      const response: AuthResponseDto = await authService.registerProvider(data);
      console.log('[AuthContext] signUpProvider: Resposta de registro recebida.');
      const decodedToken: any = jwtDecode(response.accessToken);
      
      const fullProfile = await fetchAndSetUserProfile(decodedToken.sub, decodedToken.email, decodedToken.role, response.accessToken);
      console.log('[AuthContext] signUpProvider: Perfil do usuário definido após registro.');
      
      console.log('[AuthContext] signUpProvider: Provedor registrado com sucesso. (Redirecionamento será tratado pelo _layout.tsx)');
      return fullProfile;
    } catch (error: any) {
      console.error("[AuthContext] signUpProvider: Falha ao registrar provedor:", error.message);
      setUser(null);
      setToken(null);
      console.log('[AuthContext] signUpProvider: Limpando armazenamento após falha de registro.');
      await authService.logout();
      throw error;
    } finally {
      setIsLoading(false);
      // REMOVA ESTA LINHA: setIsRegistrationInProgress(false);
      console.log('[AuthContext] signUpProvider: Finalizado. isLoading:', false);
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut: Função iniciada.');
    setIsLoading(true);
    try {
      console.log('[AuthContext] signOut: Chamando authService.logout()...');
      await authService.logout();
      console.log('[AuthContext] signOut: authService.logout() concluído. Limpando estado local...');

      setUser(null);
      setToken(null);
      console.log('[AuthContext] signOut: Estado local limpo. Valor de user:', null, 'Valor de token:', null);
      console.log('[AuthContext] signOut: isAuthenticated APÓS limpeza:', false);

      console.log('[AuthContext] signOut: Redirecionamento será tratado pelo _layout.tsx.');
    } catch (error: any) {
      console.error("[AuthContext] signOut: Falha ao deslogar:", error.message, error);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
      console.log('[AuthContext] signOut: Finalizado. isLoading:', false);
    }
  };

  const updateUser = (updatedUserData: Partial<User>) => {
    console.log('[AuthContext] updateUser: Chamado com dados:', updatedUserData);
    setUser(currentUser => {
      if (currentUser) {
        const newUser: User = { ...currentUser, ...updatedUserData };
        console.log('[AuthContext] updateUser: Usuário atualizado no contexto:', newUser.email);
        return newUser;
      }
      console.warn('[AuthContext] updateUser: Tentativa de atualizar usuário nulo.');
      return null;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isRegistrationInProgress,
        signIn,
        signUpClient,
        signUpProvider,
        signOut,
        updateUser,
        setIsRegistrationInProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};