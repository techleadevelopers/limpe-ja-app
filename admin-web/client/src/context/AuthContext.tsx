import { 
  login as apiLogin, 
  logout as apiLogout, 
  setUnauthorizedHandler,
  getProfile // ADICIONADO: Certifique-se de que essa função existe no seu lib/api
} from '@/lib/api'; 
import { AuthUser } from '@/lib/types'; 
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter'; 

// 1. Definição dos Tipos
interface User extends AuthUser {}

interface AuthContextType {
  user: User | null; 
  isAuthenticated: boolean; 
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void; 
  isLoading: boolean; 
}

// 2. Criação do Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Componente Provider de Autenticação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [, navigate] = useLocation(); 

  // Efeito para carregar e REVALIDAR o estado de autenticação
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userDataString = localStorage.getItem('userData');

      if (token && userDataString) {
        try {
          // 1. Carrega o que tem no localStorage para não travar a UI
          const cachedUserData: User = JSON.parse(userDataString);
          setUser(cachedUserData);
          setIsAuthenticated(true);

          // 2. BUSCA DADOS FRESCOS (Resolve o bug do status antigo no localStorage)
          const freshUserData = await getProfile(); 
          
          // Atualiza o estado e o storage com os dados novos do banco/prisma
          localStorage.setItem('userData', JSON.stringify(freshUserData));
          setUser(freshUserData);

          // Se o status mudou para VISIBLE e ela estava na tela de correção, manda pro dashboard
          if (
            window.location.pathname.includes('/profile/correction') && 
            (freshUserData as any).status !== 'VITRINE_IRREGULAR' &&
            (freshUserData as any).provider?.verificationStatus !== 'VITRINE_IRREGULAR'
          ) {
            navigate('/dashboard');
          }

        } catch (e) {
          console.error("Falha ao sincronizar perfil ou analisar localStorage:", e);
          // Se o token estiver vencido ou os dados corrompidos, limpa tudo
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [navigate]);

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

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true); 
    try {
      const { accessToken, user: userData } = await apiLogin(credentials); 
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      if ((userData as any).status === 'VITRINE_IRREGULAR' || (userData as any).provider?.verificationStatus === 'VITRINE_IRREGULAR') {
        navigate('/profile/correction');
      } else {
        navigate('/dashboard'); 
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error; 
    } finally {
      setIsLoading(false); 
    }
  };

  const logout = () => {
    apiLogout(); 
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login'); 
  };

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

// 4. Hook Customizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth chamado fora de um AuthProvider.');
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