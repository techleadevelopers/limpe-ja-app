// LimpeJaApp/app/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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
 const API_BASE_URL = 'http://localhost:3000'; 

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
        if (error.response && error.response.status === 401 && !error.config._isRetryRequest && error.config.url !== '/auth/login') {
            console.warn('[API Interceptor] Requisição 401 Unauthorized. Token pode ter expirado ou é inválido. Iniciando processo de logout.');

            error.config._isRetryRequest = true; 

            if (onUnauthorizedCallback) {
                await onUnauthorizedCallback();
            } else {
                console.warn('[API Interceptor] Nenhum callback de logout registrado. Limpando apenas o token e dados básicos.');
                await AsyncStorage.removeItem('auth_token');
                await AsyncStorage.removeItem('user_role');
                await AsyncStorage.removeItem('user_id');
                await AsyncStorage.removeItem('user_profile');
            }
        }
        return Promise.reject(error);
    }
);

export default api;