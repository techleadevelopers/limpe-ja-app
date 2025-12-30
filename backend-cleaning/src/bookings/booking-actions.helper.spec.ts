import {
  BookingStatus,
  PaymentIntentStatus,
  UserRole,
} from '@prisma/client';
import {
  BookingActionContext,
  getAllowedBookingActions,
} from './booking-actions.helper';

describe('booking actions helper', () => {
  it('exposes cancel/support for clients on confirmed bookings', () => {
    const context: BookingActionContext = {
      status: BookingStatus.CONFIRMED,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '10:00',
      paymentIntentStatus: PaymentIntentStatus.PAID,
    };

    const actions = getAllowedBookingActions(context, UserRole.CLIENT);
    expect(actions).toEqual(expect.arrayContaining(['CANCEL', 'CONTACT_SUPPORT']));
    expect(actions).toContain('OPEN_DISPUTE');
  });

  it('allows providers to start when arrived + paid', () => {
    const now = new Date();
    const scheduledStart = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago
    const context: BookingActionContext = {
      status: BookingStatus.ARRIVED,
      scheduledDate: scheduledStart.toISOString().split('T')[0],
      scheduledTime: scheduledStart.toISOString().slice(11, 16),
      scheduledStart,
      paymentIntentStatus: PaymentIntentStatus.PAID,
    };

    const actions = getAllowedBookingActions(context, UserRole.PROVIDER);
    expect(actions).toContain('START_SERVICE');
  });

  it('allows providers to complete once started and past expected end', () => {
    const now = new Date();
    const startedAt = new Date(now.getTime() - 90 * 60 * 1000); // 90 min ago
    const context: BookingActionContext = {
      status: BookingStatus.STARTED,
      scheduledDate: startedAt.toISOString().split('T')[0],
      scheduledTime: startedAt.toISOString().slice(11, 16),
      startedAt,
      durationMinutes: 60,
      paymentIntentStatus: PaymentIntentStatus.PAID,
    };

    const actions = getAllowedBookingActions(context, UserRole.PROVIDER);
    expect(actions).toContain('COMPLETE_SERVICE');
  });
});
