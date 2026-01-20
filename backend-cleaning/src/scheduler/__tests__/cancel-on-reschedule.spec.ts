import {
  NotificationScheduleStatus,
  NotificationScheduleType,
} from '@prisma/client';
import { SchedulerService } from '../scheduler.service';

describe('SchedulerService cancel pending schedules', () => {
  let scheduler: SchedulerService;
  let prismaMock: any;
  let notificationsMock: any;
  let i18nMock: any;

  beforeEach(async () => {
    prismaMock = {
      notificationSchedule: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'sched-1' }, { id: 'sched-2' }]),
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        update: jest.fn(),
      },
    };
    notificationsMock = { createNotification: jest.fn() };
    i18nMock = { translate: jest.fn().mockResolvedValue('translated') };

    scheduler = new SchedulerService(prismaMock, notificationsMock, i18nMock);
    await scheduler.onModuleInit();
  });

  it('marks pending schedules as cancelled for reschedules', async () => {
    const runAfter = new Date('2025-12-01T00:00:00.000Z');

    await scheduler.cancelPendingSchedules('booking-123', {
      types: [NotificationScheduleType.BOOKING_REMINDER],
      runAfter,
    });

    expect(prismaMock.notificationSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bookingId: 'booking-123',
          status: NotificationScheduleStatus.PENDING,
          type: { in: [NotificationScheduleType.BOOKING_REMINDER] },
          runAt: { gt: runAfter },
        }),
      }),
    );
    const updateCall =
      prismaMock.notificationSchedule.updateMany.mock.calls[0][0];
    expect(updateCall.where).toEqual(
      expect.objectContaining({
        bookingId: 'booking-123',
        status: NotificationScheduleStatus.PENDING,
        type: { in: [NotificationScheduleType.BOOKING_REMINDER] },
        runAt: { gt: runAfter },
      }),
    );
    expect(updateCall.data).toEqual(
      expect.objectContaining({
        status: NotificationScheduleStatus.CANCELLED,
        cancelledAt: expect.any(Date),
      }),
    );
  });
});
