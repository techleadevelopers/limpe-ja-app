// LimpeJaApp/contexts/AuthContext.tsx
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, ReactNode, useContext, useEffect, useState, useRef } from 'react'; // Import useRef
import * as authService from '../app/services/authService';
import { getUserProfile } from '../app/services/clientService'; // Ou um serviço mais genérico para buscar UserProfile

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

  // Variável derivada: `isAuthenticated` sempre reflete o estado atual de `user` e `token`.
  const isAuthenticated = !!user && !!token;

  // Ref para rastrear se o `loadStoragedData` já foi executado uma vez.
  // Ajuda a evitar múltiplos carregamentos em dev mode.
  const hasLoadedStoragedData = useRef(false);

  // Função auxiliar para tratamento de erros em catch blocks
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred.';
  };

  const fetchAndSetUserProfile = async (userId: string, userEmail: string, userRole: UserRole, authToken: string): Promise<UserProfile | null> => {
    console.groupCollapsed('[AuthContext | fetchAndSetUserProfile] Initiating profile fetch for:', userEmail);
    console.log('- User ID (from JWT):', userId);
    console.log('- User Role (from JWT):', userRole);
    console.log('- Auth Token present:', !!authToken);

    try {
      // Nota: getUserProfile() geralmente depende de um token no cabeçalho Authorization.
      // Certifique-se de que `authService.axiosInstance.defaults.headers.common['Authorization']`
      // está configurado COM o `authToken` ANTES de chamar `getUserProfile()`.
      // Seu `authService.loadAuthData()` já faz isso, então deve estar ok aqui.
      const fullProfile: UserProfile | null = await getUserProfile();

      if (!fullProfile) {
        console.warn('[AuthContext | fetchAndSetUserProfile] Full profile not received or empty. Returning null.');
        console.groupEnd();
        return null;
      }

      console.log('[AuthContext | fetchAndSetUserProfile] Full profile received. User ID:', fullProfile.id);
      console.log('- Full Profile Role:', fullProfile.role);
      console.log('- Provider Details:', fullProfile.providerDetails);
      console.log('- Client Details:', fullProfile.clientDetails);

      let userAddressForContext: BookingAddress | undefined = undefined;

      if (fullProfile.role === UserRole.CLIENT && fullProfile.clientDetails?.address) {
          userAddressForContext = fullProfile.clientDetails.address;
      } else if (fullProfile.role === UserRole.PROVIDER && fullProfile.providerDetails?.address) {
          userAddressForContext = fullProfile.providerDetails.address;
      }
      console.log('- Derived Address for Context:', userAddressForContext);

      // Usar a função de atualização do estado com `prevUser` para garantir o estado mais recente
      setUser(prevUser => {
        const newUser: User = {
          ...prevUser, // Inclui quaisquer outros campos que possam estar no estado anterior, mas não no fullProfile
          ...fullProfile as User, // Sobrescreve com os dados do fullProfile
          address: userAddressForContext // Garante que o endereço é setado
        };
        console.log('[AuthContext | fetchAndSetUserProfile] User state updated via setUser. New user email:', newUser.email);
        console.log('[AuthContext | fetchAndSetUserProfile] User role AFTER setUser:', newUser.role);
        console.log('[AuthContext | fetchAndSetUserProfile] Provider details AFTER setUser:', newUser.providerDetails);
        return newUser;
      });
      
      setToken(authToken); // Define o token. Isso também disparará uma re-renderização.
      console.log('[AuthContext | fetchAndSetUserProfile] Token state updated via setToken.');

      console.log('[AuthContext | fetchAndSetUserProfile] Profile loaded and state updated successfully.');
      console.groupEnd();
      return fullProfile;
    } catch (profileError) {
      console.error('[AuthContext | fetchAndSetUserProfile] ERROR: Failed to fetch full profile:', getErrorMessage(profileError));
      // Em caso de erro ao buscar o perfil completo, defina o usuário com dados básicos do JWT
      setUser({ id: userId, email: userEmail, role: userRole });
      setToken(authToken);
      console.warn('[AuthContext | fetchAndSetUserProfile] Could not load full profile. Using basic JWT data. This might cause issues downstream if full profile is required.');
      console.groupEnd();
      return null;
    }
  };

  useEffect(() => {
    // Adiciona uma guarda para evitar a execução múltipla em StrictMode ou hot reload
    if (hasLoadedStoragedData.current) {
      console.log('[AuthContext | useEffect] loadStoragedData already executed. Skipping.');
      return;
    }
    hasLoadedStoragedData.current = true; // Marca como executado

    async function loadStoragedData() {
      console.groupCollapsed('[AuthContext | loadStoragedData] Attempting to load stored authentication data...');
      try {
        const storedAuthData = await authService.loadAuthData(); // Carrega token e outros dados (se existirem)
        console.log('[AuthContext | loadStoragedData] Raw stored data:', storedAuthData);
        const storedToken = storedAuthData.token;
        const storedRole = storedAuthData.role;
        const storedId = storedAuthData.id;

        if (typeof storedToken === 'string' && storedToken && storedRole && storedId) {
          console.log('[AuthContext | loadStoragedData] Token and basic data found. Attempting to decode...');
          try {
            const decodedToken: any = jwtDecode(storedToken);
            console.log('[AuthContext | loadStoragedData] Decoded token payload:', decodedToken);

            const currentTime = Date.now() / 1000;
            if (decodedToken && decodedToken.sub && decodedToken.email && decodedToken.role && decodedToken.exp > currentTime) {
              console.log('[AuthContext | loadStoragedData] Decoded token is valid and not expired. Fetching full profile...');
              await fetchAndSetUserProfile(storedId, decodedToken.email, decodedToken.role, storedToken);
              console.log('[AuthContext | loadStoragedData] Full profile successfully loaded.');
            } else {
              console.warn('[AuthContext | loadStoragedData] Token invalid or expired. Cleaning up storage.');
              await authService.logout(); // Limpa token do storage
              setUser(null);
              setToken(null);
            }
          } catch (decodeError) {
            console.error('[AuthContext | loadStoragedData] ERROR: Failed to decode JWT token:', getErrorMessage(decodeError));
            await authService.logout();
            setUser(null);
            setToken(null);
          }
        } else {
          console.log('[AuthContext | loadStoragedData] No token found or incomplete data in storage. User not authenticated via storage.');
        }
      } catch (error) {
        console.error("[AuthContext | loadStoragedData] ERROR: Failed to load token from storage:", getErrorMessage(error));
        try {
          console.log('[AuthContext | loadStoragedData] Attempting to clean storage after load error.');
          await authService.logout();
        } catch (deleteError) {
          console.error('[AuthContext | loadStoragedData] CRITICAL ERROR: Failed to clean storage after load error:', getErrorMessage(deleteError));
        }
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false); // Define isLoading como false APÓS todas as tentativas de carregamento
        // Log do estado final *derivado* para clareza
        console.log('[AuthContext | loadStoragedData] Finished. isLoading:', false, 'isAuthenticated (derived current):', !!user && !!token);
        console.groupEnd();
      }
    }
    loadStoragedData();
  }, []); // Dependências vazias para rodar apenas uma vez na montagem inicial

  const signIn = async (credentials: LoginDto) => {
    console.groupCollapsed('[AuthContext | signIn] Initiating sign-in for:', credentials.email);
    setIsLoading(true);
    try {
      const response: AuthResponseDto = await authService.login(credentials);
      console.log('[AuthContext | signIn] Login response received.');
      const decodedToken: any = jwtDecode(response.accessToken);
      await fetchAndSetUserProfile(decodedToken.sub, decodedToken.email, decodedToken.role, response.accessToken);
      console.log('[AuthContext | signIn] User profile set after login. (Redirection will be handled by _layout.tsx)');
    } catch (error) {
      console.error("[AuthContext | signIn] ERROR: Failed to sign in:", getErrorMessage(error));
      setUser(null);
      setToken(null);
      console.log('[AuthContext | signIn] Cleaning up storage after failed login.');
      await authService.logout();
      throw error; // Re-throw to allow component to handle specific login errors
    } finally {
      setIsLoading(false);
      console.log('[AuthContext | signIn] Finished. isLoading:', false);
      console.groupEnd();
    }
  };

  const signUpClient = async (data: RegisterClientDto) => {
    console.groupCollapsed('[AuthContext | signUpClient] Initiating client registration for:', data.email);
    setIsLoading(true);
    try {
      const response: AuthResponseDto = await authService.registerClient(data);
      console.log('[AuthContext | signUpClient] Registration response received.');
      const decodedToken: any = jwtDecode(response.accessToken);
      await fetchAndSetUserProfile(decodedToken.sub, decodedToken.email, decodedToken.role, response.accessToken);
      console.log('[AuthContext | signUpClient] User profile set after registration. (Redirection will be handled by _layout.tsx)');
    } catch (error) {
      console.error("[AuthContext | signUpClient] ERROR: Failed to register client:", getErrorMessage(error));
      setUser(null);
      setToken(null);
      console.log('[AuthContext | signUpClient] Cleaning up storage after failed registration.');
      await authService.logout();
      throw error;
    } finally {
      setIsLoading(false);
      console.log('[AuthContext | signUpClient] Finished. isLoading:', false);
      console.groupEnd();
    }
  };

  const signUpProvider = async (data: RegisterProviderDto): Promise<UserProfile | null> => {
    console.groupCollapsed('[AuthContext | signUpProvider] Initiating provider registration for:', data.email);
    setIsLoading(true);
    // isRegistrationInProgress é setado como true aqui, e será setado como false no service-details.tsx
    // (ou VerifyAccountScreen se você decidir que o "registro" completo inclui a verificação inicial)
    setIsRegistrationInProgress(true); 
    console.log('[AuthContext | signUpProvider] isRegistrationInProgress set to TRUE.');
    try {
      const response: AuthResponseDto = await authService.registerProvider(data);
      console.log('[AuthContext | signUpProvider] Registration response received.');
      const decodedToken: any = jwtDecode(response.accessToken);
      
      const fullProfile = await fetchAndSetUserProfile(decodedToken.sub, decodedToken.email, decodedToken.role, response.accessToken);
      console.log('[AuthContext | signUpProvider] User profile set after registration.');
      
      console.log('[AuthContext | signUpProvider] Provider registered successfully. (Redirection will be handled by _layout.tsx)');
      return fullProfile;
    } catch (error) {
      console.error("[AuthContext | signUpProvider] ERROR: Failed to register provider:", getErrorMessage(error));
      setUser(null);
      setToken(null);
      console.log('[AuthContext | signUpProvider] Cleaning up storage after failed registration.');
      await authService.logout();
      throw error;
    } finally {
      setIsLoading(false);
      console.log('[AuthContext | signUpProvider] Finished. isLoading:', false);
      console.groupEnd();
    }
  };

  const signOut = async () => {
    console.groupCollapsed('[AuthContext | signOut] Initiating sign-out process.');
    setIsLoading(true);
    try {
      console.log('[AuthContext | signOut] Calling authService.logout()...');
      await authService.logout();
      console.log('[AuthContext | signOut] authService.logout() completed. Cleaning local state...');

      setUser(null);
      setToken(null);
      console.log('[AuthContext | signOut] Local state cleared. user:', null, 'token:', null);
      console.log('[AuthContext | signOut] isAuthenticated AFTER cleanup (derived):', !!user && !!token);

      console.log('[AuthContext | signOut] Redirection will be handled by _layout.tsx.');
    } catch (error) {
      console.error("[AuthContext | signOut] ERROR: Failed to sign out:", getErrorMessage(error), error);
      setUser(null);
      setToken(null); // Ensure state is reset even on error
    } finally {
      setIsLoading(false);
      console.log('[AuthContext | signOut] Finished. isLoading:', false);
      console.groupEnd();
    }
  };

  const updateUser = (updatedUserData: Partial<User>) => {
    console.groupCollapsed('[AuthContext | updateUser] Called with data:', updatedUserData);
    setUser(currentUser => {
      if (currentUser) {
        const newUser: User = { ...currentUser, ...updatedUserData };
        console.log('[AuthContext | updateUser] User updated in context. New email:', newUser.email);
        console.log('[AuthContext | updateUser] Updated User Role:', newUser.role);
        console.log('[AuthContext | updateUser] Updated Provider Details:', newUser.providerDetails);
        console.groupEnd();
        return newUser;
      }
      console.warn('[AuthContext | updateUser] Attempted to update a null user. No changes made.');
      console.groupEnd();
      return null;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: isAuthenticated, // Usando a variável derivada aqui
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