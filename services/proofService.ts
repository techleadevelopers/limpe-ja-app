import { api } from './api';
import { BookingProofPayload, BookingProof } from '../types/backend/bookings';

export async function submitCheckinProof(
  bookingId: string,
  payload: BookingProofPayload,
): Promise<BookingProof> {
  const response = await api.post<BookingProof>(
    `/bookings/${bookingId}/proof/checkin`,
    payload,
  );
  return response.data;
}

export async function submitCheckoutProof(
  bookingId: string,
  payload: BookingProofPayload,
): Promise<BookingProof> {
  const response = await api.post<BookingProof>(
    `/bookings/${bookingId}/proof/checkout`,
    payload,
  );
  return response.data;
}
