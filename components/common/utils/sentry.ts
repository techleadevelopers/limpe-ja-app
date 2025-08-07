// src/utils/sentry.ts
import * as Sentry from '@sentry/react-native';

export const initSentry = () => {
  Sentry.init({
    dsn: 'https://947962edb662e5ff655cbcd778ee13b6@o4509792415252480.ingest.us.sentry.io/4509792431898624', // Substitua pelo seu DSN do Sentry
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: 1.0,
    // Optional: Add integrations for specific frameworks/libraries
    // integrations: [
    //   new Sentry.ReactNativeTracing(),
    // ],
    // Optional: Configure release and environment
    // release: 'my-app@1.0.0',
    // environment: 'production',
  });
};

// Exemplo de como usar:
// import { initSentry } from '../utils/sentry';
// No seu arquivo App.tsx ou index.js:
// initSentry();