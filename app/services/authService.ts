// LimpeJaApp/app/services/authService.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

import {
  LoginDto,
  RegisterClientDto,
  RegisterProviderDto,
  ForgotPasswordDto,
  AuthResponseDto,
  MessageResponseDto,
} from '../types/backend/auth';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';
// Para o frontend, você também pode querer salvar CLIENT_ID_KEY ou PROVIDER_ID_KEY aqui
// const CLIENT_ID_KEY = 'client_id';
// const PROVIDER_ID_KEY = 'provider_id';

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.debug('[authService] setAuthToken: Token definido no cabeçalho do Axios.');
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.debug('[authService] setAuthToken: Token removido do cabeçalho do Axios.');
  }
};

export const loadAuthData = async (): Promise<{ token: string | null; role: string | null; id: string | null }> => {
  try {
    console.debug('[authService] loadAuthData: Tentando carregar dados de autenticação do AsyncStorage.');
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const role = await AsyncStorage.getItem(USER_ROLE_KEY);
    const id = await AsyncStorage.getItem(USER_ID_KEY);

    if (token) {
      setAuthToken(token);
      console.log('[authService] loadAuthData: Token carregado e configurado no axios.');
    } else {
      console.log('[authService] loadAuthData: Nenhum token encontrado no AsyncStorage.');
      setAuthToken(null);
    }
    console.debug('[authService] loadAuthData: Dados carregados - Token:', !!token, 'Role:', role, 'ID:', id);
    return { token, role, id };
  } catch (error) {
    console.error('[authService] loadAuthData: Erro ao carregar dados do AsyncStorage:', error);
    setAuthToken(null);
    return { token: null, role: null, id: null };
  }
};

export const login = async (credentials: LoginDto): Promise<AuthResponseDto> => {
  try {
    console.debug('[authService] login: Iniciando chamada à API de login. Credenciais:', credentials.email);
    const response = await api.post<AuthResponseDto>('/auth/login', credentials);
    
    console.debug('[authService] login: Resposta completa da API:', response.data);
    const receivedToken = response.data.accessToken;
    const userRole = response.data.user.role;
    const userId = response.data.user.id;

    console.log('[authService] login: Valor de accessToken recebido:', receivedToken ? 'Presente' : 'Ausente');
    console.log('[authService] login: Papel do usuário recebido:', userRole);
    console.log('[authService] login: ID do usuário recebido:', userId);

    if (receivedToken) {
      console.debug('[authService] login: Token recebido, armazenando no AsyncStorage...');
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, receivedToken);
      await AsyncStorage.setItem(USER_ROLE_KEY, userRole);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      setAuthToken(receivedToken);
      console.log('[authService] login: Token, Papel e ID armazenados com sucesso no AsyncStorage!');
      return response.data;
    } else {
      console.error('[authService] login: accessToken é undefined ou nulo na resposta da API.');
      throw new Error('Token de acesso não recebido após login. Por favor, tente novamente.');
    }
  } catch (error: any) {
    console.error('[authService] login: Erro ao fazer login na API:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      console.debug('[authService] login: Detalhes do erro Axios:', error.response.status, error.response.data);
      throw new Error(error.response.data.message || 'Erro ao fazer login.');
    }
    throw new Error('Erro de rede ou servidor ao fazer login.');
  }
};

