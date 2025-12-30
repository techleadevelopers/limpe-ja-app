import { Prisma, BookingStatus } from '@prisma/client';
import { BookingsService } from '../../src/bookings/bookings.service';
import { InsuranceService } from '../../src/insurance/insurance.service';

const createService = (prismaMock: any, queuesService: any) => {
  const schedulerService = {
    scheduleBookingReminders: jest.fn().mockResolvedValue(undefined),
    cancelPendingSchedules: jest.fn().mockResolvedValue(undefined),
    notifyJobStarted: jest.fn().mockResolvedValue(undefined),
    notifyJobEnded: jest.fn().mockResolvedValue(undefined),
  } as any;
  return new BookingsService(
    prismaMock,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    queuesService,
    {} as any,
    {} as any,
    new InsuranceService(),
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { translate: jest.fn().mockResolvedValue('translated') } as any,
    {} as any,
    {} as any,
    schedulerService,
  );
};

const buildBooking = (overrides: Partial<any> = {}) => ({
  id: 'booking-1',
  clientId: 'client-id',
  providerId: 'provider-id',
  provider: {
    userId: 'provider-user',
    user: { fullName: 'Provider', avatarUrl: 'avatar' },
  },
  client: { userId: 'client-user' },
  scheduledDate: new Date('2025-12-31'),
  scheduledTime: '10:00',
  scheduledStart: new Date(Date.now() - 5 * 60 * 1000),
  durationMinutes: 60,
  totalPrice: new Prisma.Decimal(100),
  status: BookingStatus.ARRIVED,
  notes: null,
  paymentIntent: { status: 'PAID' },
  providerService: { durationMinutes: 60 },
  address: null,
  review: null,
  isReviewed: false,
  guaranteeClaims: [],
  incidents: [],
  ...overrides,
}) as any;

describe('BookingsService start/end flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('transitions ARRIVED to STARTED and pushes notifications', async () => {
    const booking = buildBooking({ status: BookingStatus.ARRIVED });
    const updated = {
      ...booking,
      status: BookingStatus.STARTED,
      startedAt: new Date(),
      startedByUser: { connect: { id: 'provider-user' } },
    };
    const queuesService = {
      addNotificationJob: jest.fn().mockResolvedValue(undefined),
      addJob: jest.fn().mockResolvedValue(undefined),
    };
    const prismaMock = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(booking),
        update: jest.fn().mockResolvedValue(updated),
      },
    };

    const service = createService(prismaMock, queuesService);
    const result = await service.startService('booking-1', 'provider-user');

    expect(result.status).toBe(BookingStatus.STARTED);
    expect(prismaMock.booking.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'booking-1' } }),
    );
    expect(prismaMock.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-1' },
        data: expect.objectContaining({
          status: BookingStatus.STARTED,
          startedAt: expect.any(Date),
          startedByUser: { connect: { id: 'provider-user' } },
        }),
      }),
    );

    expect(queuesService.addNotificationJob).toHaveBeenCalledTimes(2);
    const jobKinds = queuesService.addNotificationJob.mock.calls.map(
      (call) => call[1].kind,
    );
    expect(jobKinds).toEqual(['booking_status', 'service_started']);
  });

  it('completes STARTED booking and notifies both parties', async () => {
    const startedDate = new Date(Date.now() - 70 * 60 * 1000);
    const booking = buildBooking({
      status: BookingStatus.STARTED,
      scheduledStart: startedDate,
      startedAt: startedDate,
    });
    const updated = {
      ...booking,
      status: BookingStatus.FINISHED,
      completedAt: new Date(),
      completedByUser: { connect: { id: 'provider-user' } },
    };
    const queuesService = {
      addNotificationJob: jest.fn().mockResolvedValue(undefined),
      addJob: jest.fn().mockResolvedValue(undefined),
    };
    const prismaMock = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(booking),
        update: jest.fn().mockResolvedValue(updated),
      },
    };

    const service = createService(prismaMock, queuesService);
    const result = await service.completeService('booking-1', 'provider-user');

    expect(result.status).toBe(BookingStatus.FINISHED);
    expect(prismaMock.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-1' },
        data: expect.objectContaining({
          status: BookingStatus.FINISHED,
          completedAt: expect.any(Date),
        }),
      }),
    );

    const notificationPayloads = queuesService.addNotificationJob.mock.calls.map(
      (call) => call[1],
    );
    expect(notificationPayloads.length).toBeGreaterThanOrEqual(2);
    const notificationKinds = notificationPayloads.map((payload) => payload.kind);
    expect(notificationKinds.every((kind) => kind === 'booking_finished')).toBe(true);
    const notifiedUserIds = notificationPayloads.map((payload) => payload.userId);
    expect(notifiedUserIds).toEqual(
      expect.arrayContaining(['client-user', 'provider-user']),
    );
  });
});
