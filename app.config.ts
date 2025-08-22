// LimpeJaApp/app.config.ts
import 'dotenv/config'; // Garante que as variáveis do .env sejam carregadas

import { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  return {
    ...config,
    "name": "LimpeJá",
    "slug": "limpeja",
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
      "supportsTablet": true,
      // "googleServicesFile": "./GoogleService-Info.plist" // REMOVIDO: Esta linha não é válida e o foco é Android
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.techleadevelopers.limpeja",
      "googleServicesFile": "./google-services.json" // Certifique-se de que este arquivo existe na raiz do seu projeto
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
      ],
      "@react-native-firebase/app" // Plugin para configurar o Firebase no Expo
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      ...config.extra,
      "backendApiUrl": process.env.EXPO_PUBLIC_API_BASE_URL || "https://187.43.213.118:8081",
      "environment": process.env.NODE_ENV || "production",
      "router": {},
      "eas": {
        "projectId": process.env.EAS_PROJECT_ID || "f4b19077-130d-469b-be83-e94b2f768190"
      },
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
