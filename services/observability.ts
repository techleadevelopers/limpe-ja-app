import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

let observabilityInitialized = false;

export const initializeObservability = () => {
  if (observabilityInitialized) return;
  observabilityInitialized = true;

  const environment =
    Constants.expoConfig?.extra?.environment ??
    process.env.NODE_ENV ??
    'production';

  Sentry.init({
    dsn: 'https://947962edb662e5ff655cbcd778ee13b6@o4509792415252480.ingest.us.sentry.io/4509792431898624',
    sendDefaultPii: true,
    environment,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
  });
  Sentry.setTag('environment', environment);

};

export const captureException = (
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
) => {
  if (!error) return;
  const resolvedError = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(resolvedError, {
    tags: context?.tags,
    extra: context?.extra,
  });
};
