import { BookingStatus } from '@prisma/client';
import {
  BookingEvent,
  BookingStateMachine,
  normalizeBookingStatus,
} from './booking.state-machine';

describe('BookingStateMachine', () => {
  it('moves PENDING bookings to CONFIRMED via the confirm event', () => {
    const nextStatus = BookingStateMachine.getNextStatus(
      BookingStatus.PENDING,
      BookingEvent.CONFIRM,
    );

    expect(nextStatus).toBe(BookingStatus.CONFIRMED);
    expect(
      BookingStateMachine.canTransition(
        BookingStatus.PENDING,
        BookingEvent.CONFIRM,
      ),
    ).toBe(true);
  });

  it('normalizes legacy statuses and rejects disallowed events', () => {
    expect(normalizeBookingStatus('ACCEPTED')).toBe(BookingStatus.CONFIRMED);

    const canNoShowFromAccepted = BookingStateMachine.canTransition(
      'ACCEPTED',
      BookingEvent.MARK_NO_SHOW,
    );
    expect(canNoShowFromAccepted).toBe(false);
  });
});
