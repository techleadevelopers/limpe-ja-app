import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getBookingsForUser,
  getBookingDetails,
  updateBookingStatus,
  startBooking,
  completeBooking,
  cancelBooking,
} from '../services/bookingService';
import { BookingDetails, BookingStatus } from '../types/backend/bookings';
import { PaymentIntentStatus } from '../types/backend/payments';
import { useAuth } from './useAuth';

type FilterStatus = BookingStatus | undefined;

interface UseProviderBookingsOptions {
  initialStatus?: FilterStatus;
}

export function useProviderBookings(options?: UseProviderBookingsOptions) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerId = (user as any)?.providerDetails?.id || (user as any)?.providerDetails?.providerId;
  const ensureTermsAccepted = useCallback(() => {
    const accepted =
      (user as any)?.termsAcceptedAt ||
      (user as any)?.providerDetails?.termsAcceptedAt;
    if (!accepted) {
      throw new Error('Aceite os termos antes de executar a acao.');
    }
  }, [user]);

  const loadBookings = useCallback(
    async (status?: FilterStatus) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBookingsForUser(status);
        setBookings(data || []);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar agendamentos.');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadBookings(options?.initialStatus);
  }, [options?.initialStatus, loadBookings]);

  const refresh = useCallback(
    async (status?: FilterStatus) => {
      setIsRefreshing(true);
      try {
        await loadBookings(status ?? options?.initialStatus);
      } finally {
        setIsRefreshing(false);
      }
    },
    [loadBookings, options?.initialStatus],
  );

  const assertOwner = useCallback(
    (booking: BookingDetails) => {
      if (!providerId || booking.providerId !== providerId) {
        throw new Error('Acao nao permitida para este agendamento.');
      }
    },
    [providerId],
  );

  const getBooking = useCallback(
    async (bookingId: string) => {
      const b = await getBookingDetails(bookingId);
      assertOwner(b);
      return b;
    },
    [assertOwner],
  );

  const safeUpdateLocal = useCallback((updated: BookingDetails) => {
    setBookings((prev) => {
      const idx = prev.findIndex((b) => b.id === updated.id);
      if (idx === -1) return [...prev, updated];
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
  }, []);

  const ensurePaidIfNeeded = (booking: BookingDetails, nextStatus: BookingStatus) => {
    if (nextStatus === BookingStatus.COMPLETED) {
      const payStatus = booking.paymentIntent?.status as PaymentIntentStatus | undefined;
      if (payStatus !== PaymentIntentStatus.PAID) {
        throw new Error('Pagamento nao confirmado. Conclusao bloqueada ate o PIX ser pago.');
      }
    }
  };

  const updateStatus = useCallback(
    async (bookingId: string, status: BookingStatus) => {
      ensureTermsAccepted();
      const booking = await getBooking(bookingId);
      assertOwner(booking);
      ensurePaidIfNeeded(booking, status);
      const updated = await updateBookingStatus(bookingId, { status });
      safeUpdateLocal(updated);
      return updated;
    },
    [assertOwner, getBooking, safeUpdateLocal],
  );

  const accept = useCallback(
    async (bookingId: string) => updateStatus(bookingId, BookingStatus.CONFIRMED),
    [updateStatus],
  );

  const refuse = useCallback(
    async (bookingId: string) => updateStatus(bookingId, BookingStatus.CANCELED),
    [updateStatus],
  );

  const start = useCallback(
    async (bookingId: string) => {
      ensureTermsAccepted();
      const booking = await getBooking(bookingId);
      assertOwner(booking);
      if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) {
        throw new Error('Somente agendamentos confirmados podem ser iniciados.');
      }
      const updated = await startBooking(bookingId);
      safeUpdateLocal(updated);
      return updated;
    },
    [assertOwner, getBooking, safeUpdateLocal],
  );

  const complete = useCallback(
    async (bookingId: string) => {
      ensureTermsAccepted();
      const booking = await getBooking(bookingId);
      assertOwner(booking);
      if (booking.status !== BookingStatus.IN_PROGRESS) {
        throw new Error('Somente agendamentos em andamento podem ser concluidos.');
      }
      ensurePaidIfNeeded(booking, BookingStatus.COMPLETED);
      const updated = await completeBooking(bookingId);
      safeUpdateLocal(updated);
      return updated;
    },
    [assertOwner, getBooking, safeUpdateLocal],
  );

  const cancel = useCallback(
    async (bookingId: string) => {
      ensureTermsAccepted();
      const booking = await getBooking(bookingId);
      assertOwner(booking);
      const updated = await cancelBooking(bookingId);
      safeUpdateLocal(updated);
      return updated;
    },
    [assertOwner, getBooking, safeUpdateLocal],
  );

  const dataByStatus = useMemo(() => {
    const groups: Record<string, BookingDetails[]> = {};
    bookings.forEach((b) => {
      const s = b.status || 'UNKNOWN';
      groups[s] = groups[s] ? [...groups[s], b] : [b];
    });
    return groups;
  }, [bookings]);

  return {
    bookings,
    dataByStatus,
    isLoading,
    isRefreshing,
    error,
    refresh,
    loadBookings,
    accept,
    refuse,
    start,
    complete,
    cancel,
    updateStatus,
  };
}
