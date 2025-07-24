// LimpeJaApp/app.config.ts
// Garante que as variáveis do .env sejam carregadas no ambiente Node.js
import 'dotenv/config'; // <-- DESCOMENTE ESTA LINHA

// Importa o tipo ExpoConfig para melhor tipagem (opcional, mas boa prática)
import { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  // ADICIONADO: Logs para depurar o carregamento das variáveis de ambiente
  // Você pode comentar estas linhas de console.log AGORA, se quiser a saída limpa.
  // console.log('--- app.config.ts Debugging ---');
  // console.log('process.env.EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
  // console.log('process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
  // console.log('process.env.EXPO_PUBLIC_FIREBASE_APP_ID:', process.env.EXPO_PUBLIC_FIREBASE_APP_ID);
  // console.log('-------------------------------');

  return {
    ...config,
    "name": "LimpeJá", // Use o nome original, ou "LimpeJá Teste" se for o caso
    "slug": "limpeja", // Use o slug original
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "cleaning",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.techleadevelopers.limpeja"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": { // <-- DESCOMENTE OU RECOLOQUE ESTA SEÇÃO
      ...config.extra,
      "backendApiUrl": process.env.EXPO_PUBLIC_API_BASE_URL || "https://limpeja-app-backend-665493568088.southamerica-east1.run.app",
      "environment": process.env.NODE_ENV || "production",
      "router": {},
      "eas": {
        "projectId": process.env.EAS_PROJECT_ID || "f4b19077-130d-469b-be83-e94b2f768190"
      },
      // --- Variáveis do Firebase para o Frontend ---
      "firebaseApiKey": process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      "firebaseAuthDomain": process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      "firebaseProjectId": process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      "firebaseStorageBucket": process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      "firebaseMessagingSenderId": process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      "firebaseAppId": process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      "firebaseMeasurementId": process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID // Opcional
    }
  };
};