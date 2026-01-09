import NotificationUIService from '../../services/notificationUIService';

export type FieldErrorMap = Record<string, string>;

export interface UserFacingError {
  title?: string;
  message: string;
  fieldErrors?: FieldErrorMap;
}

const FALLBACK_MESSAGE = 'Não foi possível continuar. Tente novamente.';
const NETWORK_MESSAGE = 'Sem conexão. Verifique sua internet.';
const UNAUTHORIZED_MESSAGE = 'E-mail ou senha incorretos.';
const CONFLICT_MESSAGE = 'Este e-mail já está cadastrado.';
const DEFAULT_TITLE = 'Erro';

const NETWORK_PATTERNS =
  /(timeout|timed out|network request failed|network error|sem conexao|conexão|internet|offline|ECONNABORTED)/i;

const SERVER_MESSAGE_PATTERNS: Array<{ pattern: RegExp; response: string }> = [
  { pattern: /(timeout|timed out|network request failed|network error)/i, response: NETWORK_MESSAGE },
  { pattern: /(401|unauthorized|invalid credentials|token|autentic)/i, response: UNAUTHORIZED_MESSAGE },
  { pattern: /(409|already exists|já está cadastrado|está cadastrado)/i, response: CONFLICT_MESSAGE },
];

const toFieldErrorMap = (data: unknown): FieldErrorMap | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  const payload =
    (data as Record<string, unknown>)?.fieldErrors ??
    (data as Record<string, unknown>)?.errors;

  if (payload && typeof payload === 'object') {
    const normalized: FieldErrorMap = {};
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

type ErrorWithOptionalNetwork = {
  code?: string;
  message?: string;
  response?: { data?: { message?: string } };
};

const hasNetworkSignal = (error: unknown): boolean => {
  if (typeof error === 'object' && error !== null) {
    const err = error as ErrorWithOptionalNetwork;
    const code = String(err.code ?? '').toLowerCase();
    if (NETWORK_PATTERNS.test(code)) return true;
    const msg = String(err.message ?? '').toLowerCase();
    if (NETWORK_PATTERNS.test(msg)) return true;
    const dataMessage = String(err.response?.data?.message ?? '');
    return NETWORK_PATTERNS.test(dataMessage);
  }
  return false;
};

const sanitizeServerMessage = (message: string): string => {
  const normalized = message.trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) return FALLBACK_MESSAGE;

  for (const entry of SERVER_MESSAGE_PATTERNS) {
    if (entry.pattern.test(normalized)) {
      return entry.response;
    }
  }

  if (/[^\s\wÀ-ÿ]/.test(normalized)) {
    return FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
};

export function normalizeAppError(error: unknown): UserFacingError {
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
    message = sanitizeServerMessage((data as Record<string, unknown>).message as string);
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
  const normalized = normalizeAppError(error);
  NotificationUIService.showError(
    normalized.message,
    title ?? normalized.title ?? DEFAULT_TITLE,
  );
  return normalized;
}
