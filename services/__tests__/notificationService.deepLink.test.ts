import { toAppEvent } from '../notificationService';

describe('notificationService deep link normalization', () => {
  it('keeps deeplink from the payload as targetUrl', () => {
    const raw = {
      id: 'evt-1',
      userId: 'client-1',
      type: 'BOOKING_REMINDER',
      message: 'Seu serviço começa em breve.',
      payload: {
        deeplink: '/client/bookings/booking-1',
        bookingId: 'booking-1',
      },
      dedupeKey: 'booking-1:BOOKING_REMINDER:24H',
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    const event = toAppEvent(raw);
    expect(event.targetUrl).toBe('/client/bookings/booking-1');
    expect(event.payload?.bookingId).toBe('booking-1');
    expect(event.dedupeKey).toBe('booking-1:BOOKING_REMINDER:24H');
  });
});
