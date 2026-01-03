import { useMemo } from 'react';
import { fetchProviderAppointments, ProviderAppointment } from '../services/providerScheduleService';
import { useCancelableLoadable } from './useCancelableLoadable';

export function useProviderSchedule() {
  const loader = useCancelableLoadable<ProviderAppointment[]>({
    factory: (signal) => fetchProviderAppointments(undefined, undefined, signal),
    timeoutMs: 8000,
  });

  const appointments = useMemo(() => loader.data ?? [], [loader.data]);

  return {
    ...loader,
    appointments,
  };
}
