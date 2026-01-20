import { NotificationScheduleType } from '@prisma/client';
import { SchedulerService } from '../scheduler.service';

describe('SchedulerService reminders scheduling', () => {
  let scheduler: SchedulerService;
  let prismaMock: any;
  let notificationsMock: any;
  let i18nMock: any;

  beforeEach(async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    jest.setSystemTime(new Date('2025-12-01T10:00:00.000Z'));

    prismaMock = {
      notificationSchedule: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => ({
          id: `sched-${Math.random().toString().slice(2, 8)}`,
          ...data,
        })),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue(null),
      },
    };
    notificationsMock = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };
    i18nMock = {
      translate: jest.fn().mockImplementation((key) => Promise.resolve(key)),
    };

    scheduler = new SchedulerService(prismaMock, notificationsMock, i18nMock);
    await scheduler.onModuleInit();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates reminders for 24h/2h/30m + late slot with proper delays', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const scheduledAt = new Date('2025-12-02T12:00:00.000Z');
    const now = Date.now();
    await scheduler.scheduleBookingReminders({
      bookingId: 'booking-1',
      clientUserId: 'client-1',
      scheduledAt,
      targetUrl: '/client/bookings/booking-1',
      locale: 'pt-BR',
    });

    expect(prismaMock.notificationSchedule.create).toHaveBeenCalledTimes(4);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(4);

    const delays = setTimeoutSpy.mock.calls.map(([, delay]) => delay);
    expect(delays).toEqual([
      2 * 60 * 60 * 1000,
      24 * 60 * 60 * 1000,
      25.5 * 60 * 60 * 1000,
      26 * 60 * 60 * 1000 + 15 * 60 * 1000,
    ]);

    const created = prismaMock.notificationSchedule.create.mock.calls.map(
      (call) => call[0].data,
    );
    expect(created).toHaveLength(4);
    const reminderSlots = [
      { slot: '24H', offset: 24 * 60 * 60 * 1000 },
      { slot: '2H', offset: 2 * 60 * 60 * 1000 },
      { slot: '30M', offset: 30 * 60 * 1000 },
    ];
    reminderSlots.forEach((slot, index) => {
      const record = created[index];
      expect(record.type).toBe(NotificationScheduleType.BOOKING_REMINDER);
      expect(record.slot).toBe(slot.slot);
      expect(record.dedupeKey).toBe(`booking-1:BOOKING_REMINDER:${slot.slot}`);
      expect(record.payload.targetUrl).toBe('/client/bookings/booking-1');
      expect(record.runAt.getTime()).toBe(scheduledAt.getTime() - slot.offset);
      expect(record.runAt.getTime()).toBeGreaterThan(now);
    });
    expect(created[0].payload.targetUrl).toBe('/client/bookings/booking-1');

    const lateRecord = created[3];
    expect(lateRecord.type).toBe(NotificationScheduleType.PROVIDER_LATE);
    expect(lateRecord.dedupeKey).toBe('booking-1:PROVIDER_LATE');
    expect(lateRecord.slot).toBeNull();
    expect(lateRecord.runAt.getTime()).toBe(
      scheduledAt.getTime() + 15 * 60 * 1000,
    );
    expect(lateRecord.runAt.getTime()).toBeGreaterThan(now);

    setTimeoutSpy.mockRestore();
  });
});
