import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { quoteBooking } from '../services/quoteService';
import {
  BookingQuoteRequest,
  BookingQuoteResponse,
} from '../types/backend/bookings';

const RATE_LIMIT_BACKOFF_MS = 2000;

export type QuoteStatus =
  | 'idle'
  | 'loading'
  | 'refreshing'
  | 'success'
  | 'invalid'
  | 'rateLimited'
  | 'error';

interface UseBookingQuoteParams {
  requestKey: string;
  payload: BookingQuoteRequest | null;
}

interface UseBookingQuoteResult {
  quote: BookingQuoteResponse | null;
  status: QuoteStatus;
  error: Error | null;
  refreshQuote: () => Promise<void>;
  canQuote: boolean;
  lastRequestKey: string | null;
  rateLimitResetAt: number | null;
}

export function useBookingQuote({
  requestKey,
  payload,
}: UseBookingQuoteParams): UseBookingQuoteResult {
  const [quote, setQuote] = useState<BookingQuoteResponse | null>(null);
  const [status, setStatus] = useState<QuoteStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastRequestKey, setLastRequestKey] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inflightKeyRef = useRef<string | null>(null);
  const lastSuccessKeyRef = useRef<string | null>(null);
  const rateLimitRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimitUntilRef = useRef(0);
  const fetchRef = useRef<((opts?: { force?: boolean }) => Promise<void>) | null>(null);
  const [rateLimitResetAt, setRateLimitResetAt] = useState<number | null>(null);

  const canQuote = useMemo(() => Boolean(requestKey && payload), [requestKey, payload]);

  const executeFetch = useCallback(
    async (options?: { force?: boolean }) => {
      if (!payload || !requestKey) {
        return;
      }

      const now = Date.now();
      if (!options?.force) {
        if (lastSuccessKeyRef.current === requestKey) {
          return;
        }
        if (inflightKeyRef.current === requestKey) {
          return;
        }
        if (rateLimitUntilRef.current > now) {
          return;
        }
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      inflightKeyRef.current = requestKey;
      const nextStatus =
        quote && !options?.force ? 'refreshing' : 'loading';
      setStatus(nextStatus);
      setLastRequestKey(requestKey);
      setError(null);

      try {
        const response = await quoteBooking(payload, { signal: controller.signal });
        if (inflightKeyRef.current !== requestKey) {
          return;
        }
        setQuote(response);
        setStatus('success');
        lastSuccessKeyRef.current = requestKey;
        inflightKeyRef.current = null;
        rateLimitUntilRef.current = 0;
        setRateLimitResetAt(null);
        if (rateLimitRetryTimerRef.current) {
          clearTimeout(rateLimitRetryTimerRef.current);
          rateLimitRetryTimerRef.current = null;
        }
      } catch (err: any) {
        if (err?.name === 'CanceledError') {
          return;
        }
        if (inflightKeyRef.current !== requestKey) {
          return;
        }
        inflightKeyRef.current = null;
        const statusCode = err?.response?.status;
        setError(err);
        if (statusCode === 400) {
          setStatus('invalid');
        } else if (statusCode === 429) {
          setStatus('rateLimited');
          const resetAt = Date.now() + RATE_LIMIT_BACKOFF_MS;
          rateLimitUntilRef.current = resetAt;
          setRateLimitResetAt(resetAt);
          if (rateLimitRetryTimerRef.current) {
            clearTimeout(rateLimitRetryTimerRef.current);
          }
          rateLimitRetryTimerRef.current = setTimeout(() => {
            fetchRef.current?.({ force: true });
          }, RATE_LIMIT_BACKOFF_MS);
        } else {
          setStatus('error');
        }
      }
    },
    [payload, requestKey, quote],
  );

  useEffect(() => {
    fetchRef.current = executeFetch;
  }, [executeFetch]);

  useEffect(() => {
    rateLimitUntilRef.current = 0;
    setRateLimitResetAt(null);
  }, [requestKey]);

  useEffect(() => {
    if (!canQuote) {
      setStatus('idle');
      setError(null);
      setLastRequestKey(null);
      inflightKeyRef.current = null;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (rateLimitRetryTimerRef.current) {
        clearTimeout(rateLimitRetryTimerRef.current);
        rateLimitRetryTimerRef.current = null;
      }
      return;
    }

    executeFetch();
  }, [canQuote, executeFetch]);

  const refreshQuote = useCallback(async () => {
    await executeFetch({ force: true });
  }, [executeFetch]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (rateLimitRetryTimerRef.current) {
        clearTimeout(rateLimitRetryTimerRef.current);
      }
    };
  }, []);

  return {
    quote,
    status,
    error,
    refreshQuote,
    canQuote,
    lastRequestKey,
    rateLimitResetAt,
  };
}
