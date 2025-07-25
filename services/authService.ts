import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../types/backend/auth';
import { UserProfile } from '../types/backend/users';
import api from './api';
import * as SecureStore from 'expo-secure-store'; // Adicionado para consistência

// Interface AuthResponse atualizada para usar 'accessToken'
interface AuthResponse {
  accessToken: string; // Alterado de access_token para accessToken
  user: UserProfile;
}

class AuthService {
  private static instance: AuthService;
  private authToken: string | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // NOVO: Verifica se o número de telefone existe e se tem senha
  async checkPhoneNumberExistence(phoneNumber: string): Promise<{ exists: boolean; hasPassword?: boolean }> {
    try {
      console.log('[AuthService] Verificando existência do número de telefone:', phoneNumber);
      const response = await api.post('/auth/check-phone', { phoneNumber });
      return response.data; // { exists: true/false, hasPassword: true/false }
    } catch (error: any) {
      console.error("[AuthService] Erro ao verificar número de telefone:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Erro ao verificar número de telefone.');
    }
  }

  // NOVO: Solicita o envio de um OTP para o número
  async requestOtp(phoneNumber: string): Promise<void> {
    try {
      console.log('[AuthService] Solicitando OTP para:', phoneNumber);
      await api.post('/auth/send-otp', { phoneNumber }); // Backend espera 'phoneNumber'
    } catch (error: any) {
      console.error("[AuthService] Erro ao solicitar OTP:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Erro ao solicitar OTP.');
    }
  }

  // NOVO: Verifica o OTP e realiza o login/registro
  async verifyOtp(phoneNumber: string, otpCode: string): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Verificando OTP para:', phoneNumber);
      const response = await api.post('/auth/verify-otp', { phoneNumber, otpCode }); // Backend espera 'phoneNumber'
      const authData: AuthResponse = response.data;
      await this.saveAuthData(authData); // Salva os dados de autenticação
      console.log('[AuthService] OTP verificado e login bem-sucedido.');
      return authData;
    } catch (error: any) {
      console.error("[AuthService] Erro ao verificar OTP:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Código OTP inválido ou expirado.');
    }
  }

  // CORREÇÃO AQUI: Mudando a assinatura para aceitar um objeto
  async loginWithPassword(credentials: { phoneNumber: string; password: string }): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Tentando login com telefone e senha para:', credentials.phoneNumber);
      // Passa o objeto diretamente para a requisição POST
      const response = await api.post('/auth/login-password', credentials);
      const authData: AuthResponse = response.data;
      await this.saveAuthData(authData); // Salva os dados de autenticação
      console.log('[AuthService] Login com telefone e senha bem-sucedido.');
      return authData;
    } catch (error: any) {
      console.error("[AuthService] Erro ao fazer login com telefone e senha:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Número de telefone ou senha inválidos.');
    }
  }

  // MÉTODO EXISTENTE: logout (Permanece inalterado)
  async logout(): Promise<void> {
    try {
      console.log('[AuthService] Realizando logout');

      // Limpar dados locais
      await AsyncStorage.multiRemove(['token', 'role', 'id', 'user']);
      await SecureStore.deleteItemAsync('token'); // Usar SecureStore se for o caso

      // Remover token do cabeçalho
      this.setAuthToken(null);

      console.log('[AuthService] Logout realizado com sucesso');

    } catch (error) {
      console.error('[AuthService] Erro ao fazer logout:', error);
    }
  }

  // MÉTODO EXISTENTE: registerClient (Permanece inalterado, mas o fluxo pode chamar verifyOtp antes)
  async registerClient(userData: any): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Registrando cliente');

      const response = await api.post('/auth/register/client', userData);
      const authData: AuthResponse = response.data;

      await this.saveAuthData(authData);

      console.log('[AuthService] Cliente registrado com sucesso');
      return authData;

    } catch (error: any) {
      console.error('[AuthService] Erro ao registrar cliente:', error);
      throw new Error(error.response?.data?.message || 'Erro ao registrar cliente');
    }
  }

  // MÉTODO EXISTENTE: registerProvider (Permanece inalterado, mas o fluxo pode chamar verifyOtp antes)
  async registerProvider(userData: any): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Registrando prestador');

      const response = await api.post('/auth/register/provider', userData);
      const authData: AuthResponse = response.data;

      await this.saveAuthData(authData);

      console.log('[AuthService] Prestador registrado com sucesso');
      return authData;

    } catch (error: any) {
      console.error('[AuthService] Erro ao registrar prestador:', error);
      throw new Error(error.response?.data?.message || 'Erro ao registrar prestador');
    }
  }

  // MÉTODO EXISTENTE: loadAuthData (Permanece inalterado)
  async loadAuthData(): Promise<{ token: string | null; role: UserRole | null; id: string | null; user: UserProfile | null }> {
    try {
      console.log('[AuthService] Tentando carregar dados de autenticação do AsyncStorage.');

      const token = await AsyncStorage.getItem('token'); // ou SecureStore.getItemAsync('token');
      const role = await AsyncStorage.getItem('role') as UserRole | null;
      const id = await AsyncStorage.getItem('id');
      const userStr = await AsyncStorage.getItem('user');

      let user: UserProfile | null = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.error('[AuthService] Erro ao fazer parse do usuário:', e);
        }
      }

      if (token) {
        this.setAuthToken(token);
      } else {
        console.log('[AuthService] Nenhum token encontrado no AsyncStorage.');
      }

      console.log('[AuthService] Dados carregados - Token:', !!token, 'Role:', role, 'ID:', id);
      return { token, role, id, user };

    } catch (error) {
      console.error('[AuthService] Erro ao carregar dados de autenticação:', error);
      return { token: null, role: null, id: null, user: null };
    }
  }

  // MÉTODO PRIVADO EXISTENTE: saveAuthData (Permanece inalterado)
  private async saveAuthData(authData: AuthResponse): Promise<void> {
    try {
      await AsyncStorage.setItem('token', authData.accessToken); // ou SecureStore.setItemAsync('token', authData.accessToken);
      await AsyncStorage.setItem('role', authData.user.role);
      await AsyncStorage.setItem('id', authData.user.id);
      await AsyncStorage.setItem('user', JSON.stringify(authData.user));

      this.setAuthToken(authData.accessToken);

    } catch (error) {
      console.error('[AuthService] Erro ao salvar dados de autenticação:', error);
      throw error;
    }
  }

  // MÉTODO EXISTENTE: setAuthToken (Permanece inalterado)
  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('[AuthService] Token definido no cabeçalho do Axios.');
    } else {
      delete api.defaults.headers.common['Authorization'];
      console.log('[AuthService] Token removido do cabeçalho do Axios.');
    }
  }

  // MÉTODO EXISTENTE: getAuthToken (Permanece inalterado)
  getAuthToken(): string | null {
    return this.authToken;
  }
}

export default AuthService.getInstance();