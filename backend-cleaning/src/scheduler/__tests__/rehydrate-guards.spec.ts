import {
  NotificationScheduleStatus,
  NotificationScheduleType,
} from '@prisma/client';
import { SchedulerService } from '../scheduler.service';

describe('SchedulerService rehydrate pending guards', () => {
  let scheduler: SchedulerService;
  let prismaMock: any;
  let notificationsMock: any;
  let i18nMock: any;

  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    prismaMock = {
      notificationSchedule: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    notificationsMock = {
      createNotification: jest.fn(),
    };
    i18nMock = {
      translate: jest.fn().mockResolvedValue('translated'),
    };
    scheduler = new SchedulerService(prismaMock, notificationsMock, i18nMock);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ignores schedules without a valid runAt but rehydrates the rest', async () => {
    const invalidSchedule = {
      id: 'invalid',
      bookingId: 'booking-invalid',
      runAt: undefined,
      type: NotificationScheduleType.BOOKING_REMINDER,
      slot: '24H',
      status: NotificationScheduleStatus.PENDING,
      dedupeKey: 'invalid',
      payload: {
        userId: 'client',
        type: 'BOOKING_REMINDER',
        category: 'booking',
        title: 'title',
        message: 'message',
        targetUrl: '/client/bookings/booking-invalid',
        payload: {},
        idempotencyKey: 'invalid',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const isoSchedule = {
      ...invalidSchedule,
      id: 'iso',
      runAt: '2025-12-01T10:00:00.000Z',
    };
    const dateSchedule = {
      ...invalidSchedule,
      id: 'date',
      runAt: new Date('2025-12-01T11:00:00.000Z'),
    };

    prismaMock.notificationSchedule.findMany.mockResolvedValue([
      invalidSchedule,
      isoSchedule,
      dateSchedule,
    ]);

    const scheduleTimerSpy = jest.spyOn(
      scheduler as any,
      'scheduleTimer' as any,
    );
    const debugSpy = jest.spyOn((scheduler as any).logger, 'debug');

    await scheduler.onModuleInit();

    expect(scheduleTimerSpy).toHaveBeenCalledTimes(2);
    expect((scheduleTimerSpy.mock.calls[0][0] as any).id).toBe('iso');
    expect((scheduleTimerSpy.mock.calls[1][0] as any).id).toBe('date');
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('Schedule invalid sem runAt válido'),
    );
  });
});
