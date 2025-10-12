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
      buildNumber: '1',
      // 🔻 sem Firebase: NÃO há googleServicesFile aqui
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
      // ✅ Adicionado para corrigir os pods Swift/Firebase como static libraries:
      [
        'expo-build-properties',
        {
          ios: {
            // Não habilitamos useFrameworks por padrão; apenas modular headers para os pods problemáticos
            // "useFrameworks": "static",
            extraPods: [
              { name: 'GoogleUtilities', modular_headers: true },
              { name: 'FirebaseCore', modular_headers: true },
              { name: 'FirebaseCoreInternal', modular_headers: true },
              { name: 'FirebaseCoreExtension', modular_headers: true },
              { name: 'FirebaseAuth', modular_headers: true },
              { name: 'RecaptchaInterop', modular_headers: true },
              { name: 'FirebaseAppCheckInterop', modular_headers: true }
            ]
          }
        }
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
