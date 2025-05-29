// LimpeJaApp/src/services/authService.ts
import axios, { AxiosError } from 'axios';
import { api } from './api'; // Importe a instância do Axios configurada
import { User, AuthTokens } from '../types'; // Certifique-se de que User e AuthTokens estão definidos em ../types/index.ts ou similar

// --- Interfaces para os dados de entrada das funções ---
interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

interface RegisterClientData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface RegisterProviderData {
  // Dados pessoais
  nomeCompleto: string;
  email: string; // << CORREÇÃO: Adicionada a propriedade email
  cpf: string;
  dataNascimento: string; // YYYY-MM-DD
  telefone: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  // Dados de serviço
  experiencia: string;
  servicosOferecidos: string;
  estruturaPreco: string;
  areasAtendimento: string;
  anosExperiencia: number;
  avatarUri: string | null; // URI local da imagem, que seria enviada para o Firebase Storage
  password: string; // Senha para o provedor
}

// --- Funções de Autenticação ---

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    // --- Início da Simulação ---
    console.log('[authService] Attempting login with:', credentials.email);
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
      errorSimulado.isAxiosError = true;
      errorSimulado.response = { data: { message: 'Usuário ou senha incorretos.' }, status: 401 };
      throw errorSimulado;
    }
    // --- Fim da Simulação ---

    // --- Código real (descomente e adapte quando integrar com seu backend) ---
    // const response = await api.post<LoginResponse>('/auth/login', credentials);
    // return response.data;
    // --- Fim do código real ---

  } catch (error: unknown) {
    console.error('[authService] Login failed:', error);
    return handleAuthError(error, 'Ocorreu um erro desconhecido ao tentar fazer login.');
  }
};

export const registerClient = async (clientData: RegisterClientData): Promise<User> => {
  try {
    // --- Início da Simulação ---
    console.log('[authService] Attempting client registration for:', clientData.email);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay da rede

    if (clientData.email === 'existente@limpeja.com') {
      const errorSimulado: any = new Error('E-mail já cadastrado (simulado)');
      errorSimulado.isAxiosError = true;
      errorSimulado.response = { data: { message: 'Este e-mail já está em uso.' }, status: 409 };
      throw errorSimulado;
    }

    // Retorna um objeto User simulado após o registro bem-sucedido
    return {
      id: `new-client-${Date.now()}`,
      email: clientData.email,
      name: clientData.name,
      role: 'client',
      phone: clientData.phone,
    };
    // --- Fim da Simulação ---

    // --- Código real (descomente e adapte quando integrar com seu backend) ---
    // const response = await api.post<User>('/auth/register/client', clientData);
    // return response.data;
    // --- Fim do código real ---

  } catch (error: unknown) {
    console.error('[authService] Client registration failed:', error);
    return handleAuthError(error, 'Ocorreu um erro desconhecido ao tentar registrar o cliente.');
  }
};

export const registerProvider = async (providerData: RegisterProviderData): Promise<User> => {
  try {
    // --- Início da Simulação ---
    console.log('[authService] Attempting provider registration for:', providerData.nomeCompleto);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simula delay da rede, pode ser mais longo para provedor

    // Agora providerData.email existe e pode ser usado
    if (providerData.email === 'proexistente@limpeja.com') {
      const errorSimulado: any = new Error('E-mail já cadastrado (simulado)');
      errorSimulado.isAxiosError = true;
      errorSimulado.response = { data: { message: 'Este e-mail de provedor já está em uso.' }, status: 409 };
      throw errorSimulado;
    }

    // Retorna um objeto User simulado após o registro bem-sucedido
    return {
      id: `new-provider-${Date.now()}`,
      email: providerData.email, // Agora está correto
      name: providerData.nomeCompleto,
      role: 'provider',
      phone: providerData.telefone,
    };
    // --- Fim da Simulação ---

    // --- Código real (descomente e adapte quando integrar com seu backend) ---
    // const response = await api.post<User>('/auth/register/provider', providerData);
    // return response.data;
    // --- Fim do código real ---

  } catch (error: unknown) {
    console.error('[authService] Provider registration failed:', error);
    return handleAuthError(error, 'Ocorreu um erro desconhecido ao tentar registrar o provedor.');
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    // --- Início da Simulação ---
    console.log('[authService] Attempting password reset for:', email);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay da rede

    if (email === 'naoencontrado@limpeja.com') {
      const errorSimulado: any = new Error('E-mail não encontrado (simulado)');
      errorSimulado.isAxiosError = true;
      errorSimulado.response = { data: { message: 'E-mail não registrado em nossos sistemas.' }, status: 404 };
      throw errorSimulado;
    }
    // Sucesso simulado
    return;
    // --- Fim da Simulação ---

    // --- Código real (descomente e adapte quando integrar com seu backend) ---
    // const response = await api.post('/auth/password-reset', { email });
    // return response.data; // Ou apenas void, dependendo da sua API
    // --- Fim do código real ---

  } catch (error: unknown) {
    console.error('[authService] Password reset failed:', error);
    return handleAuthError(error, 'Ocorreu um erro desconhecido ao tentar enviar o link de redefinição.');
  }
};

// --- Função auxiliar para tratamento de erros ---
function handleAuthError(error: unknown, defaultMessage: string): never {
  if (axios.isAxiosError(error)) {
    if (error.response && error.response.data && typeof error.response.data.message === 'string') {
      throw new Error(error.response.data.message);
    } else if (error.response) {
      throw new Error(`Erro ${error.response.status}: ${error.response.statusText || 'Resposta inesperada do servidor.'}`);
    } else {
      throw new Error('Erro de conexão. Verifique sua internet ou tente mais tarde.');
    }
  }
  if (error instanceof Error) {
    throw new Error(error.message || defaultMessage);
  }
  throw new Error(defaultMessage);
}