import { api } from './api';
import { BookingQuoteRequest, BookingQuoteResponse } from '../types/backend/bookings';
import { quoteBooking } from './quoteService';

jest.mock('./api', () => ({
  api: {
    post: jest.fn(),
  },
}));

describe('quoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts the payload to /bookings/quote and returns the response', async () => {
    const payload: BookingQuoteRequest = {
      providerId: 'provider-id',
      providerServiceId: 'provider-service-id',
      scheduledDate: '2025-12-31',
      scheduledTime: '10:00',
      address: {
        latitude: -23.55,
        longitude: -46.63,
        city: 'SAO PAULO',
        state: 'SP',
        cep: '01234567',
      },
    };
    const mockResponse: BookingQuoteResponse = {
      finalPrice: 120,
      subtotal: 120,
      discountAmount: 0,
      platformFee: 18,
      providerNet: 102,
      couponApplied: false,
      quoteId: 'quote-id',
      quoteHash: 'abc123',
      expiresAt: new Date().toISOString(),
      breakdown: [{ label: 'Subtotal', amount: 120 }],
    };
    (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await quoteBooking(payload);

    expect(api.post).toHaveBeenCalledWith('/bookings/quote', payload);
    expect(result).toBe(mockResponse);
  });
});
