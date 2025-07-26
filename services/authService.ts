// app/services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../types/backend/auth';
import { UserProfile } from '../types/backend/users';
import api, { setUnauthorizedCallback } from './api'; // Importa a instância do Axios e o setter de callback

// --- CHAVES UNIFICADAS PARA O ASYNCSTORAGE ---
const AUTH_TOKEN_KEY = 'auth_token';
const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';
const USER_PROFILE_KEY = 'user_profile'; // Nova chave para o objeto UserProfile
// --- FIM CHAVES UNIFICADAS ---

// Interface AuthResponse atualizada para usar 'accessToken' e incluir 'isNewUser'
export interface AuthResponse { // <--- ESTE É O 'EXPORT' CRÍTICO QUE RESOLVE O ERRO
    accessToken: string;
    user: UserProfile;
    isNewUser?: boolean; // Adiciona a flag isNewUser para o frontend saber se o usuário foi recém-criado
}

class AuthService {
    private static instance: AuthService;
    private authToken: string | null = null;

    private constructor() {
        // REMOVIDO: A chamada para setUnauthorizedCallback foi movida para o AuthContext.useEffect
        // setUnauthorizedCallback(this.logout.bind(this));
        // console.log('[AuthService] Callback de logout registrado no interceptor de API.');
    }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    // Helper para limpar e formatar o número para 11 dígitos sem prefixo '+55'
    private cleanAndFormatPhoneNumber(phoneNumber: string): string {
        let cleaned = phoneNumber.replace(/\D/g, ''); // Remove caracteres não numéricos
        // Remove o prefixo '+55' se estiver presente, pois o backend adiciona e valida o formato 11 digitos puro.
        // Lógica para lidar com entradas como "5519993388983" ou "+5519993388983"
        if (cleaned.startsWith('55') && cleaned.length === 13) { // Ex: 55 + DDD (2) + 9 (1) + 8 dígitos (8) = 13
            cleaned = cleaned.substring(2); // Remove o '55' inicial
        } else if (cleaned.startsWith('+55') && cleaned.length === 14) { // Ex: +55 + DDD (2) + 9 (1) + 8 dígitos (8) = 14
            cleaned = cleaned.substring(3); // Remove o '+55' inicial
        }
        // A validação de 11 dígitos estritos ocorrerá no backend com @Length(11, 11).
        // Aqui garantimos que o formato de entrada para o DTO do backend seja limpo e sem o prefixo internacional.
        return cleaned;
    }

    // NOVO: Verifica se o número de telefone existe e se tem senha
    async checkPhoneNumberExistence(phoneNumber: string): Promise<{ exists: boolean; hasPassword?: boolean }> {
        try {
            console.log('[AuthService Frontend] checkPhoneNumberExistence: Verificando existência do número de telefone:', phoneNumber);
            const axiosInstance = (api as any).default || api;
            // Para check-phone, o backend espera phoneNumber com 11 dígitos, então passamos o limpo.
            const cleanedPhoneNumber = this.cleanAndFormatPhoneNumber(phoneNumber);
            const response = await axiosInstance.post('/auth/check-phone', { phoneNumber: cleanedPhoneNumber });
            console.log('[AuthService Frontend] checkPhoneNumberExistence: Resposta do backend:', response.data);
            return response.data;
        } catch (error: any) {
            console.error("[AuthService Frontend] checkPhoneNumberExistence: Erro ao verificar número de telefone:", error.response?.data?.message || error.message, error.response?.status);
            throw new Error(error.response?.data?.message || 'Erro ao verificar número de telefone.');
        }
    }

    // NOVO: Solicita o envio de um OTP para o número
    async requestOtp(phoneNumber: string): Promise<void> {
        try {
            console.log('[AuthService Frontend] requestOtp: Solicitando OTP para:', phoneNumber);
            const axiosInstance = (api as any).default || api;
            // CORREÇÃO: Envie APENAS O NÚMERO LIMPO (11 dígitos) para o backend, conforme o DTO do backend.
            const cleanedPhoneNumber = this.cleanAndFormatPhoneNumber(phoneNumber);
            await axiosInstance.post('/auth/send-otp', { phone: cleanedPhoneNumber }); // O backend converterá para E.164
            console.log('[AuthService Frontend] requestOtp: Solicitação de OTP enviada com sucesso para o backend.');
        } catch (error: any) {
            console.error("[AuthService Frontend] requestOtp: Erro ao solicitar OTP:", error.response?.data?.message || error.message, error.response?.status);
            throw new Error(error.response?.data?.message || 'Erro ao solicitar OTP. Verifique o número e tente novamente.');
        }
    }

