// LimpeJaApp/app/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message'; // Importar Toast
import i18n from '../i18n'; // Importar i18n

// --- Início da nova lógica para callback de logout ---
let onUnauthorizedCallback: (() => Promise<void>) | null = null;

export const setUnauthorizedCallback = (callback: () => Promise<void>) => {
    onUnauthorizedCallback = callback;
};
// --- Fim da nova lógica para callback de logout ---


// Acessa a URL do backend a partir do arquivo de configuração do Expo (app.config.ts)
// Esta é a abordagem recomendada para ambientes de produção.
//const API_BASE_URL = Constants.expoConfig?.extra?.backendApiUrl as string;

// Para facilitar a manutenção local, você pode comentar a linha acima
// e descomentar a linha abaixo para apontar para um backend local.
 const API_BASE_URL = 'http://127.0.0.1:3000'; 

if (!API_BASE_URL) {
    console.error('backendApiUrl não está definido em app.json ou Constants.expoConfig.extra! Verifique sua configuração.');
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
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
        return Promise.reject(error);
    }
);

// Interceptor de resposta para lidar com erros 401/403 de forma centralizada
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Erro 401: Não autorizado (token expirado ou inválido)
        if (error.response && error.response.status === 401 && !originalRequest._isRetryRequest) {
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
        if (error.response && error.response.status === 404) {
            Toast.show({
                type: 'error',
                text1: i18n.t('common.error'),
                text2: error.response.data?.message || i18n.t('common.not_found'),
            });
        }

        // Erro 422 (Unprocessable Entity) ou 409 (Conflict): Erros de validação ou de negócio
        if (error.response && (error.response.status === 422 || error.response.status === 409)) {
            Toast.show({
                type: 'error',
                text1: i18n.t('common.error'),
                text2: error.response.data?.message || i18n.t('common.generic_error'),
            });
        }

        // Erro 5xx: Erros de servidor
        if (error.response && error.response.status >= 500 && error.response.status < 600) {
            Toast.show({
                type: 'error',
                text1: i18n.t('common.error'),
                text2: error.response.data?.message || i18n.t('common.generic_error'),
            });
        }

        // Erros de rede (sem resposta do servidor)
        if (!error.response) {
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