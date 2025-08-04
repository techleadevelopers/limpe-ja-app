// src/utils/sentry.ts
import * as Sentry from '@sentry/react-native';

export const initSentry = () => {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN_HERE', // Substitua pelo seu DSN do Sentry
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