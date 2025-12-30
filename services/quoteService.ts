import { api } from './api';
import { BookingQuoteRequest, BookingQuoteResponse } from '../types/backend/bookings';

export async function quoteBooking(
  payload: BookingQuoteRequest,
): Promise<BookingQuoteResponse> {
  const response = await api.post<BookingQuoteResponse>('/bookings/quote', payload);
  return response.data;
}
