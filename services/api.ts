import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message';
import { createLocalConsole } from './logging';
const console = createLocalConsole();
import i18n from '../i18n';
import * as Sentry from '@sentry/react-native';
import { appQueryClient } from '../components/provider/query-client-provider';
import { AuthErrorCode } from '../types/backend/auth-error-code';
import { AuthEventType, emitAuthEvent } from './authEvents';

type AuthErrorResponse = { code?: AuthErrorCode };

// --- Callback disparado em 401 ---
type UnauthorizedHandler = (context: { originalRequest: AxiosRequestConfig; error?: AxiosError }) => Promise<void>;
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
  if (__DEV__) console.error('backendApiUrl não está definido. Verifique sua configuração.');
  Sentry.captureMessage('backendApiUrl não está definido!', 'fatal');
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Guard: avoid shipping localhost base URL in production builds
try {
  // __DEV__ is defined in React Native; fallback to NODE_ENV
  const isDev = (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.NODE_ENV !== 'production';
  if (API_BASE_URL.includes('localhost') && !isDev) {
    if (__DEV__) console.error('[api] API_BASE_URL points to localhost in production:', API_BASE_URL);
    Sentry.captureMessage('API_BASE_URL is localhost in production', 'fatal');
  }
} catch (_) {
  // noop
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const shouldRetry = (error: AxiosError) => {
  if (error.response?.status === 429) {
    return false;
  }
  return !error.response || error.response.status >= 500;
};
const IDEMP_PATHS = [
  '/bookings',
  '/missions/track',
  '/missions/',
  '/reviews',
  '/payments/intent',
  '/support/tickets',
  '/v1/support/tickets',
  '/providers/me/availability',
  '/payments/withdrawal',
  '/providers/me/earnings/withdrawal',
  '/payouts/withdrawals',
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

const AUTH_STORAGE_KEYS = ['auth_token', 'user_role', 'user_id', 'user_profile'];
export const cleanupAxios = axios.create({ baseURL: API_BASE_URL, timeout: 5000 });

let revocationPromise: Promise<void> | null = null;
let revocationUnauthorizedCallbackCalled = false;

const attemptRevokedCleanup = async (token?: string, showToast = true) => {
  if (revocationPromise) {
    await revocationPromise;
    return;
  }

  revocationPromise = (async () => {
    try {
      if (token) {
        await cleanupAxios.post('/auth/logout-device', undefined, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // best-effort cleanup; ignore
    }
    try {
      await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
    } catch {
      // ignore
    }
    try {
      delete api.defaults.headers.common['Authorization'];
    } catch {
      // ignore
    }
    try {
      appQueryClient.clear();
    } catch {
      // ignore
    }
    if (showToast) {
      Toast.show({
        type: 'info',
        text1: i18n.t('common.session_revoked_title', {
          defaultValue: 'Sessão Encerrada',
        }),
        text2: i18n.t('common.session_revoked_message', {
          defaultValue: 'Sua sessão expirou. Por favor, entre novamente para continuar navegando com segurança.',
        }),
        visibilityTime: 4000,
      });
    }
    emitAuthEvent(AuthEventType.SESSION_REVOKED, undefined);
  })();

  try {
    await revocationPromise;
  } finally {
    revocationPromise = null;
  }
};

const notifyUnauthorizedCallback = async (
  config: AxiosRequestConfig,
  axiosError: AxiosError,
) => {
  if (!onUnauthorizedCallback || revocationUnauthorizedCallbackCalled) {
    return;
  }
  revocationUnauthorizedCallbackCalled = true;
  try {
    await onUnauthorizedCallback({ originalRequest: config, error: axiosError });
  } catch (callbackError) {
    Sentry.captureException(callbackError, { tags: { scope: 'auth' } });
  }
  revocationUnauthorizedCallbackCalled = false;
};

export const resetRevocationCallbackFlag = () => {
  revocationUnauthorizedCallbackCalled = false;
};

type AuthHandlerResult = {
  handled: true;
  result?: Promise<unknown>;
};

const handleAuthError = async (
  status: number | undefined,
  config: AxiosRequestConfig,
  axiosError: AxiosError,
): Promise<AuthHandlerResult | null> => {
  if (status !== 401) {
    return null;
  }

  const requestUrl = String(config.url ?? '');
  const isRefreshRequest = requestUrl.includes('/auth/refresh');
  const errorBody = axiosError.response?.data as AuthErrorResponse | undefined;
  const errorCode = errorBody?.code;
  const configWithMeta =
    config as AxiosRequestConfig & { _refreshAttempted?: boolean };

    if (errorCode === AuthErrorCode.TOKEN_EXPIRED && !isRefreshRequest) {
      if (configWithMeta._refreshAttempted) {
        return null;
      }
      configWithMeta._refreshAttempted = true;
    try {
      const { default: authService } = await import('./authService');
      const authData = await authService.refreshSession();
      emitAuthEvent(AuthEventType.SESSION_REFRESHED, authData);
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${authData.accessToken}`;
        revocationUnauthorizedCallbackCalled = false;
        return { handled: true, result: api(config) };
    } catch (refreshError) {
      Sentry.captureException(refreshError, { tags: { scope: 'auth' } });
        const storedToken = await AsyncStorage.getItem('auth_token');
        await attemptRevokedCleanup(storedToken ?? undefined, Boolean(storedToken));
        await notifyUnauthorizedCallback(config, axiosError);
        return { handled: true };
      }
    }

    if (
      errorCode === AuthErrorCode.TOKEN_REVOKED ||
      (isRefreshRequest && errorCode === AuthErrorCode.TOKEN_EXPIRED)
    ) {
      const token = await AsyncStorage.getItem('auth_token');
      await attemptRevokedCleanup(token ?? undefined, Boolean(token));
      await notifyUnauthorizedCallback(config, axiosError);
      return { handled: true };
    }

  return null;
};

api.interceptors.response.use(
  response => response,
  async error => {
    const axiosError = error as AxiosError & { config: AxiosRequestConfig & { __tries?: number; _isRetryRequest?: boolean; meta?: { silent?: boolean } } };
    const config = axiosError.config;
    const status = axiosError.response?.status;
    config.__tries = (config.__tries ?? 0) + 1;

    // Special-case: allow guest fallback for GET /users/me when requested
    try {
      const status = axiosError.response?.status;
      const url = String(config?.url ?? '');
      const hdrs = (config?.headers ?? {}) as Record<string, unknown>;
      const allowGuest = hdrs['X-Allow-Guest'] === '1' || hdrs['x-allow-guest'] === '1' || hdrs['X-Allow-Guest'] === true || hdrs['x-allow-guest'] === true;
      if (allowGuest && url.endsWith('/users/me') && (status === 401 || status === 404)) {
        const guest: any = {
          id: 'guest',
          email: '',
          role: 'CLIENT',
          fullName: null,
          phone: null,
          avatarUrl: null,
          address: null,
          walletBalance: 0,
          ordersCount: 0,
          upcomingBookingsCount: 0,
          averageRating: 0,
          reviewCount: 0,
          referralCode: null,
          clientDetails: null,
          providerDetails: null,
        };
        return Promise.resolve({
          data: guest,
          status: 200,
          statusText: 'OK',
          headers: axiosError.response?.headers ?? {},
          config,
          request: (axiosError as any).request,
        } as any);
      }
    } catch (_) {
      // ignore fallback construction errors
    }

    if (shouldRetry(axiosError) && config.__tries < 3) {
      await sleep(1000 * Math.pow(2, config.__tries - 1));
      return api(config);
    }

    const authHandling = await handleAuthError(status, config, axiosError);
    if (authHandling) {
      if (authHandling.result) {
        return authHandling.result;
      }
      return Promise.reject(axiosError);
    }

    const headers = (config?.headers ?? {}) as Record<string, unknown>;
    const silentHeader = headers['x-silent'] ?? headers['X-Silent'];
    const isSilent = silentHeader === '1' || silentHeader === 1 || silentHeader === true;

    // NOVO: Suporte a modo silencioso via meta (para chamadas de boot/home)
    const isMetaSilent = config.meta?.silent === true;

    const unified = buildUnifiedError(axiosError);
    const dedupeKey = `${unified.messageKey}:${unified.status}`;

    // Suprimir o fallback genérico na UI (especialmente na home/index)
    const isFallbackKey = unified.messageKey === 'errors.network.retry_saved';

    // Silencioso se for meta.silent OU header x-silent OU fallback
    const shouldShowToast = !isSilent && !isMetaSilent && !isFallbackKey && !shouldDedupe(dedupeKey);
    if (shouldShowToast) {
      const localized = i18n.t(unified.messageKey as any, { defaultValue: unified.message });
      Toast.show({ type: 'error', text1: i18n.t('common.error'), text2: localized });
    }

    // Sentry: silencioso se meta.silent
    if (!isMetaSilent && !isSilent) {
      Sentry.captureException(axiosError, {
        tags: { scope: 'network' },
        extra: unified,
      });
    }

    if (axiosError.response?.status === 401 && !config._isRetryRequest) {
      config._isRetryRequest = true;
      if (onUnauthorizedCallback) {
        try {
          await onUnauthorizedCallback({ originalRequest: config, error: axiosError });
        } catch (refreshError) {
          Sentry.captureException(refreshError, { tags: { scope: 'auth' } });
        }
      }

      // Só limpa o token e mostra toast se NÃO for chamada silenciosa
      if (!isSilent && !isMetaSilent) {
        await AsyncStorage.multiRemove(['auth_token', 'user_role', 'user_id', 'user_profile']);
        Toast.show({
          type: 'error',
          text1: i18n.t('common.error'),
          text2: i18n.t('common.unauthorized_error'),
        });
      }
    }

    // Preserve AxiosError shape for downstream callers and attach unified info
    (axiosError as any).unified = unified;
    (axiosError as any).status = unified.status ?? axiosError.response?.status;
    // keep a helpful message while maintaining axios error type
    if (unified.message && typeof unified.message === 'string') {
      (axiosError as any).message = unified.message;
    }
    return Promise.reject(axiosError);
  }
);

export async function fetchApi<T = unknown>(path: string, init?: AxiosRequestConfig & { meta?: { silent?: boolean } }): Promise<T> {
  const response = await api.request({ url: path, ...(init ?? {}) });
  return response.data as T;
}