export const registerClient = async (data: RegisterClientDto): Promise<AuthResponseDto> => {
  try {
    console.debug('[authService] registerClient: Iniciando chamada à API de registro de cliente. Dados:', data.email, data.fullName);
    const response = await api.post<AuthResponseDto>('/auth/register/client', data);
    
    console.debug('[authService] registerClient: Resposta completa da API:', response.data);
    const receivedToken = response.data.accessToken;
    const userRole = response.data.user.role;
    const userId = response.data.user.id;

    console.log('[authService] registerClient: Valor de accessToken recebido:', receivedToken ? 'Presente' : 'Ausente');
    console.log('[authService] registerClient: Papel do usuário recebido:', userRole);
    console.log('[authService] registerClient: ID do usuário recebido:', userId);

    if (receivedToken) {
      console.debug('[authService] registerClient: Token recebido, armazenando no AsyncStorage...');
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, receivedToken);
      await AsyncStorage.setItem(USER_ROLE_KEY, userRole);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      setAuthToken(receivedToken);
      console.log('[authService] registerClient: Token, Papel e ID armazenados com sucesso no AsyncStorage!');
      return response.data;
    } else {
      console.error('[authService] registerClient: accessToken é undefined ou nulo na resposta da API.');
      throw new Error('Token de acesso não recebido após registro de cliente. Por favor, tente novamente.');
    }
  } catch (error: any) {
    console.error('[authService] registerClient: Erro ao registrar cliente na API:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      console.debug('[authService] registerClient: Detalhes do erro Axios:', error.response.status, error.response.data);
      throw new Error(error.response.data.message || 'Erro ao registrar cliente.');
    }
    throw new Error('Erro de rede ou servidor ao registrar cliente.');
  }
};

export const registerProvider = async (data: RegisterProviderDto): Promise<AuthResponseDto> => {
  try {
    console.debug('[authService] registerProvider: Iniciando chamada à API de registro de provedor. Dados:', data.email, data.fullName);
    const response = await api.post<AuthResponseDto>('/auth/register/provider', data);
    
    console.debug('[authService] registerProvider: Resposta completa da API:', response.data);
    const receivedToken = response.data.accessToken;
    const userRole = response.data.user.role;
    const userId = response.data.user.id;

    console.log('[authService] registerProvider: Valor de accessToken recebido:', receivedToken ? 'Presente' : 'Ausente');
    console.log('[authService] registerProvider: Papel do usuário recebido:', userRole);
    console.log('[authService] registerProvider: ID do usuário recebido:', userId);

    if (receivedToken) {
      console.debug('[authService] registerProvider: Token recebido, armazenando no AsyncStorage...');
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, receivedToken);
      await AsyncStorage.setItem(USER_ROLE_KEY, userRole);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      setAuthToken(receivedToken);
      console.log('[authService] registerProvider: Token, Papel e ID armazenados com sucesso no AsyncStorage!');
      return response.data;
    } else {
      console.error('[authService] registerProvider: accessToken é undefined ou nulo na resposta da API.');
      throw new Error('Token de acesso não recebido após registro de provedor. Por favor, tente novamente.');
    }
  } catch (error: any) {
    console.error('[authService] registerProvider: Erro ao registrar provedor na API:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      console.debug('[authService] registerProvider: Detalhes do erro Axios:', error.response.status, error.response.data);
      throw new Error(error.response.data.message || 'Erro ao registrar provedor.');
    }
    throw new Error('Erro de rede ou servidor ao registrar provedor.');
  }
};

export const forgotPassword = async (data: ForgotPasswordDto): Promise<MessageResponseDto> => {
  try {
    console.debug('[authService] forgotPassword: Iniciando chamada à API de recuperação de senha. Email:', data.email);
    const response = await api.post<MessageResponseDto>('/auth/forgot-password', data);
    console.debug('[authService] forgotPassword: Resposta da API:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[authService] forgotPassword: Erro ao solicitar redefinição de senha:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      console.debug('[authService] forgotPassword: Detalhes do erro Axios:', error.response.status, error.response.data);
      throw new Error(error.response.data.message || 'Erro ao solicitar redefinição de senha.');
    }
    throw new Error('Erro de rede ou servidor ao solicitar redefinição de senha.');
  }
};

export const logout = async (): Promise<void> => {
  try {
    console.debug('[authService] logout: Iniciando processo de logout. Removendo itens do AsyncStorage...');
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_ROLE_KEY);
    await AsyncStorage.removeItem(USER_ID_KEY);
    setAuthToken(null);
    console.log('[authService] logout: Token, papel e ID removidos do AsyncStorage e header do axios limpo.');
  } catch (error) {
    console.error('[authService] logout: Erro ao fazer logout:', error);
    throw new Error('Erro ao fazer logout.');
  }
};
