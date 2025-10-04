import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message';
import i18n from '../i18n';
import * as Sentry from '@sentry/react-native';

// --- Callback disparado em 401 ---
type UnauthorizedHandler = (context: { originalRequest: AxiosRequestConfig }) => Promise<void>;
let onUnauthorizedCallback: UnauthorizedHandler | null = null;
export const setUnauthorizedCallback = (callback: UnauthorizedHandler) => {
  onUnauthorizedCallback = callback;
};

const API_BASE_URL =
  Constants.expoConfig?.extra?.backendApiUrl ??
  (globalThis as any)?.env?.EXPO_PUBLIC_API_BASE_URL ??
  (globalThis as any)?.env?.VITE_API_BASE_URL ??
  process.env.API_BASE_URL ??
  'http://localhost:3000';

if (!API_BASE_URL) {
  console.error('backendApiUrl não está definido. Verifique sua configuração.');
  Sentry.captureMessage('backendApiUrl não está definido!', 'fatal');
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const shouldRetry = (error: AxiosError) => !error.response || error.response.status >= 500;
const IDEMP_PATHS = [
  '/bookings',
  '/missions/track',
  '/missions/',
  '/reviews',
  '/payments/intent',
  '/support/tickets',
  '/providers/me/availability',
];

const createRandomId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (_) {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

api.interceptors.request.use(async config => {
  const cfg = config;
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  const method = cfg.method?.toLowerCase();
  if (method && ['post', 'put', 'patch'].includes(method)) {
    const path = String(cfg.url ?? '');
    if (IDEMP_PATHS.some(p => path.includes(p))) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers['Idempotency-Key'] = cfg.headers['Idempotency-Key'] ?? createRandomId();
    }
  }

  cfg.headers = cfg.headers ?? {};
  cfg.headers['X-Client-Request-Id'] = createRandomId();
  return cfg;
});

const errorBucket = new Map<string, number>();
const shouldDedupe = (key: string) => {
  const now = Date.now();
  const last = errorBucket.get(key) ?? 0;
  errorBucket.set(key, now);
  return now - last < 30000;
};

const buildUnifiedError = (error: AxiosError) => {
  const responseData: any = error.response?.data ?? {};
  return {
    status: error.response?.status,
    messageKey: responseData.messageKey ?? 'errors.network.retry_saved',
    message:
      responseData.message ??
      'We couldn’t complete this now. Your progress is safe; try again.',
    requestId: responseData.requestId ?? error.response?.headers?.['x-request-id'],
    fieldErrors: responseData.fieldErrors ?? null,
  };
};

api.interceptors.response.use(
  response => response,
  async error => {
    const axiosError = error as AxiosError & { config: AxiosRequestConfig & { __tries?: number; _isRetryRequest?: boolean } };
    const config = axiosError.config;
    config.__tries = (config.__tries ?? 0) + 1;

    if (shouldRetry(axiosError) && config.__tries < 3) {
      await sleep(1000 * Math.pow(2, config.__tries - 1));
      return api(config);
    }

    const headers = (config?.headers ?? {}) as Record<string, unknown>;
    const silentHeader = headers['x-silent'] ?? headers['X-Silent'];
    const isSilent = silentHeader === '1' || silentHeader === 1 || silentHeader === true;

    const unified = buildUnifiedError(axiosError);
    const dedupeKey = `${unified.messageKey}:${unified.status}`;

    if (!isSilent && !shouldDedupe(dedupeKey)) {
      const localized = i18n.t(unified.messageKey as any, { defaultValue: unified.message });
      Toast.show({ type: 'error', text1: i18n.t('common.error'), text2: localized });
    }

    if (!isSilent) {
      Sentry.captureException(axiosError, {
        tags: { scope: 'network' },
        extra: unified,
      });
    }

    if (axiosError.response?.status === 401 && !config._isRetryRequest) {
      config._isRetryRequest = true;
      if (onUnauthorizedCallback) {
        try {
          await onUnauthorizedCallback({ originalRequest: config });
          return api(config);
        } catch (refreshError) {
          Sentry.captureException(refreshError, { tags: { scope: 'auth' } });
        }
      }

      await AsyncStorage.multiRemove(['auth_token', 'user_role', 'user_id', 'user_profile']);
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: i18n.t('common.unauthorized_error'),
      });
    }

    return Promise.reject(unified);
  }
);

export async function fetchApi<T = unknown>(path: string, init?: AxiosRequestConfig): Promise<T> {
  const response = await api.request({ url: path, ...(init ?? {}) });
  return response.data as T;
}
