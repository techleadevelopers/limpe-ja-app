// LimpeJaApp/services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, UserRole } from '../types/backend/auth';
import { UserProfile } from '../types/backend/users';
import api from './api';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';
const USER_PROFILE_KEY = 'user_profile';

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

    async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
        try {
            console.log('[AuthService Frontend] login: Tentando login com e-mail:', credentials.email);
            const axiosInstance = (api as any).default || api;
            const response = await axiosInstance.post('/auth/login', {
                email: credentials.email,
                password: credentials.password,
            });
            const authData: AuthResponse = response.data;
            await this.saveAuthData(authData);
            console.log('[AuthService Frontend] login: Login bem-sucedido.');
            return authData;
        } catch (error: any) {
            console.error("[AuthService Frontend] login: Erro ao fazer login:", error.response?.data?.message || error.message, error.response?.status);
            throw new Error(error.response?.data?.message || 'Credenciais inválidas.');
        }
    }

    async logout(): Promise<void> {
        try {
            console.log('[AuthService Frontend] Realizando logout');
            await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_ROLE_KEY, USER_ID_KEY, USER_PROFILE_KEY]);
            this.setAuthToken(null);
            console.log('[AuthService Frontend] Logout realizado com sucesso');
        } catch (error) {
            console.error('[AuthService Frontend] Erro ao fazer logout:', error);
        }
    }

    async registerClient(userData: any): Promise<AuthResponse> {
        try {
            console.log('[AuthService Frontend] Registrando cliente');
            const axiosInstance = (api as any).default || api;
            const response = await axiosInstance.post('/auth/register/client', userData);
            const authData: AuthResponse = response.data;
            await this.saveAuthData(authData);
            console.log('[AuthService Frontend] Cliente registrado com sucesso');
            return authData;
        } catch (error: any) {
            console.error('[AuthService Frontend] Erro ao registrar cliente:', error);
            throw new Error(error.response?.data?.message || 'Erro ao registrar cliente');
        }
    }

    async registerProvider(userData: any): Promise<AuthResponse> {
        try {
            console.log('[AuthService Frontend] Registrando prestador');
            const axiosInstance = (api as any).default || api;
            const response = await axiosInstance.post('/auth/register/provider', userData);
            const authData: AuthResponse = response.data;
            await this.saveAuthData(authData);
            console.log('[AuthService Frontend] Prestador registrado com sucesso');
            return authData;
        } catch (error: any) {
            console.error('[AuthService Frontend] Erro ao registrar prestador:', error);
            throw new Error(error.response?.data?.message || 'Erro ao registrar prestador');
        }
    }

    async loadAuthData(): Promise<{ token: string | null; role: UserRole | null; id: string | null; user: UserProfile | null }> {
        try {
            console.log('[AuthService Frontend] Tentando carregar dados de autenticação do AsyncStorage.');
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const role = await AsyncStorage.getItem(USER_ROLE_KEY) as UserRole | null;
            const id = await AsyncStorage.getItem(USER_ID_KEY);
            const userStr = await AsyncStorage.getItem(USER_PROFILE_KEY);

            let user: UserProfile | null = null;
            if (userStr) {
                try {
                    user = JSON.parse(userStr);
                } catch (e) {
                    console.error('[AuthService Frontend] Erro ao fazer parse do usuário:', e);
                    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_ROLE_KEY, USER_ID_KEY, USER_PROFILE_KEY]);
                }
            }

            if (token) {
                this.setAuthToken(token);
            } else {
                console.log('[AuthService Frontend] Nenhum token encontrado no AsyncStorage.');
            }

            console.log('[AuthService Frontend] Dados carregados - Token:', !!token, 'Role:', role, 'ID:', id);
            return { token, role, id, user };
        } catch (error) {
            console.error('[AuthService Frontend] Erro ao carregar dados de autenticação:', error);
            return { token: null, role: null, id: null, user: null };
        }
    }

    // NOVO MÉTODO PÚBLICO: storeAuthData para ser chamado de fora da classe.
    public async storeAuthData(authData: { token: string; user: UserProfile; id: string; role: UserRole }): Promise<void> {
        try {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, authData.token);
            await AsyncStorage.setItem(USER_ROLE_KEY, authData.role);
            await AsyncStorage.setItem(USER_ID_KEY, authData.id);
            await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(authData.user));
            this.setAuthToken(authData.token);
        } catch (error) {
            console.error('[AuthService Frontend] Erro ao salvar dados de autenticação:', error);
            throw error;
        }
    }

    // MÉTODO PRIVADO EXISTENTE: saveAuthData
    private async saveAuthData(authData: AuthResponse): Promise<void> {
        try {
            // Usando as chaves unificadas para salvar os dados
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, authData.accessToken);
            await AsyncStorage.setItem(USER_ROLE_KEY, authData.user.role);
            await AsyncStorage.setItem(USER_ID_KEY, authData.user.id);
            await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(authData.user));
            this.setAuthToken(authData.accessToken);
        } catch (error) {
            console.error('[AuthService Frontend] Erro ao salvar dados de autenticação:', error);
            throw error;
        }
    }

    setAuthToken(token: string | null): void {
        this.authToken = token;
        const axiosInstance = (api as any).default || api;
        if (token) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log('[AuthService Frontend] Token definido no cabeçalho do Axios.');
        } else {
            delete axiosInstance.defaults.headers.common['Authorization'];
            console.log('[AuthService Frontend] Token removido do cabeçalho do Axios.');
        }
    }

    getAuthToken(): string | null {
        return this.authToken;
    }
}

export default AuthService.getInstance();