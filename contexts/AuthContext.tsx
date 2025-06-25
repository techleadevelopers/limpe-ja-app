// LimpeJaApp/contexts/AuthContext.tsx
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as authService from '../app/services/authService';
import { getUserProfile } from '../app/services/clientService'; // Importa getUserProfile

import {
  AuthResponseDto,
  LoginDto,
  RegisterClientDto,
  RegisterProviderDto,
  UserRole
} from '../app/types/backend/auth';
import { UserProfile } from '../app/types/backend/users'; // IMPORTAR UserProfile COMPLETO
import { BookingAddress } from '../app/types/backend/bookings'; // [CITE: 1] Importar BookingAddress para tipagem consistente

/**
 * @interface User
 * ATUALIZADO: Representa a estrutura de dados do usuário armazenada no contexto de autenticação.
 * Agora alinhada com UserProfile de 'users.ts' para incluir todos os dados relevantes.
 */
interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  address?: BookingAddress; // [CITE: 1] CORREÇÃO: Usar BookingAddress diretamente para a propriedade 'address' aqui
  walletBalance?: number;
  ordersCount?: number;
  totalEarningsLastMonth?: number;
  upcomingBookingsCount?: number;
  averageRating?: number;
  reviewCount?: number;
  // Adicionado para admins que também são clientes/provedores
  clientDetails?: UserProfile['clientDetails'];
  providerDetails?: UserProfile['providerDetails'];
}

/**
 * @interface AuthContextData
 * Define a forma do objeto de contexto de autenticação.
 */
interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: LoginDto) => Promise<void>;
  signUpClient: (data: RegisterClientDto) => Promise<void>;
  signUpProvider: (data: RegisterProviderDto) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updatedUserData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextData | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchAndSetUserProfile = async (userId: string, userEmail: string, userRole: UserRole, authToken: string): Promise<UserProfile | null> => {
    try {
      const fullProfile: UserProfile = await getUserProfile(); // Chama a rota /users/me

      let userAddressForContext: BookingAddress | undefined = undefined; // [CITE: 1] Usar BookingAddress para o tipo

      // Mapeia o endereço do perfil de cliente ou provedor para a propriedade 'address' no contexto
      // [CITE: 1] CORREÇÃO: Acessar .address do clientDetails ou providerDetails, que devem ser do tipo Client/Provider
      if (fullProfile.role === UserRole.CLIENT && fullProfile.clientDetails?.address) {
          userAddressForContext = fullProfile.clientDetails.address;
      } else if (fullProfile.role === UserRole.PROVIDER && fullProfile.providerDetails?.address) {
          userAddressForContext = fullProfile.providerDetails.address;
      }
      // Se o fullProfile.address existir diretamente na raiz do UserProfile (como pode ser o caso no backend),
      // você também pode incluí-lo:
      // userAddressForContext = fullProfile.address || userAddressForContext;


      setUser({
        ...fullProfile as User, // Copia todas as outras propriedades do UserProfile
        address: userAddressForContext // Sobrescreve/define a propriedade 'address' de nível superior
      });
      setToken(authToken);
      console.log('[AuthContext] Perfil completo carregado e estado atualizado.');
      console.log('[AuthContext] user.address no contexto APÓS ATUALIZAÇÃO:', userAddressForContext); // Depuração
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
        const storedToken = storedAuthData.token;
        const storedRole = storedAuthData.role;
        const storedId = storedAuthData.id;

        if (typeof storedToken === 'string' && storedToken && storedRole && storedId) {
          try {
            const decodedToken: any = jwtDecode(storedToken);

            const currentTime = Date.now() / 1000;
            if (decodedToken && decodedToken.sub && decodedToken.email && decodedToken.role && decodedToken.exp > currentTime) {
              console.log('[AuthContext] loadStoragedData: Token decodificado e válido. Buscando perfil completo...');
              await fetchAndSetUserProfile(storedId, decodedToken.email, decodedToken.role, storedToken);
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
  }, []); // [] means it runs only once on mount

  const signIn = async (credentials: LoginDto) => {
    console.log('[AuthContext] signIn: Chamado com credenciais:', credentials.email);
    setIsLoading(true);
    try {
      const response: AuthResponseDto = await authService.login(credentials);
      const decodedToken: any = jwtDecode(response.accessToken);

      // Await a chamada para garantir que o estado 'user' seja atualizado
      await fetchAndSetUserProfile(decodedToken.sub, decodedToken.email, decodedToken.role, response.accessToken);

      console.log('[AuthContext] signIn: Usuário logado com sucesso. (Redirecionamento será tratado pelo _layout.tsx)');
      // REMOVIDO: Toda a lógica de router.replace(...) foi removida daqui.
      // Ela será tratada no _layout.tsx que observa as mudanças no estado 'user'.
    } catch (error: any) {
      console.error("[AuthContext] signIn: Falha ao fazer login:", error.message);
      setUser(null);
      setToken(null);
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
      const decodedToken: any = jwtDecode(response.accessToken);
      await fetchAndSetUserProfile(decodedToken.sub, decodedToken.email, decodedToken.role, response.accessToken);

      console.log('[AuthContext] signUpClient: Cliente registrado com sucesso. (Redirecionamento será tratado pelo _layout.tsx)');
      // REMOVIDO: router.replace('/(client)/explore');
    } catch (error: any) {
      console.error("[AuthContext] signUpClient: Falha ao registrar cliente:", error.message);
      setUser(null);
      setToken(null);
      await authService.logout();
      throw error;
    } finally {
      setIsLoading(false);
      console.log('[AuthContext] signUpClient: Finalizado. isLoading:', false);
    }
  };

  const signUpProvider = async (data: RegisterProviderDto) => {
    console.log('[AuthContext] signUpProvider: Chamado para registrar provedor:', data.email);
    setIsLoading(true);
    try {
      const response: AuthResponseDto = await authService.registerProvider(data);
      const decodedToken: any = jwtDecode(response.accessToken);
      await fetchAndSetUserProfile(decodedToken.sub, decodedToken.email, decodedToken.role, response.accessToken);

      console.log('[AuthContext] signUpProvider: Provedor registrado com sucesso. (Redirecionamento será tratado pelo _layout.tsx)');
      // REMOVIDO: router.replace('/(provider)');
    } catch (error: any) {
      console.error("[AuthContext] signUpProvider: Falha ao registrar provedor:", error.message);
      setUser(null);
      setToken(null);
      await authService.logout();
      throw error;
    } finally {
      setIsLoading(false);
      console.log('[AuthContext] signUpProvider: Finalizado. isLoading:', false);
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut: Chamado.');
    setIsLoading(true);
    try {
      await authService.logout();

      setUser(null);
      setToken(null);
      console.log('[AuthContext] signOut: Usuário deslogado. Redirecionando...');
      router.replace('/(auth)/login');
    } catch (error: any) {
      console.error("[AuthContext] signOut: Falha ao deslogar:", error.message);
      setUser(null);
      setToken(null);
      throw error;
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
        return newUser;
      }
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
        signIn,
        signUpClient,
        signUpProvider,
        signOut,
        updateUser,
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