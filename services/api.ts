// LimpeJaApp/app/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants'; // Importa Constants para acessar variáveis do app.json

// --- Início da nova lógica para callback de logout ---
// Variável para armazenar a função de logout do AuthContext
let onUnauthorizedCallback: (() => Promise<void>) | null = null;

/**
 * Define uma função de callback a ser executada quando uma resposta 401 Unauthorized for recebida.
 * Esta função geralmente será a função `logout` do seu AuthContext.
 * @param callback A função assíncrona de logout.
 */
export const setUnauthorizedCallback = (callback: () => Promise<void>) => {
    onUnauthorizedCallback = callback;
};
// --- Fim da nova lógica para callback de logout ---

// Certifique-se de que EXPO_PUBLIC_API_BASE_URL está definida em seu .env ou app.config.js/ts
// E que é acessível no ambiente de execução do Expo.
// Usa Constants.expoConfig?.extra para acessar variáveis públicas do app.json

// URL do backend na nuvem (original do app.json) - DESCOMENTADA PARA USO DA URL DO GCLOUD
const API_BASE_URL = Constants.expoConfig?.extra?.backendApiUrl as string;

// URL do backend local para desenvolvimento - COMENTADA PARA USAR A URL DO GCLOUD#const API_BASE_URL = 'http://localhost:3000'; // OU a porta que seu backend local está usando

if (!API_BASE_URL) {
    console.error('backendApiUrl não está definido em app.json ou Constants.expoConfig.extra! Verifique sua configuração.');
    // Você pode lançar um erro ou definir um fallback padrão para desenvolvimento
    // throw new Error('API_BASE_URL is not defined');
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
        // Usando a chave unificada para o token
        const token = await AsyncStorage.getItem('auth_token'); // <--- CHAVE UNIFICADA PARA 'auth_token'
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
        // Se for um erro 401 (Não Autorizado) e não for uma requisição de login/refresh token
        // e a requisição ainda não foi tentada novamente (para evitar loops)
        if (error.response && error.response.status === 401 && !error.config._isRetryRequest && error.config.url !== '/auth/login') {
            console.warn('[API Interceptor] Requisição 401 Unauthorized. Token pode ter expirado ou é inválido. Iniciando processo de logout.');

            // Marca a requisição para não tentar novamente se já foi tratada por este interceptor
            error.config._isRetryRequest = true; 

            // Chama o callback de logout registrado pelo AuthContext
            if (onUnauthorizedCallback) {
                await onUnauthorizedCallback();
            } else {
                console.warn('[API Interceptor] Nenhum callback de logout registrado. Limpando apenas o token e dados básicos.');
                // Se não houver callback registrado (situação inesperada em produção),
                // ainda removemos o token para evitar loop infinito de 401.
                await AsyncStorage.removeItem('auth_token');
                await AsyncStorage.removeItem('user_role');
                await AsyncStorage.removeItem('user_id');
                await AsyncStorage.removeItem('user_profile'); // Adiciona a chave do perfil do usuário
            }
            // O redirecionamento para a tela de login deve ser gerenciado pelo AuthContext
            // ou pelo seu sistema de rotas (ex: Expo Router) após o logout.
        }
        return Promise.reject(error);
    }
);

export default api; // Exporta a instância do Axios por padrão