// app.config.ts
import dotenv from 'dotenv';
dotenv.config();
import type { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  return {
    ...config,

    name: 'LimpeJá',
    slug: 'limpeja',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'cleaning',
    userInterfaceStyle: 'automatic',

    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },

    assetBundlePatterns: ['**/*'],

    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.techleadevelopers.limpeja',
      // 🔻 sem Firebase: NÃO há googleServicesFile aqui
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.techleadevelopers.limpeja',
      // 🔻 sem Firebase: NÃO há googleServicesFile aqui
    },

    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

    plugins: [
      'expo-router',
      'expo-localization',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      // 🔻 removidos:
      // '@react-native-firebase/app',
      // ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      ...config.extra,
      backendApiUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ??
        'https://limpeja-backend-production.up.railway.app/',
      environment: process.env.NODE_ENV || 'production',
      router: {},
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID || 'a33ee4a2-86fc-43b8-8d99-b258381b2a1f',
      },
    },
  };
};
