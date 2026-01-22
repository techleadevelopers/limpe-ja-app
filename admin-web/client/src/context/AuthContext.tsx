// admin-web/client/src/context/AuthContext.tsx

import { login as apiLogin, logout as apiLogout, setUnauthorizedHandler } from '@/lib/api'; // Importa as funções de login/logout da API
import { AuthUser } from '@/lib/types'; // Importa AuthUser do types.ts
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter'; // CORREÇÃO: useLocation no lugar de useNavigate

// 1. Definição dos Tipos
// Interface para o objeto de usuário que será armazenado e usado no contexto.
// Usamos AuthUser do types.ts para consistência com a API.
interface User extends AuthUser {}

// Interface para a forma do objeto de contexto de autenticação.
interface AuthContextType {
  user: User | null; // O usuário logado, ou null se não houver.
  isAuthenticated: boolean; // Flag para indicar se o usuário está autenticado.
  // CORREÇÃO: A função login agora aceita credenciais e retorna uma Promise<void>
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void; // Função para realizar o logout.
  isLoading: boolean; // Flag para indicar se o estado de autenticação ainda está sendo carregado (ex: da localStorage).
}

// 2. Criação do Contexto
// Crie o contexto com um valor padrão de `undefined`.
// Isso permite que o hook `useAuth` verifique se ele está sendo usado fora do `AuthProvider`.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Componente Provider de Autenticação
/**
 * `AuthProvider` é um componente React que fornece o contexto de autenticação
 * para todos os seus componentes filhos.
 * Gerencia o estado de autenticação (usuário logado, token) usando localStorage.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Começa como true para indicar carregamento inicial.
  // CORREÇÃO: useLocation retorna um array, o segundo elemento é a função navigate
  const [, navigate] = useLocation(); 

  // Efeito para carregar o estado de autenticação do localStorage na montagem do componente.
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('userData');

    if (token && userDataString) {
      try {
        const userData: User = JSON.parse(userDataString);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (e) {
        // Se houver um erro ao parsear os dados, limpa o localStorage e desloga.
        console.error("Falha ao analisar dados do usuário do localStorage:", e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setIsLoading(false); // Finaliza o carregamento inicial.
  }, []); // Executa apenas uma vez na montagem do componente.

  useEffect(() => {
    const handleUnauthorized = async () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      navigate('/login');
    };

    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler();
  }, [navigate]);

  /**
   * Função para lidar com o processo de login.
   * Chama a API de login, armazena o token e os dados do usuário no localStorage e atualiza o estado.
   * @param credentials Objeto contendo email e password.
   */
  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true); // Ativa o estado de carregamento
    try {
      const { accessToken, user: userData } = await apiLogin(credentials); // Chama a função de login da API
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      // Verifica se o status do usuário é VITRINE_IRREGULAR para redirecionamento
      if ((userData as any).status === 'VITRINE_IRREGULAR' || (userData as any).provider?.verificationStatus === 'VITRINE_IRREGULAR') {
        navigate('/profile/correction');
      } else {
        navigate('/dashboard'); // Redireciona o usuário para o dashboard após o login.
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Aqui você pode adicionar lógica para mostrar uma mensagem de erro ao usuário (ex: toast)
      throw error; // Re-lança o erro para que o componente chamador possa tratá-lo (ex: exibir mensagem de erro)
    } finally {
      setIsLoading(false); // Desativa o estado de carregamento
    }
  };

  /**
   * Função para lidar com o processo de logout.
   * Remove o token e os dados do usuário do localStorage e limpa o estado.
   * Chama a função de logout da API (se houver).
   */
  const logout = () => {
    apiLogout(); // Chama a função de logout da API (que limpa localStorage)
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login'); // Redireciona o usuário para a página de login após o logout.
  };

  // O objeto de valor que será fornecido pelo contexto.
  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Hook Customizado para Consumir o Contexto
/**
 * Hook customizado `useAuth` para acessar facilmente o contexto de autenticação.
 * Garante que o hook seja usado dentro de um `AuthProvider`.
 * @returns O objeto de contexto de autenticação.
 * @throws Erro se `useAuth` for chamado fora de um `AuthProvider`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback seguro para evitar crash caso o Provider não envolva o componente (ex.: pré-visualização isolada).
    console.warn('useAuth chamado fora de um AuthProvider. Usando contexto padrão não autenticado.');
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => { throw new Error('AuthProvider ausente'); },
      logout: () => {},
    } satisfies AuthContextType;
  }
  return context;
};
