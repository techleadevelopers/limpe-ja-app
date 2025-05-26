// LimpeJaApp/src/services/api.ts
import axios from 'axios';
import { appConfig } from '../config/appConfig'; // Supondo que você tenha este arquivo

export const api = axios.create({
  baseURL: appConfig.apiUrl, // Ex: 'http://localhost:3333/api' ou sua URL de produção
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Opcional: Interceptor para refresh token (lógica mais avançada)
// api.interceptors.response.use(response => response, async error => {
//   const originalRequest = error.config;
//   if (error.response.status === 401 && !originalRequest._retry) {
//     originalRequest._retry = true;
//     // const currentTokens = await SecureStore.getItemAsync('userTokens');
//     // if (currentTokens) {
//     //   const { refreshToken } = JSON.parse(currentTokens);
//     //   try {
//     //     const { data } = await axios.post(`${appConfig.apiUrl}/auth/refresh-token`, { refreshToken });
//     //     await SecureStore.setItemAsync('userTokens', JSON.stringify(data.tokens));
//     //     api.defaults.headers.common['Authorization'] = `Bearer ${data.tokens.accessToken}`;
//     //     originalRequest.headers['Authorization'] = `Bearer ${data.tokens.accessToken}`;
//     //     return axios(originalRequest);
//     //   } catch (refreshError) {
//     //     // Limpar tokens e deslogar usuário
//     //     await SecureStore.deleteItemAsync('userTokens');
//     //     await SecureStore.deleteItemAsync('userData');
//     //     // Redirecionar para login, talvez usando o AuthContext.signOut() ou um evento.
//     //     return Promise.reject(refreshError);
//     //   }
//     // }
//   }
//   return Promise.reject(error);
// });