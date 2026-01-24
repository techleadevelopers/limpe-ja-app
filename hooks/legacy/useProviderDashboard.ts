import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookingDetails, BookingStatus } from '../types/backend/bookings';
import { ProviderDashboard, ProviderTransaction } from '../types/backend/providers';
import { getBookingsForUser } from '../services/bookingService';
import { getMyProviderDashboard } from '../services/dashboardService';
import { getMyProviderEarnings } from '../services/providerService';

interface UseProviderDashboardOptions {
  /**
   * Evita buscar bookings quando outra fonte já os traz (ex.: useProviderBookings no dashboard).
   * Mantém o restante (dashboard/earnings) intacto.
   */
  loadBookings?: boolean;
}

export function useProviderDashboard(options?: UseProviderDashboardOptions) {
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [dashboard, setDashboard] = useState<ProviderDashboard | null>(null);
  const [earnings, setEarnings] = useState<ProviderTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const promises = [
        options?.loadBookings === false ? Promise.resolve(null) : getBookingsForUser(),
        getMyProviderDashboard(),
        getMyProviderEarnings(),
      ] as const;
      const [b, d, e] = await Promise.all(promises);
      if (b) setBookings(b || []);
      setDashboard(d || null);
      setEarnings(e || []);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar painel.');
    } finally {
      setIsLoading(false);
    }
  }, [options?.loadBookings]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadAll();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAll]);

  const bookingsByStatus = useMemo(() => {
    const groups: Record<string, BookingDetails[]> = {};
    bookings.forEach((b) => {
      const s = b.status || 'UNKNOWN';
      groups[s] = groups[s] ? [...groups[s], b] : [b];
    });
    return groups;
  }, [bookings]);

  return {
    bookings,
    bookingsByStatus,
    dashboard,
    earnings,
    isLoading,
    isRefreshing,
    error,
    refresh,
    reload: loadAll,
  };
}