    // NOVO: Verifica o OTP e realiza o login/registro
    async verifyOtp(phoneNumber: string, otpCode: string): Promise<AuthResponse> {
        try {
            console.log('[AuthService Frontend] verifyOtp: Verificando OTP para:', phoneNumber, 'Código:', otpCode);
            const axiosInstance = (api as any).default || api;
            // CORREÇÃO: Envie APENAS O NÚMERO LIMPO (11 dígitos) para o backend.
            const cleanedPhoneNumber = this.cleanAndFormatPhoneNumber(phoneNumber);
            const response = await axiosInstance.post('/auth/verify-otp', { phone: cleanedPhoneNumber, otpCode });
            const authData: AuthResponse = response.data; // authData agora incluirá isNewUser
            await this.saveAuthData(authData);
            console.log('[AuthService Frontend] verifyOtp: OTP verificado e login/registro bem-sucedido. isNewUser:', authData.isNewUser);
            return authData;
        } catch (error: any) {
            console.error("[AuthService Frontend] verifyOtp: Erro ao verificar OTP:", error.response?.data?.message || error.message, error.response?.status);
            throw new Error(error.response?.data?.message || 'Código OTP inválido ou expirado.');
        }
    }

    // Login com número de telefone e senha
    async loginWithPassword(credentials: { phoneNumber: string; password: string }): Promise<AuthResponse> {
        try {
            console.log('[AuthService Frontend] loginWithPassword: Tentando login com telefone e senha para:', credentials.phoneNumber);
            const axiosInstance = (api as any).default || api;
            // CORREÇÃO: Envie APENAS O NÚMERO LIMPO (11 dígitos) para o backend.
            const cleanedPhoneNumber = this.cleanAndFormatPhoneNumber(credentials.phoneNumber);
            const response = await axiosInstance.post('/auth/login-phone-password', { phoneNumber: cleanedPhoneNumber, password: credentials.password });
            const authData: AuthResponse = response.data;
            await this.saveAuthData(authData);
            console.log('[AuthService Frontend] loginWithPassword: Login com telefone e senha bem-sucedido.');
            return authData;
        } catch (error: any) {
            console.error("[AuthService Frontend] loginWithPassword: Erro ao fazer login com telefone e senha:", error.response?.data?.message || error.message, error.response?.status);
            throw new Error(error.response?.data?.message || 'Número de telefone ou senha inválidos.');
        }
    }

    // MÉTODO EXISTENTE: logout
    async logout(): Promise<void> {
        try {
            console.log('[AuthService Frontend] Realizando logout');
            // Usando as chaves unificadas para remover todos os itens de autenticação
            await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_ROLE_KEY, USER_ID_KEY, USER_PROFILE_KEY]);
            this.setAuthToken(null); // Limpa o token no Axios
            console.log('[AuthService Frontend] Logout realizado com sucesso');
        } catch (error) {
            console.error('[AuthService Frontend] Erro ao fazer logout:', error);
        }
    }

    // MÉTODO EXISTENTE: registerClient (Permanece inalterado, mas o fluxo pode chamar verifyOtp antes)
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

    // MÉTODO EXISTENTE: registerProvider (Permanece inalterado, mas o fluxo pode chamar verifyOtp antes)
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

    // MÉTODO EXISTENTE: loadAuthData
    async loadAuthData(): Promise<{ token: string | null; role: UserRole | null; id: string | null; user: UserProfile | null }> {
        try {
            console.log('[AuthService Frontend] Tentando carregar dados de autenticação do AsyncStorage.');
            // Usando as chaves unificadas para carregar os dados
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const role = await AsyncStorage.getItem(USER_ROLE_KEY) as UserRole | null;
            const id = await AsyncStorage.getItem(USER_ID_KEY);
            const userStr = await AsyncStorage.getItem(USER_PROFILE_KEY); // Carrega o perfil do usuário

            let user: UserProfile | null = null;
            if (userStr) {
                try {
                    user = JSON.parse(userStr);
                } catch (e) {
                    console.error('[AuthService Frontend] Erro ao fazer parse do usuário:', e);
                    // Se o JSON estiver corrompido, limpa os dados para evitar problemas futuros
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

    // MÉTODO PRIVADO EXISTENTE: saveAuthData
    private async saveAuthData(authData: AuthResponse): Promise<void> {
        try {
            // Usando as chaves unificadas para salvar os dados
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, authData.accessToken);
            await AsyncStorage.setItem(USER_ROLE_KEY, authData.user.role);
            await AsyncStorage.setItem(USER_ID_KEY, authData.user.id);
            await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(authData.user)); // Salva o objeto completo do perfil
            this.setAuthToken(authData.accessToken);
        } catch (error) {
            console.error('[AuthService Frontend] Erro ao salvar dados de autenticação:', error);
            throw error;
        }
    }

    // MÉTODO EXISTENTE: setAuthToken
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

    // MÉTODO EXISTENTE: getAuthToken
    getAuthToken(): string | null {
        return this.authToken;
    }
}

export default AuthService.getInstance();
