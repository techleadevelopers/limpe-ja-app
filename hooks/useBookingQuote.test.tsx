import React, { useEffect, useRef } from 'react';
import { act, render } from '@testing-library/react-native';
import { useBookingQuote } from './useBookingQuote';
import * as quoteService from '../services/quoteService';
import { BookingQuoteResponse } from '../types/backend/bookings';

jest.useFakeTimers();
jest.mock('../services/quoteService');

const mockBooking = {
  finalPrice: 120,
  subtotal: 120,
  discountAmount: 0,
  platformFee: 18,
  providerNet: 102,
  couponApplied: false,
  quoteId: 'quote-id',
  quoteHash: 'quote-hash',
  expiresAt: new Date().toISOString(),
  breakdown: [{ label: 'Subtotal', amount: 120 }],
} as BookingQuoteResponse;

const buildHookInput = (overrides: Partial<Parameters<typeof useBookingQuote>[0]> = {}) => ({
  providerId: 'provider-id',
  providerServiceId: 'provider-service-id',
  scheduledDate: '2025-12-31',
  scheduledTime: '10:00',
  address: {
    latitude: -23.55,
    longitude: -46.63,
    city: 'SAO PAULO',
    state: 'SP',
    cep: '01000-000',
    street: 'Rua Teste',
    number: '123',
    complement: null,
    neighborhood: 'Centro',
  },
  durationMinutes: 120,
  squareMeters: undefined,
  roomCount: undefined,
  couponCode: undefined,
  subscriptionId: undefined,
  addons: undefined,
  ...overrides,
});

describe('useBookingQuote', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debounces API calls when inputs change', async () => {
    (quoteService.quoteBooking as jest.Mock).mockResolvedValue(mockBooking);
    const resultRef: { current: ReturnType<typeof useBookingQuote> | null } = {
      current: null,
    };

    const TestHost = ({ couponCode }: { couponCode?: string }) => {
      const hook = useBookingQuote(buildHookInput({ couponCode }));
      useEffect(() => {
        resultRef.current = hook;
      }, [hook]);
      return null;
    };

    const renderer = render(<TestHost />);

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(quoteService.quoteBooking).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(quoteService.quoteBooking).toHaveBeenCalledTimes(1);

    await act(async () => {
      renderer.update(<TestHost couponCode="NEW" />);
      jest.advanceTimersByTime(300);
    });
    expect(quoteService.quoteBooking).toHaveBeenCalledTimes(2);
  });

  it('refreshQuote forcibly reruns the request and updates the quote', async () => {
    const firstResponse = { ...mockBooking, finalPrice: 110, subtotal: 110 };
    const secondResponse = { ...mockBooking, finalPrice: 130, subtotal: 130 };
    (quoteService.quoteBooking as jest.Mock)
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);

    const resultRef: { current: ReturnType<typeof useBookingQuote> | null } = {
      current: null,
    };

    const TestHost = () => {
      const hook = useBookingQuote(buildHookInput());
      useEffect(() => {
        resultRef.current = hook;
      }, [hook]);
      return null;
    };

    render(<TestHost />);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(quoteService.quoteBooking).toHaveBeenCalledTimes(1);

    await act(async () => {
      await resultRef.current?.refreshQuote();
    });

    expect(quoteService.quoteBooking).toHaveBeenCalledTimes(2);
    expect(resultRef.current?.quote?.finalPrice).toBe(130);
  });
});
