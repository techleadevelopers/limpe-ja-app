import { BookingStatus } from '@prisma/client';
import { ExpireBookingsJob } from './expire-bookings.job';

describe('ExpireBookingsJob', () => {
  let job: ExpireBookingsJob;
  let prismaMock: {
    booking: {
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      booking: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    job = new ExpireBookingsJob(prismaMock as any);
  });

  it('expires due pending-payment bookings', async () => {
    const booking = {
      id: 'booking-1',
      providerId: 'provider-1',
      scheduledStart: new Date('2025-01-01T10:00:00Z'),
      expiresAt: new Date('2025-01-01T09:55:00Z'),
    };
    prismaMock.booking.findMany.mockResolvedValue([booking]);

    await job.expireDueBookings(new Date('2025-01-01T10:00:00Z'));

    expect(prismaMock.booking.update).toHaveBeenCalledWith({
      where: { id: booking.id },
      data: { status: BookingStatus.EXPIRED },
    });
  });

  it('does nothing when no bookings are due', async () => {
    prismaMock.booking.findMany.mockResolvedValue([]);

    await job.expireDueBookings(new Date('2025-01-01T10:00:00Z'));

    expect(prismaMock.booking.update).not.toHaveBeenCalled();
  });
});
