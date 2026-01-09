import { AxiosError } from 'axios';
import { normalizeAppError } from '../../../_shared/errors/userError';

export type NormalizedApiError = {
  code: string;
  messageHuman: string;
  retryable: boolean;
  blockAction: boolean;
  status?: number;
  cooldownMs?: number;
};

type ApiBody = Record<string, unknown>;

function getApiBody(error: unknown): ApiBody | undefined {
  const axiosError = error as AxiosError | undefined;
  const data = axiosError?.response?.data;
  return data && typeof data === 'object' ? (data as ApiBody) : undefined;
}

function extractDetailUpper(error: unknown): string {
  const axiosError = error as AxiosError | undefined;
  const body = getApiBody(error);

  const parts: string[] = [];
  if (body) {
    // prioriza campos estruturados do backend
    if (body.error) parts.push(String(body.error));
    if (body.code) parts.push(String(body.code));
    if (body.message) parts.push(String(body.message));
  }

  if (axiosError?.message) parts.push(String(axiosError.message));

  return parts.join(' | ').toUpperCase();
}

function parseRetryAfterMs(error: unknown): number | undefined {
  const axiosError = error as AxiosError | undefined;
  const ra = axiosError?.response?.headers?.['retry-after'];
  if (!ra) return undefined;

  const seconds = Number(ra);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;

  return Math.min(seconds * 1000, 120_000); // cap 2min
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  const base = normalizeAppError(error);
  const axiosError = error as AxiosError | undefined;
  const status = axiosError?.response?.status;
  const detail = extractDetailUpper(error);

  let code = 'GENERIC';
  let blockAction = false;
  let retryable = false;
  let cooldownMs: number | undefined;

  // Auth
  if (status === 401 || status === 403) {
    code = 'UNAUTHORIZED';
    blockAction = true;
  }

  // Rate limit
  if (status === 429 || detail.includes('TOO_MANY_REQUESTS') || detail.includes('THROTTLER')) {
    code = 'RATE_LIMITED';
    blockAction = true;
    retryable = true;
    cooldownMs = parseRetryAfterMs(error) ?? 20_000;
  }

  // PIX expired
  if (detail.includes('PIX') && detail.includes('EXPIRED')) {
    code = 'PIX_EXPIRED';
    blockAction = true;
    retryable = false;
  }

  // Conflicts / mismatches (muito comum no booking)
  if (status === 409 || detail.includes('PRICE_MISMATCH') || detail.includes('CONFLICT')) {
    code = 'CONFLICT';
    blockAction = true;
    retryable = true;
  }

  // Validação / payload incompleto (evita request inútil em alguns fluxos)
  if (status === 422 || status === 400) {
    code = 'INVALID_REQUEST';
    blockAction = true;
    retryable = false;
  }

  return {
    code,
    messageHuman: base.message,
    retryable,
    blockAction,
    status,
    cooldownMs,
  };
}
