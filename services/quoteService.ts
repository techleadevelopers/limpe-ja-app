import { api } from './api';
import type { AxiosRequestConfig } from 'axios';
import { BookingQuoteRequest, BookingQuoteResponse } from '../types/backend/bookings';

export async function quoteBooking(
  payload: BookingQuoteRequest,
  config?: AxiosRequestConfig,
): Promise<BookingQuoteResponse> {
  const response = await api.post<BookingQuoteResponse>('/bookings/quote', payload, config);
  return response.data;
}
