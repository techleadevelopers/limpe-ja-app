// LimpeJaApp/src/services/authService.ts
import axios, { AxiosError } from 'axios'; // <<--- IMPORTAÇÃO ADICIONADA/CORRIGIDA
import { api } from './api';
import { User, AuthTokens } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// Exemplo de função de login
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    // Simulação de chamada de API - substitua pela sua lógica real
    console.log('Attempting login with:', credentials.email);
    // const response = await api.post<LoginResponse>('/auth/login', credentials);
    // return response.data;

    // --- Início da Simulação ---
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da rede
    if (credentials.email === 'cliente@limpeja.com' && credentials.password === 'cliente123') {
      return {
        user: { id: 'client1', email: 'cliente@limpeja.com', name: 'Cliente Teste', role: 'client', phone: '11999998888' },
        tokens: { accessToken: 'fakeClientAccessToken', refreshToken: 'fakeClientRefreshToken' },
      };
    } else if (credentials.email === 'pro@limpeja.com' && credentials.password === 'pro123') {
      return {
        user: { id: 'provider1', email: 'pro@limpeja.com', name: 'Pro Teste', role: 'provider', phone: '11777776666' },
        tokens: { accessToken: 'fakeProviderAccessToken', refreshToken: 'fakeProviderRefreshToken' },
      };
    } else {
      // Simulando um erro que seria retornado pela API
      const errorSimulado: any = new Error('Credenciais inválidas (simulado)');
      errorSimulado.isAxiosError = true; // Para simular um AxiosError
      errorSimulado.response = { data: { message: 'Usuário ou senha incorretos.' } };
      throw errorSimulado;
    }
    // --- Fim da Simulação ---

  } catch (error: unknown) { // 'error' é 'unknown' por padrão
    console.error('Login failed:', error);
    // Verifica se é um erro do Axios
    if (axios.isAxiosError(error)) {
      // Agora 'error' é do tipo AxiosError, podemos acessar 'response' com segurança
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.response) {
        throw new Error('Erro ao fazer login. Resposta inesperada do servidor.');
      } else {
        // Erro de rede (sem response), ex: servidor offline ou problema de DNS
        throw new Error('Erro de conexão. Verifique sua internet ou tente mais tarde.');
      }
    }
    // Se não for um AxiosError, ou se for um erro genérico
    if (error instanceof Error) {
      throw new Error(error.message || 'Ocorreu um erro desconhecido ao tentar fazer login.');
    }
    // Fallback final
    throw new Error('Ocorreu um erro inesperado.');
  }
};

// Você adicionaria outras funções como registerClient, registerProvider, forgotPassword, etc. aqui.
// Exemplo:
// export const registerClient = async (clientData: any): Promise<User> => {
//   try {
//     const response = await api.post<User>('/auth/register/client', clientData);
//     return response.data;
//   } catch (error: unknown) {
//     if (axios.isAxiosError(error) && error.response) {
//       throw new Error(error.response.data?.message || 'Erro ao registrar cliente.');
//     }
//     throw new Error('Erro desconhecido ao registrar cliente.');
//   }
// };