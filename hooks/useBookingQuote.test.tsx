import React, { useEffect } from 'react';
import { act, render } from '@testing-library/react-native';
import { useBookingQuote } from './useBookingQuote';
import * as quoteService from '../services/quoteService';
import {
  BookingQuoteRequest,
  BookingQuoteResponse,
} from '../types/backend/bookings';

jest.mock('../services/quoteService');

const basePayload = (): BookingQuoteRequest => ({
  providerId: 'provider-id',
  providerServiceId: 'service-id',
  scheduledDate: '2025-12-31',
  scheduledTime: '10:00',
  address: {
    latitude: -23.55,
    longitude: -46.63,
    city: 'SAO PAULO',
    state: 'SP',
    cep: '01001000',
    street: 'Rua Teste',
    number: '123',
    complement: null,
    neighborhood: 'Centro',
  },
  insurancePlanId: null,
});

const createResponse = (price: number): BookingQuoteResponse => ({
  finalPrice: price,
  subtotal: price,
  discountAmount: 0,
  platformFee: 0,
  providerNet: price,
  couponApplied: false,
  quoteId: `quote-${price}`,
  quoteHash: `hash-${price}`,
  expiresAt: new Date().toISOString(),
  totalCents: price * 100,
  insuranceFeeCents: 0,
  insuranceOptions: [],
  breakdown: [{ label: 'Subtotal', amount: price }],
});

describe('useBookingQuote', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('skips fetching when request key or payload is missing', () => {
    const resultRef: { current: ReturnType<typeof useBookingQuote> | null } = {
      current: null,
    };

    const TestHost = ({ payload, requestKey }: { payload: BookingQuoteRequest | null; requestKey: string }) => {
      const hook = useBookingQuote({ payload, requestKey });
      useEffect(() => {
        resultRef.current = hook;
      }, [hook]);
      return null;
    };

    render(<TestHost payload={null} requestKey="" />);
    expect(quoteService.quoteBooking).not.toHaveBeenCalled();
    expect(resultRef.current?.quote).toBeNull();
  });

  it('applies only the latest quote when keys change mid-flight', async () => {
    const resultRef: { current: ReturnType<typeof useBookingQuote> | null } = {
      current: null,
    };
    const payload = basePayload();

    let resolveFirst: (value: BookingQuoteResponse) => void;
    let resolveSecond: (value: BookingQuoteResponse) => void;

    (quoteService.quoteBooking as jest.Mock)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const TestHost = ({ requestKey }: { requestKey: string }) => {
      const hook = useBookingQuote({ payload, requestKey });
      useEffect(() => {
        resultRef.current = hook;
      }, [hook]);
      return null;
    };

    const renderer = render(<TestHost requestKey="alpha" />);
    await act(async () => {
      await Promise.resolve();
    });

    renderer.update(<TestHost requestKey="beta" />);
    await act(async () => {
      resolveSecond!(createResponse(200));
    });

    expect(resultRef.current?.quote?.finalPrice).toBe(200);

    await act(async () => {
      resolveFirst!(createResponse(100));
    });

    expect(resultRef.current?.quote?.finalPrice).toBe(200);
  });

  it('refreshQuote forces another fetch even when key is identical', async () => {
    const resultRef: { current: ReturnType<typeof useBookingQuote> | null } = {
      current: null,
    };
    const payload = basePayload();

    (quoteService.quoteBooking as jest.Mock)
      .mockResolvedValueOnce(createResponse(300))
      .mockResolvedValueOnce(createResponse(350));

    const TestHost = () => {
      const hook = useBookingQuote({ payload, requestKey: 'stable' });
      useEffect(() => {
        resultRef.current = hook;
      }, [hook]);
      return null;
    };

    render(<TestHost />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(resultRef.current?.quote?.finalPrice).toBe(300);
    await act(async () => {
      await resultRef.current?.refreshQuote();
    });

    expect(resultRef.current?.quote?.finalPrice).toBe(350);
    expect(quoteService.quoteBooking).toHaveBeenCalledTimes(2);
  });

  it('marks status invalid on 400 errors and keeps the last successful quote', async () => {
    const resultRef: { current: ReturnType<typeof useBookingQuote> | null } = {
      current: null,
    };
    const payload = basePayload();

    (quoteService.quoteBooking as jest.Mock)
      .mockResolvedValueOnce(createResponse(500))
      .mockRejectedValueOnce({ response: { status: 400 } });

    const TestHost = () => {
      const hook = useBookingQuote({ payload, requestKey: 'invalid-key' });
      useEffect(() => {
        resultRef.current = hook;
      }, [hook]);
      return null;
    };

    render(<TestHost />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(resultRef.current?.quote?.finalPrice).toBe(500);

    await act(async () => {
      await resultRef.current?.refreshQuote();
    });

    expect(resultRef.current?.status).toBe('invalid');
    expect(resultRef.current?.quote?.finalPrice).toBe(500);
  });
});
