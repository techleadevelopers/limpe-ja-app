import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookingAddress,
  BookingAddon,
  BookingQuoteRequest,
  BookingQuoteResponse,
  InsurancePlanId,
} from '../types/backend/bookings';
import { quoteBooking } from '../services/quoteService';

const DEBOUNCE_DELAY_MS = 300;

interface UseBookingQuoteParams {
  providerId?: string | null;
  providerServiceId?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  address?: BookingAddress | null;
  durationMinutes?: number | null;
  squareMeters?: number | null;
  roomCount?: number | null;
  couponCode?: string | null;
  subscriptionId?: string | null;
  addons?: BookingAddon[] | null;
  insurancePlanId?: InsurancePlanId | null;
}

interface UseBookingQuoteResult {
  quote: BookingQuoteResponse | null;
  isLoading: boolean;
  error: Error | null;
  refreshQuote: () => Promise<void>;
  quoteRequest: BookingQuoteRequest | null;
}

export function useBookingQuote(params: UseBookingQuoteParams): UseBookingQuoteResult {
  const [quote, setQuote] = useState<BookingQuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);
  const lastPayloadKeyRef = useRef<string>('');

  const quoteRequest = useMemo<BookingQuoteRequest | null>(() => {
    if (
      !params.providerId ||
      !params.providerServiceId ||
      !params.scheduledDate ||
      !params.scheduledTime ||
      !params.address
    ) {
      return null;
    }

    const lat = params.address.latitude;
    const lng = params.address.longitude;
    if (
      lat === undefined ||
      lng === undefined ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      (lat === 0 && lng === 0)
    ) {
      return null;
    }

    return {
      providerId: params.providerId,
      providerServiceId: params.providerServiceId,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      durationMinutes:
        params.durationMinutes && params.durationMinutes > 0
          ? params.durationMinutes
          : undefined,
      squareMeters:
        params.squareMeters && params.squareMeters > 0
          ? params.squareMeters
          : undefined,
      roomCount:
        params.roomCount && params.roomCount > 0 ? params.roomCount : undefined,
      couponCode: params.couponCode?.trim() || undefined,
      subscriptionId: params.subscriptionId || undefined,
      addons: params.addons || undefined,
      insurancePlanId: params.insurancePlanId || undefined,
      address: params.address,
    };
  }, [
    params.providerId,
    params.providerServiceId,
    params.scheduledDate,
    params.scheduledTime,
    params.address,
    params.durationMinutes,
    params.squareMeters,
    params.roomCount,
    params.couponCode,
    params.subscriptionId,
    params.addons,
    params.insurancePlanId,
  ]);

  const payloadKey = useMemo(() => {
    return quoteRequest ? JSON.stringify(quoteRequest) : '';
  }, [quoteRequest]);

  const fetchQuote = useCallback(
    async (options?: { immediate?: boolean }) => {
      if (!quoteRequest) {
        return;
      }
      if (!options?.immediate && payloadKey === lastPayloadKeyRef.current) {
        return;
      }
      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;
      setIsLoading(true);
      try {
        const result = await quoteBooking(quoteRequest);
        if (currentRequestId === requestIdRef.current) {
          setQuote(result);
          setError(null);
          lastPayloadKeyRef.current = payloadKey;
        }
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          setError(err as Error);
        }
        throw err;
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [payloadKey, quoteRequest],
  );

  const scheduleFetch = useCallback(
    (opts?: { immediate?: boolean }) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (opts?.immediate) {
        return fetchQuote({ immediate: true });
      }
      debounceRef.current = setTimeout(() => {
        fetchQuote();
      }, DEBOUNCE_DELAY_MS);
      return Promise.resolve();
    },
    [fetchQuote],
  );

  useEffect(() => {
    if (!quoteRequest) {
      setQuote(null);
      setError(null);
      lastPayloadKeyRef.current = '';
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }

    scheduleFetch();
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [quoteRequest, scheduleFetch]);

  const refreshQuote = useCallback(async () => {
    if (!quoteRequest) {
      return;
    }
    await scheduleFetch({ immediate: true });
  }, [quoteRequest, scheduleFetch]);

  return {
    quote,
    isLoading,
    error,
    refreshQuote,
    quoteRequest,
  };
}
