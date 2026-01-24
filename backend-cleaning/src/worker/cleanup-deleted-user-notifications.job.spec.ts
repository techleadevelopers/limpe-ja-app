import { CleanupDeletedUserNotificationsJob } from './cleanup-deleted-user-notifications.job';

describe('CleanupDeletedUserNotificationsJob', () => {
  let job: CleanupDeletedUserNotificationsJob;
  let prismaMock: {
    notification: {
      deleteMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      notification: {
        deleteMany: jest.fn(),
      },
    };
    job = new CleanupDeletedUserNotificationsJob(prismaMock as any);
  });

  it('removes notifications for users deleted more than 30 days ago', async () => {
    const now = new Date('2026-02-01T12:00:00.000Z');
    const threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    prismaMock.notification.deleteMany.mockResolvedValue({ count: 5 });

    await job.deleteNotificationsForDeletedUsers(now);

    expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
      where: {
        user: {
          deletionScheduledAt: {
            not: null,
            lt: threshold,
          },
        },
      },
    });
  });

  it('can run without matching notifications', async () => {
    prismaMock.notification.deleteMany.mockResolvedValue({ count: 0 });

    await job.deleteNotificationsForDeletedUsers();

    expect(prismaMock.notification.deleteMany).toHaveBeenCalled();
  });
});
