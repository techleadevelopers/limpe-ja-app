import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message'; // Importar Toast
import i18n from '../i18n'; // Importar i18n
import axiosRetry from 'axios-retry'; // NEW: Importar axios-retry
import * as Sentry from '@sentry/react-native'; // NEW: Importar Sentry (assumindo que já está configurado)

// --- Início da nova lógica para callback de logout ---
let onUnauthorizedCallback: (() => Promise<void>) | null = null;

export const setUnauthorizedCallback = (callback: () => Promise<void>) => {
    onUnauthorizedCallback = callback;
};
// --- Fim da nova lógica para callback de logout ---

// Acessa a URL do backend a partir do arquivo de configuração do Expo (app.config.ts)
// Esta é a abordagem recomendada para ambientes de produção.
const API_BASE_URL = Constants.expoConfig?.extra?.backendApiUrl as string;

// Para facilitar a manutenção local, você pode comentar a linha acima
// e descomentar a linha abaixo para apontar para um backend local.
// const API_BASE_URL = 'http://127.0.0.1:3000';

if (!API_BASE_URL) {
    console.error('backendApiUrl não está definido em app.json ou Constants.expoConfig.extra! Verifique sua configuração.');
    // NEW: Captura o erro com Sentry se a URL base não estiver definida
    Sentry.captureMessage('backendApiUrl não está definido!', 'fatal');
}

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000, // NEW: 20 segundos de timeout para todas as requisições
    headers: {
        'Content-Type': 'application/json',
    },
});

// NEW: Configuração de retry para requisições
axiosRetry(api, {
    retries: 3, // Tenta 3 vezes
    retryDelay: axiosRetry.exponentialDelay, // Aumenta o tempo de espera exponencialmente
    retryCondition: (error) => {
        // Retenta se for erro de rede ou status 429 (Too Many Requests) ou 5xx
        return axiosRetry.isNetworkError(error) ||
               axiosRetry.isRetryableError(error) || // Erros 5xx, timeouts
               error.response?.status === 429;
    },
    onRetry: (retryCount, error, requestConfig) => {
        console.warn(`[API Interceptor] Tentativa ${retryCount} para ${requestConfig.url} falhou: ${error.message}`);
        // NEW: Captura a tentativa de retry com Sentry como um evento de aviso
        Sentry.captureMessage(`Retry attempt ${retryCount} for ${requestConfig.url}`, 'warning');
    },
});

// Interceptor para adicionar o token JWT a cada requisição
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // NEW: Captura o erro na fase de requisição com Sentry
        Sentry.captureException(error);
        return Promise.reject(error);
    }
);

// Interceptor de resposta para lidar com erros 401/403 de forma centralizada
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // NEW: Captura o erro da resposta com Sentry
        Sentry.captureException(error);

        const originalRequest = error.config;

        // Erro 401: Não autorizado (token expirado ou inválido)
        if (axios.isAxiosError(error) && error.response && error.response.status === 401 && !originalRequest._isRetryRequest) {
            console.warn('[API Interceptor] Requisição 401 Unauthorized. Token pode ter expirado ou é inválido. Iniciando processo de logout.');
            originalRequest._isRetryRequest = true; // Marca a requisição para evitar loops infinitos

            if (onUnauthorizedCallback) {
                await onUnauthorizedCallback();
                Toast.show({
                    type: 'error',
                    text1: i18n.t('common.error'),
                    text2: i18n.t('common.unauthorized_error'),
                });
            } else {
                console.warn('[API Interceptor] Nenhum callback de logout registrado. Limpando apenas o token e dados básicos.');
                await AsyncStorage.removeItem('auth_token');
                await AsyncStorage.removeItem('user_role');
                await AsyncStorage.removeItem('user_id');
                await AsyncStorage.removeItem('user_profile');
                Toast.show({
                    type: 'error',
                    text1: i18n.t('common.error'),
                    text2: i18n.t('common.unauthorized_error'),
                });
            }
            return Promise.reject(error); // Rejeita o erro após tentar o logout
        }

        // Erro 404: Não encontrado
        if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
            Toast.show({
                type: 'error',
                text1: i18n.t('common.error'),
                text2: error.response.data?.message || i18n.t('common.not_found'),
            });
        }

        // Erro 403: Acesso Proibido
        if (axios.isAxiosError(error) && error.response && error.response.status === 403) {
            Toast.show({
                type: 'error',
                text1: i18n.t('common.error'),
                text2: error.response.data?.message || i18n.t('common.forbidden_error'), // NEW: Adicionado i18n para 403
            });
        }

        // Erro 422 (Unprocessable Entity) ou 409 (Conflict): Erros de validação ou de negócio
        if (axios.isAxiosError(error) && error.response && (error.response.status === 422 || error.response.status === 409)) {
            Toast.show({
                type: 'error',
                text1: i18n.t('common.error'),
                text2: error.response.data?.message || i18n.t('common.generic_error'),
            });
        }

        // NEW: Erro 429 (Too Many Requests)
        if (axios.isAxiosError(error) && error.response && error.response.status === 429) {
            Toast.show({
                type: 'error',
                text1: i18n.t('common.error'),
                text2: error.response.data?.message || i18n.t('common.too_many_requests'), // NEW: Adicionado i18n para 429
            });
        }

        // Erro 5xx: Erros de servidor
        if (axios.isAxiosError(error) && error.response && error.response.status >= 500 && error.response.status < 600) {
            Toast.show({
                type: 'error',
                text1: i18n.t('common.error'),
                text2: error.response.data?.message || i18n.t('common.generic_error'),
            });
        }

        // Erros de rede (sem resposta do servidor) ou timeout
        if (axios.isAxiosError(error) && !error.response) { // Inclui erros de rede e timeouts
            Toast.show({
                type: 'error',
                text1: i18n.t('common.error'),
                text2: i18n.t('common.network_error'),
            });
        }

        return Promise.reject(error);
    }
);

export default api;