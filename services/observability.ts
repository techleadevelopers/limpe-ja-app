import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import LogRocket from 'logrocket-react-native';

let observabilityInitialized = false;

const getLogRocketAppId = () =>
  Constants.expoConfig?.extra?.logRocketAppId ??
  process.env.EXPO_PUBLIC_LOGROCKET_APP_ID ??
  process.env.LOGROCKET_APP_ID;

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

  const logRocketAppId = getLogRocketAppId();
  if (logRocketAppId) {
    try {
      LogRocket.init(logRocketAppId);
    } catch (initializerError) {
      if (__DEV__) {
        console.warn('[Observability] LogRocket init falhou:', initializerError);
      }
    }
  }
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
  if (LogRocket?.captureException) {
    LogRocket.captureException(resolvedError);
  }
};
