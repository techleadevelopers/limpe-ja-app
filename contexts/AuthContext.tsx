// LimpeJaApp/contexts/AuthContext.tsx

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
// IMPORTAÇÕES CORRIGIDAS AQUI:
// Usando o alias '@types' configurado no tsconfig.json para seus tipos
import { UserProfile } from '../types/backend/users';
import { RegisterClientDto, RegisterProviderDto, UserRole } from '../types/backend/auth';

// Importa authService e AuthResponse
import authService, { AuthResponse } from '../services/authService'; //
// Importa setUnauthorizedCallback do seu serviço de API (onde o Axios é configurado)
import { setUnauthorizedCallback } from '../services/api'; // <--- Importação adicionada

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  // CORREÇÃO: login agora aceita email e senha diretamente
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  register: (userData: any, userType: 'client' | 'provider') => Promise<void>;
  refreshUser: () => Promise<void>;
  signUpClient: (data: RegisterClientDto) => Promise<void>;
  signUpProvider: (data: RegisterProviderDto) => Promise<void>;
  isRegistrationInProgress: boolean;
  setIsRegistrationInProgress: (inProgress: boolean) => void;
  // setAuthData agora recebe AuthResponse
  setAuthData: (authData: AuthResponse) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
// Adiciona um log para verificar se AuthContext é definido imediatamente após a criação
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

  // Função de logout (definida aqui para ser usada no callback)
  const logout = async () => {
    try {
      console.log('[AuthContext | logout] Iniciando logout...');
      setIsLoading(true);
      await authService.logout(); // Chama o logout do serviço, que limpa o AsyncStorage e o token do Axios

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
    // Registra a função de logout no interceptor do Axios.
    // Isso garante que o interceptor tenha acesso à função logout do contexto.
    setUnauthorizedCallback(logout); // <--- Chamada para registrar o callback

    loadStoredData();
  }, []); // A dependência vazia garante que isso roda uma vez na montagem

  const loadStoredData = async () => {
    try {
      console.log('[AuthContext | loadStoredData] Tentando carregar dados de autenticação armazenados...');
      setIsLoading(true);

      const authData = await authService.loadAuthData();

      console.log('[AuthContext | loadStoredData] Dados brutos armazenados:', {
        token: !!authData.token,
        role: authData.role,
        id: authData.id
      });

      if (authData.token && authData.role && authData.id && authData.user) {
        // O token é definido no Axios pelo authService.loadAuthData()
        // Uma requisição para validar o token pode ser feita aqui se necessário,
        // mas o interceptor de 401 já irá lidar com tokens inválidos em requisições subsequentes.
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

  // CORREÇÃO: Função de login agora aceita email e senha.
  // Removeu a lógica e os tipos relacionados a phoneNumber, otpCode e 'type'.
  const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      let authData: AuthResponse;

      console.log('[AuthContext | login] Tentando login com e-mail e senha.');

      // CORREÇÃO: Chama o método de login por e-mail/senha do authService
      // IMPORTANTE: O authService.login (o que aceita email/senha) deve ser o método correto.
      // Se o seu authService só tem loginWithPassword que espera phone, precisará ajustar lá.
      authData = await authService.login({ email: credentials.email, password: credentials.password }); //

      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);

      console.log('[AuthContext | login] Login bem-sucedido. Papel do usuário:', authData.user.role);
      return authData;
    } catch (error) {
      console.error('[AuthContext | login] Erro de login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // refreshUser e setAuthData permanecem inalterados
  const register = async (userData: any, userType: 'client' | 'provider') => {
    try {
      console.log(`[AuthContext | register] Iniciando registro como ${userType}...`);
      setIsLoading(true);

      let authData: AuthResponse;

      if (userType === 'client') {
        authData = await authService.registerClient(userData); //
      } else {
        authData = await authService.registerProvider(userData); //
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
      const authData: AuthResponse = await authService.registerClient(data); //
      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);
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
      const authData: AuthResponse = await authService.registerProvider(data); //
      setUser(authData.user as UserProfile);
      setRole(authData.user.role as UserRole);
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

  // Método para definir os dados de autenticação no contexto
  const setAuthData = async (authData: AuthResponse) => {
    try {
      console.log('[AuthContext | setAuthData] Definindo dados de autenticação no contexto...');
      setIsLoading(true);
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

// Adicionado: Exportação nomeada do AuthContext
export { AuthContext };