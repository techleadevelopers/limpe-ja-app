import NotificationUIService from '../../services/notificationUIService';

export type AuthFieldErrorMap = Record<string, string>;

export interface UserFacingError {
  title?: string;
  message: string;
  fieldErrors?: AuthFieldErrorMap;
}

const FALLBACK_MESSAGE = 'Não foi possível continuar. Tente novamente.';
const NETWORK_MESSAGE = 'Sem conexão. Tente novamente.';
const UNAUTHORIZED_MESSAGE = 'E-mail ou senha incorretos.';
const CONFLICT_MESSAGE = 'Este e-mail já está cadastrado.';

const NETWORK_PATTERNS =
  /(timeout|timed out|network request failed|network error|sem conexao|conexão|internet|offline|ECONNABORTED)/i;

const toFieldErrorMap = (data: unknown): AuthFieldErrorMap | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const payload =
    (data as Record<string, unknown>)?.fieldErrors ??
    (data as Record<string, unknown>)?.errors;

  if (payload && typeof payload === 'object') {
    const normalized: AuthFieldErrorMap = {};
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        normalized[key] = value.trim();
      } else if (Array.isArray(value) && value.length > 0) {
        normalized[key] = String(value[0]).trim();
      }
    }
    if (Object.keys(normalized).length > 0) {
      return normalized;
    }
  }
  return undefined;
};

const hasNetworkSignal = (error: unknown): boolean => {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    const code = String(err.code ?? '').toLowerCase();
    if (NETWORK_PATTERNS.test(code)) return true;
    const msg = String(err.message ?? '').toLowerCase();
    return NETWORK_PATTERNS.test(msg);
  }
  return false;
};

export function normalizeAuthError(error: unknown): UserFacingError {
  const response = (error as Record<string, unknown>)?.response as
    | { status?: number; data?: unknown }
    | undefined;
  const status = response?.status;
  const data = response?.data ?? (error as Record<string, unknown>)?.data;

  if (hasNetworkSignal(error)) {
    return { message: NETWORK_MESSAGE };
  }

  if (status === 401) {
    return { message: UNAUTHORIZED_MESSAGE };
  }

  if (status === 409) {
    return { message: CONFLICT_MESSAGE };
  }

  let message = FALLBACK_MESSAGE;

  if (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>)?.message === 'string'
  ) {
    const msg = ((data as Record<string, unknown>)?.message as string)
      .trim()
      .replace(/\s+/g, ' ');
    if (msg.length > 0 && !NETWORK_PATTERNS.test(msg)) {
      message = msg;
    }
  } else if (status && status >= 500) {
    message = FALLBACK_MESSAGE;
  }

  const fieldErrors = toFieldErrorMap(data);

  return {
    message,
    fieldErrors,
  };
}

export function showUserError(error: unknown, title?: string): UserFacingError {
  const normalized = normalizeAuthError(error);
  NotificationUIService.showError(
    normalized.message,
    title ?? normalized.title ?? 'Erro',
  );
  return normalized;
}
