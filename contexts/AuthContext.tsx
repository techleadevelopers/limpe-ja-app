// LimpeJaApp/contexts/AuthContext.tsx

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
// UserRole e VerificationStatus devem vir de onde são definidas (ex: '../types/backend/auth')
// Importa AuthResponse, RegisterClientDto, RegisterProviderDto, UserRole, VerificationStatus
import { AuthResponse, RegisterClientDto, RegisterProviderDto, UserRole, VerificationStatus } from '../types/backend/auth';

// Importa authService.
import authService from '../services/authService';
// Importa setUnauthorizedCallback do seu serviço de API (onde o Axios é configurado)
import { setUnauthorizedCallback } from '../services/api';

// NOVO: Definições de detalhes específicos de cliente/provedor
// IDEALMENTE, ESTAS INTERFACES DEVERIAM SER IMPORTADAS DE UM ARQUIVO DE TIPOS CENTRALIZADO (ex: '../types/backend/users')
// MAS ESTÃO AQUI PARA GARANTIR QUE O AuthContext E _layout.tsx COMPILAM SEM ERROS DE TIPAGEM.
// Por favor, mova estas definições para um local centralizado e importe-as.

export interface ClientDetails {
  // Adicione as propriedades reais dos detalhes do cliente aqui
  // Exemplo: address?: string | null; phone?: string | null;
}

export interface ProviderDisplayInfo { // Renomeado para ProviderDisplayInfo com base nos erros
  verificationStatus?: VerificationStatus | null; // Permite null
  // Adicione outras propriedades de ProviderDisplayInfo aqui
}

export interface BookingAddress {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode?: string; // Alterado para opcional com base nos erros anteriores
}

// DEFINIÇÃO EXPLÍCITA DE UserProfile AQUI para contornar problemas de tipo
// Esta definição deve corresponder EXATAMENTE ao que o seu backend retorna para um usuário,
// incluindo os detalhes específicos de cliente/provedor e permitindo 'null' onde aplicável.
// IDEALMENTE, ESTA INTERFACE DEVERIA SER IMPORTADA DE UM ARQUIVO DE TIPOS CENTRALIZADO (ex: '../types/backend/users')
// Mas mantemos aqui para compatibilidade imediata se a UserProfile importada não for completa.
export interface UserProfile {
  id: string;
  email: string;
  fullName?: string | null; // Alterado para permitir null
  cpf?: string | null; // Alterado para permitir null
  dateOfBirth?: string | null; // Alterado para permitir null
  phone?: string | null; // Alterado para permitir null
  avatarUrl?: string | null; // Adicionado e alterado para permitir null
  role: UserRole;
  createdAt?: string | null; // Adicionado e alterado para permitir null
  updatedAt?: string | null; // Adicionado e alterado para permitir null
  address?: BookingAddress | null; // Adicionado e alterado para permitir null
  clientDetails?: ClientDetails | null; // Alterado para permitir null
  providerDetails?: ProviderDisplayInfo | null; // Alterado para permitir null
  // Adicione outras propriedades comuns do perfil de usuário aqui
}

// REMOVIDA: A interface AuthResponse local, agora importada de ../types/backend/auth

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
  user: AuthenticatedUserProfile | null; // Alterado para AuthenticatedUserProfile
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
  setAuthData: (authData: AuthResponse) => Promise<void>; // Esta espera um AuthResponse completo
  updateUser: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
console.log('[AuthContext.tsx] AuthContext definido (após createContext):', AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUserProfile | null>(null); // Alterado para AuthenticatedUserProfile
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isRegistrationInProgress, setIsRegistrationInProgress] = useState(false);

  // isAuthenticated agora verifica a presença do token no objeto user
  const isAuthenticated = !!user && !!user.token;

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
      // O retorno de authService.loadAuthData() já é do tipo AuthDataFromStorage
      const authData: AuthDataFromStorage = await authService.loadAuthData();

      if (authData.token && authData.role && authData.id && authData.user) {
        // Se todos os dados necessários estiverem presentes, construímos AuthenticatedUserProfile
        const authenticatedUser: AuthenticatedUserProfile = {
          ...authData.user, // Copia as propriedades de UserProfile
          token: authData.token, // Adiciona o token (já checamos que não é null)
        };
        setUser(authenticatedUser);
        setRole(authData.role); // authData.role é UserRole | null, mas já checamos que existe
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
      console.log('[AuthContext | loadStoredData] Finalizado. isLoading:', false, 'isAuthenticated (derivado atual):', !!user && !!user.token);
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<void> => {
    try {
      setIsLoading(true);
      // authService.login retorna AuthResponse (com accessToken e user)
      const authData: AuthResponse = await authService.login(credentials);
      // Constrói o objeto AuthenticatedUserProfile usando accessToken como token
      const authenticatedUser: AuthenticatedUserProfile = {
        ...authData.user,
        token: authData.accessToken, // Mapeia accessToken para token
      };
      setUser(authenticatedUser);
      setRole(authData.user.role as UserRole); // O papel está em authData.user
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
      // Constrói o objeto AuthenticatedUserProfile usando accessToken como token
      const authenticatedUser: AuthenticatedUserProfile = {
        ...authData.user,
        token: authData.accessToken, // Mapeia accessToken para token
      };
      setUser(authenticatedUser);
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
      // authService.registerClient deve retornar AuthResponse, mas o login subsequente é o que define o estado
      await authService.registerClient(data); // Esta chamada pode retornar AuthResponse, mas não é usada diretamente aqui
      await login({ email: data.email, password: data.password }); // O login já constrói AuthenticatedUserProfile
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
      // authService.registerProvider deve retornar AuthResponse, mas o login subsequente é o que define o estado
      await authService.registerProvider(data); // Esta chamada pode retornar AuthResponse, mas não é usada diretamente aqui
      await login({ email: data.email, password: data.password }); // O login já constrói AuthenticatedUserProfile
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

  const updateUser = async (updatedUser: UserProfile) => {
    if (user) {
      const updatedAuthenticatedUser: AuthenticatedUserProfile = {
        ...updatedUser,
        token: user.token, // Mantém o token existente
      };
      setUser(updatedAuthenticatedUser);
      setRole(updatedUser.role as UserRole);
      // TODO: Adicionar lógica para salvar no armazenamento, se necessário
    } else {
      console.warn('[AuthContext | updateUser] Tentativa de atualizar usuário não logado.');
    }
  };

  const setAuthData = async (authData: AuthResponse) => {
    try {
      console.log('[AuthContext | setAuthData] Definindo dados de autenticação no contexto...');
      setIsLoading(true);
      // Constrói o objeto AuthenticatedUserProfile usando accessToken como token
      const authenticatedUser: AuthenticatedUserProfile = {
        ...authData.user,
        token: authData.accessToken, // Mapeia accessToken para token
      };
      setUser(authenticatedUser);
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