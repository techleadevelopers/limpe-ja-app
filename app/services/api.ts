// LimpeJaApp/app/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- USANDO ASYNCSTORAGE AGORA

// Certifique-se de que EXPO_PUBLIC_API_BASE_URL está definida em seu .env ou app.config.js/ts
// E que é acessível no ambiente de execução do Expo.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL; // <--- AGORA USANDO VARIÁVEL DE AMBIENTE

if (!API_BASE_URL) {
  console.error('EXPO_PUBLIC_API_BASE_URL não está definido! Verifique seu arquivo .env ou app.config.js/ts.');
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

// Opcional: Interceptor de resposta para lidar com erros 401/403 de forma centralizada
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Se for um erro 401 (Não Autorizado) e não for uma requisição de login/refresh token
    // Adicione mais condições se houver outras rotas que retornam 401 mas não devem deslogar (ex: refresh token)
    if (error.response && error.response.status === 401 && !error.config._isRetryRequest && error.config.url !== '/auth/login') {
      console.warn('[API Interceptor] Requisição 401 Unauthorized. Token pode ter expirado ou é inválido. Limpando sessão.');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_role'); // Se você armazena o role separadamente
      await AsyncStorage.removeItem('user_id'); // Se você armazena o id separadamente
      // TODO: Implementar lógica de redirecionamento para a tela de login.
      // No Expo Router, isso geralmente é feito reagindo a mudanças no contexto de autenticação no _layout.tsx.
      // Você pode emitir um evento ou usar um estado global se precisar forçar um logout imediato aqui.
      // Exemplo: navigation.navigate('Login'); // Se você tiver acesso ao objeto de navegação
    }
    return Promise.reject(error);
  }
);

export default api; // Exporta a instância do Axios por padrão