import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../types/backend/auth';
import { UserProfile } from '../types/backend/users';
import api from './api';

// NOVO: Interface para o DTO que o frontend enviará ao backend para verificar o ID Token do Firebase
interface VerifyFirebaseIdTokenRequest {
  idToken: string; // O ID Token JWT retornado pelo Firebase Authentication
}

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

  // MÉTODO REMOVIDO: sendOtp (Não mais usado para o fluxo principal de autenticação)

  // MÉTODO REMOVIDO: verifyOtp (Não mais usado para o fluxo principal de autenticação)

  // MÉTODO REMOVIDO: login (Não mais usado para o fluxo principal de autenticação)

  // MÉTODO EXISTENTE: logout (Permanece inalterado)
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

  // MÉTODO EXISTENTE: registerClient (Permanece inalterado)
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

  // MÉTODO EXISTENTE: registerProvider (Permanece inalterado)
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

  // MÉTODO EXISTENTE: loadAuthData (Permanece inalterado)
  async loadAuthData(): Promise<{ token: string | null; role: UserRole | null; id: string | null; user: UserProfile | null }> {
    try {
      console.log('[authService] Tentando carregar dados de autenticação do AsyncStorage.');

      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('role') as UserRole | null;
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

  // MÉTODO PRIVADO EXISTENTE: saveAuthData (Permanece inalterado)
  private async saveAuthData(authData: AuthResponse): Promise<void> {
    try {
      // Usar authData.accessToken, não authData.access_token
      await AsyncStorage.setItem('token', authData.accessToken);
      await AsyncStorage.setItem('role', authData.user.role);
      await AsyncStorage.setItem('id', authData.user.id);
      await AsyncStorage.setItem('user', JSON.stringify(authData.user));

      this.setAuthToken(authData.accessToken);

    } catch (error) {
      console.error('[authService] Erro ao salvar dados de autenticação:', error);
      throw error;
    }
  }

  // MÉTODO EXISTENTE: setAuthToken (Permanece inalterado)
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

  // MÉTODO EXISTENTE: getAuthToken (Permanece inalterado)
  getAuthToken(): string | null {
    return this.authToken;
  }

  // NOVO MÉTODO: verifyFirebaseIdToken (Para o fluxo de autenticação Firebase Auth)
  async verifyFirebaseIdToken(data: VerifyFirebaseIdTokenRequest): Promise<AuthResponse> {
    try {
      console.log('[authService] Verificando ID Token do Firebase com o backend.');
      // Esta é a nova rota no seu backend que vai usar o Firebase Admin SDK
      const response = await api.post('/auth/firebase-login', data); 

      const authData: AuthResponse = response.data;

      // Salva os dados de autenticação no AsyncStorage após a verificação bem-sucedida
      await this.saveAuthData(authData);

      console.log('[authService] Login com Firebase ID Token bem-sucedido.');
      return authData;

    } catch (error: any) {
      console.error('[authService] Erro ao verificar ID Token do Firebase:', error);
      throw new Error(error.response?.data?.message || 'Falha na autenticação Firebase.');
    }
  }
}

export default AuthService.getInstance();