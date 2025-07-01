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
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const loadAuthData = async (): Promise<{ token: string | null; role: string | null; id: string | null }> => {
  try {
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
    return { token, role, id };
  } catch (error) {
    console.error('[authService] loadAuthData: Erro ao carregar dados do AsyncStorage:', error);
    setAuthToken(null);
    return { token: null, role: null, id: null };
  }
};

export const login = async (credentials: LoginDto): Promise<AuthResponseDto> => {
  try {
    const response = await api.post<AuthResponseDto>('/auth/login', credentials);
    const receivedToken = response.data.accessToken;
    const userRole = response.data.user.role;
    const userId = response.data.user.id;
    // Opcional: Se o backend retorna clientId/providerId na raiz de response.data.user, salve-os aqui
    // const clientId = (response.data.user as any).clientId;
    // const providerId = (response.data.user as any).providerId;

    console.log('[authService] login: Resposta completa da API:', response.data);
    console.log('[authService] login: Valor de accessToken recebido:', receivedToken);
    console.log('[authService] login: Papel do usuário recebido:', userRole);
    console.log('[authService] login: ID do usuário recebido:', userId);

    if (receivedToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, receivedToken);
      await AsyncStorage.setItem(USER_ROLE_KEY, userRole);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      // if (clientId) await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
      // if (providerId) await AsyncStorage.setItem(PROVIDER_ID_KEY, providerId);
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
      throw new Error(error.response.data.message || 'Erro ao fazer login.');
    }
    throw new Error('Erro de rede ou servidor ao fazer login.');
  }
};

export const registerClient = async (data: RegisterClientDto): Promise<AuthResponseDto> => {
  try {
    const response = await api.post<AuthResponseDto>('/auth/register/client', data);
    const receivedToken = response.data.accessToken;
    const userRole = response.data.user.role;
    const userId = response.data.user.id;
    // const clientId = response.data.user.clientDetails?.id; // Capture o clientId aqui

    console.log('[authService] registerClient: Resposta completa da API:', response.data);
    console.log('[authService] registerClient: Valor de accessToken recebido:', receivedToken);
    console.log('[authService] registerClient: Papel do usuário recebido:', userRole);
    console.log('[authService] registerClient: ID do usuário recebido:', userId);

    if (receivedToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, receivedToken);
      await AsyncStorage.setItem(USER_ROLE_KEY, userRole);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      // if (clientId) await AsyncStorage.setItem(CLIENT_ID_KEY, clientId); // Salve o clientId
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
      throw new Error(error.response.data.message || 'Erro ao registrar cliente.');
    }
    throw new Error('Erro de rede ou servidor ao registrar cliente.');
  }
};

export const registerProvider = async (data: RegisterProviderDto): Promise<AuthResponseDto> => {
  try {
    const response = await api.post<AuthResponseDto>('/auth/register/provider', data);
    const receivedToken = response.data.accessToken;
    const userRole = response.data.user.role;
    const userId = response.data.user.id;
    // const providerId = response.data.user.providerDetails?.id; // Capture o providerId aqui

    console.log('[authService] registerProvider: Resposta completa da API:', response.data);
    console.log('[authService] registerProvider: Valor de accessToken recebido:', receivedToken);
    console.log('[authService] registerProvider: Papel do usuário recebido:', userRole);
    console.log('[authService] registerProvider: ID do usuário recebido:', userId);

    if (receivedToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, receivedToken);
      await AsyncStorage.setItem(USER_ROLE_KEY, userRole);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      // if (providerId) await AsyncStorage.setItem(PROVIDER_ID_KEY, providerId); // Salve o providerId
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
      throw new Error(error.response.data.message || 'Erro ao registrar provedor.');
    }
    throw new Error('Erro de rede ou servidor ao registrar provedor.');
  }
};

export const forgotPassword = async (data: ForgotPasswordDto): Promise<MessageResponseDto> => {
  try {
    const response = await api.post<MessageResponseDto>('/auth/forgot-password', data);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao solicitar redefinição de senha.');
    }
    throw new Error('Erro de rede ou servidor ao solicitar redefinição de senha.');
  }
};

export const logout = async (): Promise<void> => {
  try {
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