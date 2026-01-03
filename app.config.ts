// app.config.ts
import dotenv from 'dotenv';
dotenv.config();

import type { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  return {
    ...config,

    name: 'LimpeJá',
    slug: 'limpeja',
    version: '1.0.15',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'cleaning',
    userInterfaceStyle: 'automatic',

    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#ffffff',
    },

    assetBundlePatterns: ['**/*'],

    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.techleadevelopers.limpeja',
      buildNumber: '20',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription:
          'Usamos a câmera para capturar seus documentos e fotos de perfil para verificação.',
        NSPhotoLibraryUsageDescription:
          'Usamos sua biblioteca para selecionar fotos de perfil e documentos.',
        NSPhotoLibraryAddUsageDescription:
          'Podemos salvar imagens (comprovantes/QR) caso você escolha baixar.',
        NSLocationWhenInUseUsageDescription:
          'Sua localização ajuda a encontrar prestadores próximos a você.',
        NSCalendarsUsageDescription:
          'Adicionamos seus agendamentos ao Calendário, se você permitir.',
      },
    },

    android: {
      versionCode: 5,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.techleadevelopers.limpeja',
      splash: {
        image: './assets/images/splash.png',
        resizeMode: 'cover', // <- mantém igual ao global
        backgroundColor: '#ffffff',
      },
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
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'dynamic',
            useModularHeaders: true,
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      ...config.extra,
      backendApiUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ??
        'https://limpeja-backend-production-edfa.up.railway.app',
      logRocketAppId:
        process.env.EXPO_PUBLIC_LOGROCKET_APP_ID ??
        process.env.LOGROCKET_APP_ID ??
        '',
      environment: process.env.NODE_ENV || 'production',
      router: {},
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID || 'a33ee4a2-86fc-43b8-8d99-b258381b2a1f',
      },
    },
  };
};
