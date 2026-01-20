import {
  NotificationScheduleStatus,
  NotificationScheduleType,
} from '@prisma/client';
import { SchedulerService } from '../scheduler.service';

describe('SchedulerService job started flow', () => {
  let scheduler: SchedulerService;
  let prismaMock: any;
  let notificationsMock: any;
  let i18nMock: any;

  beforeEach(async () => {
    let lastRecord: any = null;
    prismaMock = {
      notificationSchedule: {
        findMany: jest.fn().mockImplementation(async (query) => {
          if (query?.select) {
            return [{ id: 'sched-late' }];
          }
          return [];
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          lastRecord = { id: 'sched-job-start', ...data };
          return lastRecord;
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (lastRecord && where?.id === lastRecord.id) {
            return lastRecord;
          }
          return null;
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
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

  it('cancels late reminders and emits job started event', async () => {
    const cancelSpy = jest.spyOn(scheduler, 'cancelPendingSchedules');
    await scheduler.notifyJobStarted({
      bookingId: 'booking-42',
      clientUserId: 'client-42',
      targetUrl: '/client/bookings/booking-42',
      locale: 'pt-BR',
    });

    expect(prismaMock.notificationSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bookingId: 'booking-42',
          status: NotificationScheduleStatus.PENDING,
          type: expect.objectContaining({
            in: expect.arrayContaining([
              NotificationScheduleType.BOOKING_REMINDER,
              NotificationScheduleType.PROVIDER_LATE,
            ]),
          }),
        }),
      }),
    );
    expect(prismaMock.notificationSchedule.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bookingId: 'booking-42',
          status: NotificationScheduleStatus.PENDING,
          type: expect.objectContaining({
            in: expect.arrayContaining([
              NotificationScheduleType.BOOKING_REMINDER,
              NotificationScheduleType.PROVIDER_LATE,
            ]),
          }),
        }),
        data: expect.objectContaining({
          status: NotificationScheduleStatus.CANCELLED,
          cancelledAt: expect.any(Date),
        }),
      }),
    );
    expect(cancelSpy).toHaveBeenCalledWith(
      'booking-42',
      expect.objectContaining({
        types: expect.arrayContaining([
          NotificationScheduleType.BOOKING_REMINDER,
          NotificationScheduleType.PROVIDER_LATE,
        ]),
        runAfter: expect.any(Date),
      }),
    );
    cancelSpy.mockRestore();

    expect(notificationsMock.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'JOB_STARTED',
        userId: 'client-42',
        targetUrl: '/client/bookings/booking-42',
        dedupeKey: 'booking-42:JOB_STARTED',
      }),
    );
    const notificationPayload =
      notificationsMock.createNotification.mock.calls[0][0];
    expect(notificationPayload.dedupeKey).toBe('booking-42:JOB_STARTED');
  });
});
