// app.config.ts
import dotenv from 'dotenv';
dotenv.config();

import type { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  return {
    ...config,

    name: 'LimpeJá',
    slug: 'limpeja',
    version: '1.0.7',
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
      supportsTablet: false,
      bundleIdentifier: 'com.techleadevelopers.limpeja',
      buildNumber: '12',
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
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff35',
      },
      package: 'com.techleadevelopers.limpeja',
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
      // ✅ Corrige: FirebaseAuth/FirebaseAuthInterop exigem module maps quando integrados como static libs.
      // useFrameworks: "dynamic" (como você já usa) + useModularHeaders: true resolve o erro de pods Swift.
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'dynamic',
            useModularHeaders: true,
            // newArchEnabled pode permanecer padrão (false) se não estiver migrando
            // newArchEnabled: false,
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
        // Prefer env when provided; fallback to the new cloud URL
        process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://limpeja-backend-production-edfa.up.railway.app',
      environment: process.env.NODE_ENV || 'production',
      router: {},
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID || 'a33ee4a2-86fc-43b8-8d99-b258381b2a1f',
      },
    },
  };
};
