import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { UserProfile } from '../../app/types/backend/users'; // CORREÇÃO: Caminho relativo correto para UserProfile
import { UserRole } from '../../app/types/backend/auth'; // CORREÇÃO: Caminho relativo correto para UserRole

interface LoginCredentials {
  phone: string;
  otp: string;
}

interface AuthResponse {
  access_token: string;
  user: UserProfile; // Alterado para UserProfile
}

interface SendOtpResponse {
  message: string;
  phone: string;
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

  async sendOtp(phone: string): Promise<SendOtpResponse> {
    try {
      console.log('[authService] Enviando OTP para:', phone);

      // Rota ajustada para '/auth/request-otp' conforme o backend
      const response = await api.post('/auth/request-otp', { phone });

      console.log('[authService] OTP enviado com sucesso');
      return response.data;

    } catch (error: any) {
      console.error('[authService] Erro ao enviar OTP:', error);
      throw new Error(error.response?.data?.message || 'Erro ao enviar código SMS');
    }
  }

  async verifyOtp(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('[authService] Verificando OTP para:', credentials.phone);

      // Propriedade ajustada para 'otpCode' conforme o backend
      const response = await api.post('/auth/verify-otp', {
        phone: credentials.phone,
        otpCode: credentials.otp
      });

      const authData: AuthResponse = response.data;

      // Salvar dados no AsyncStorage
      await this.saveAuthData(authData);

      console.log('[authService] Login realizado com sucesso');
      return authData;

    } catch (error: any) {
      console.error('[authService] Erro ao verificar OTP:', error);
      throw new Error(error.response?.data?.message || 'Código inválido');
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // O método login agora apenas chama verifyOtp, que já lida com o salvamento do token
    return this.verifyOtp(credentials);
  }

  async logout(): Promise<void> {
    try {
      console.log('[authService] Realizando logout');

      // Limpar dados locais
      await AsyncStorage.multiRemove(['token', 'role', 'id', 'user']);

      // Remover token do cabeçalho
      this.setAuthToken(null);

      console.log('[authService] Logout realizado com sucesso');

    } catch (error) {
      console.error('[authService] Erro ao fazer logout:', error);
    }
  }

  async registerClient(userData: any): Promise<AuthResponse> {
    try {
      console.log('[authService] Registrando cliente');

      // Rota ajustada para '/auth/register/client' conforme o backend
      const response = await api.post('/auth/register/client', userData);
      const authData: AuthResponse = response.data;

      await this.saveAuthData(authData);

      console.log('[authService] Cliente registrado com sucesso');
      return authData;

    } catch (error: any) {
      console.error('[authService] Erro ao registrar cliente:', error);
      throw new Error(error.response?.data?.message || 'Erro ao registrar cliente');
    }
  }

  async registerProvider(userData: any): Promise<AuthResponse> {
    try {
      console.log('[authService] Registrando prestador');

      // Rota ajustada para '/auth/register/provider' conforme o backend
      const response = await api.post('/auth/register/provider', userData);
      const authData: AuthResponse = response.data;

      await this.saveAuthData(authData);

      console.log('[authService] Prestador registrado com sucesso');
      return authData;

    } catch (error: any) {
      console.error('[authService] Erro ao registrar prestador:', error);
      throw new Error(error.response?.data?.message || 'Erro ao registrar prestador');
    }
  }

  async loadAuthData(): Promise<{ token: string | null; role: UserRole | null; id: string | null; user: UserProfile | null }> {
    try {
      console.log('[authService] Tentando carregar dados de autenticação do AsyncStorage.');

      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('role') as UserRole | null; // Cast para UserRole
      const id = await AsyncStorage.getItem('id');
      const userStr = await AsyncStorage.getItem('user');

      let user: UserProfile | null = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.error('[authService] Erro ao fazer parse do usuário:', e);
        }
      }

      if (token) {
        this.setAuthToken(token);
      } else {
        console.log('[authService] Nenhum token encontrado no AsyncStorage.');
      }

      console.log('[authService] Dados carregados - Token:', !!token, 'Role:', role, 'ID:', id);
      return { token, role, id, user };

    } catch (error) {
      console.error('[authService] Erro ao carregar dados de autenticação:', error);
      return { token: null, role: null, id: null, user: null };
    }
  }

  private async saveAuthData(authData: AuthResponse): Promise<void> {
    try {
      await AsyncStorage.setItem('token', authData.access_token);
      await AsyncStorage.setItem('role', authData.user.role);
      await AsyncStorage.setItem('id', authData.user.id);
      await AsyncStorage.setItem('user', JSON.stringify(authData.user));

      this.setAuthToken(authData.access_token);

    } catch (error) {
      console.error('[authService] Erro ao salvar dados de autenticação:', error);
      throw error;
    }
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('[authService] Token definido no cabeçalho do Axios.');
    } else {
      delete api.defaults.headers.common['Authorization'];
      console.log('[authService] Token removido do cabeçalho do Axios.');
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }
}

export default AuthService.getInstance();