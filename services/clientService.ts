// LimpeJaApp/src/services/authService.ts
import axios, { AxiosError } from 'axios'; // <<--- CERTIFIQUE-SE QUE ESTA LINHA ESTÁ PRESENTE E CORRETA
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

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    console.log('Attempting login with:', credentials.email);
    // DESCOMENTE A LINHA ABAIXO PARA USAR A CHAMADA REAL À API E COMENTE/REMOVA A SIMULAÇÃO
    // const response = await api.post<LoginResponse>('/auth/login', credentials);
    // return response.data;

    // --- Início da Simulação (REMOVA OU COMENTE QUANDO FOR USAR A API REAL) ---
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      const errorSimulado: any = new Error('Credenciais inválidas (simulado)');
      errorSimulado.isAxiosError = true;
      errorSimulado.response = { data: { message: 'Usuário ou senha incorretos (simulado).' } };
      throw errorSimulado;
    }
    // --- Fim da Simulação ---

  } catch (error: unknown) {
    console.error('Login failed:', error);
    if (axios.isAxiosError(error)) { // Verifica se 'error' é um AxiosError
      // Agora 'error' é tratado como AxiosError dentro deste bloco
      if (error.response && error.response.data && typeof error.response.data.message === 'string') {
        throw new Error(error.response.data.message);
      } else if (error.response) {
        throw new Error('Erro ao fazer login. Resposta inesperada do servidor.');
      } else {
        throw new Error('Erro de conexão. Verifique sua internet ou tente mais tarde.');
      }
    }
    // Trata outros tipos de erro que possam ter uma propriedade 'message'
    if (error instanceof Error) {
      throw new Error(error.message || 'Ocorreu um erro desconhecido ao tentar fazer login.');
    }
    // Fallback final para erros completamente inesperados
    throw new Error('Ocorreu um erro inesperado durante o login.');
  }
};

// Outras funções como registerClient, registerProvider, etc.
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