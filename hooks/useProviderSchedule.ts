import { useMemo } from 'react';
import { fetchProviderAppointments } from '../services/providerScheduleService';
import { useCancelableLoadable } from './useCancelableLoadable';
import { BookingDetails } from '../types/backend/bookings';

export function useProviderSchedule(range?: { start?: string; end?: string }) {
  const loader = useCancelableLoadable<BookingDetails[]>({
    factory: (signal) => fetchProviderAppointments(range, signal),
    timeoutMs: 8000,
    dependencies: range ? [range.start, range.end] : [],
  });

  const appointments = useMemo(() => loader.data ?? [], [loader.data]);

  return {
    ...loader,
    appointments,
  };
}
