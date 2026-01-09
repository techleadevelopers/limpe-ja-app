import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpireBookingsJob {
  private readonly logger = new Logger(ExpireBookingsJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.expireDueBookings();
  }

  async expireDueBookings(now: Date = new Date()) {
    const dueBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING_PAYMENT,
        expiresAt: { not: null, lt: now },
      },
      select: {
        id: true,
        providerId: true,
        scheduledStart: true,
        expiresAt: true,
      },
    });

    for (const booking of dueBookings) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EXPIRED },
      });
      this.logger.log(
        `[ExpireBookingsJob] Expired booking ${booking.id} provider=${booking.providerId} startAt=${booking.scheduledStart?.toISOString() ?? 'null'} expiresAt=${booking.expiresAt?.toISOString() ?? 'null'} reason=payment_timeout`,
      );
    }
  }
}
