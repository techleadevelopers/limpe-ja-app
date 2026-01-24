import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class CleanupDeletedUserNotificationsJob {
  private readonly logger = new Logger(CleanupDeletedUserNotificationsJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    await this.deleteNotificationsForDeletedUsers();
  }

  async deleteNotificationsForDeletedUsers(now: Date = new Date()) {
    const threshold = new Date(now.getTime() - THIRTY_DAYS_MS);
    const deleted = await this.prisma.notification.deleteMany({
      where: {
        user: {
          deletionScheduledAt: {
            not: null,
            lt: threshold,
          },
        },
      },
    });

    if (deleted.count > 0) {
      this.logger.log(
        `[CleanupDeletedUserNotificationsJob] Removed ${deleted.count} notification(s) for users deleted before ${threshold.toISOString()}`,
      );
    }
  }
}
