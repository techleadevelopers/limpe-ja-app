// LimpeJaApp/src/config/appConfig.ts

export const appConfig = {
  // A URL base da sua API é agora configurada através de variáveis de ambiente.
  // Certifique-se de que `EXPO_PUBLIC_API_BASE_URL` está definido no seu arquivo .env
  // (e.g., .env, .env.development, .env.production).
  apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api', //
  // Você pode adicionar um fallback para 'http://localhost:3000/api' em desenvolvimento
  // ou uma mensagem de erro se a variável não estiver definida.

  // Outras configurações globais do aplicativo podem ser adicionadas aqui
  // Ex:
  // appName: 'LimpeJá',
  // appVersion: '1.0.0',
  // timeoutApi: 15000, // Timeout para requisições API em milissegundos
};