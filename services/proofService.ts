import { api } from './api';
import { BookingProofPayload, BookingProof } from '../types/backend/bookings';

const buildProofUrl = (bookingId: string, type: 'checkin' | 'checkout') =>
  `/bookings/${bookingId}/proof/${type}`;

export async function submitCheckinProof(
  bookingId: string,
  payload: BookingProofPayload,
): Promise<BookingProof> {
  const response = await api.post<BookingProof>(
    buildProofUrl(bookingId, 'checkin'),
    payload,
  );
  return response.data;
}

export async function submitCheckoutProof(
  bookingId: string,
  payload: BookingProofPayload,
): Promise<BookingProof> {
  const response = await api.post<BookingProof>(
    buildProofUrl(bookingId, 'checkout'),
    payload,
  );
  return response.data;
}
