import { BookingDetails, BookingStatus } from '../types/backend/bookings';
import { api } from './api';
import { mapBookingStatusArray } from './adapters/bookingStatus';

export const fetchProviderAppointments = async (
  range?: { start?: string; end?: string },
  signal?: AbortSignal,
): Promise<BookingDetails[]> => {
  const params: Record<string, string> = {
    status: BookingStatus.CONFIRMED,
  };
  if (range?.start) params.start = range.start;
  if (range?.end) params.end = range.end;
  const response = await api.get<BookingDetails[]>('/bookings/me', {
    params,
    signal,
  });
  return mapBookingStatusArray(response.data);
};
