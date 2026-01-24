import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ObservabilityService } from '../observability/observability.service';

@Injectable()
export class ExpireBookingsJob {
  private readonly logger = new Logger(ExpireBookingsJob.name);
  private readonly UPCOMING_WINDOW_MINUTES = 10;
  private readonly UPCOMING_WINDOW_START_MINUTES = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly observabilityService: ObservabilityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const start = Date.now();
    let expiredCount = 0;
    let notificationCount = 0;
    try {
      expiredCount = await this.expireDueBookings();
      notificationCount = await this.notifyUpcomingExpirations();
    } finally {
      const duration = Date.now() - start;
      this.observabilityService.recordJobExecution(
        'expire-bookings',
        duration,
        expiredCount + notificationCount,
      );
    }
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

    let count = 0;
    for (const booking of dueBookings) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EXPIRED },
      });
      this.logger.log(
        `[ExpireBookingsJob] Expired booking ${booking.id} provider=${booking.providerId} startAt=${booking.scheduledStart?.toISOString() ?? 'null'} expiresAt=${booking.expiresAt?.toISOString() ?? 'null'} reason=payment_timeout`,
      );
      count++;
    }
    return count;
  }

  private async notifyUpcomingExpirations(now: Date = new Date()) {
    const startWindow = new Date(
      now.getTime() + this.UPCOMING_WINDOW_START_MINUTES * 60_000,
    );
    const endWindow = new Date(
      now.getTime() + this.UPCOMING_WINDOW_MINUTES * 60_000,
    );

    const upcoming = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING_PAYMENT,
        expiresAt: {
          gte: startWindow,
          lte: endWindow,
        },
      },
      select: {
        id: true,
        expiresAt: true,
        client: {
          select: {
            userId: true,
          },
        },
      },
    });

    let notified = 0;
    for (const booking of upcoming) {
      const userId = booking.client?.userId;
      if (!userId || !booking.expiresAt) {
        continue;
      }
      const minutesLeft = Math.max(
        1,
        Math.ceil((booking.expiresAt.getTime() - now.getTime()) / 60_000),
      );
      try {
        await this.notificationsService.createNotification({
          userId,
          type: 'BOOKING_EXPIRATION_REMINDER',
          message: `O pagamento do seu agendamento expira em ${minutesLeft} ${minutesLeft === 1 ? 'minuto' : 'minutos'}. Finalize agora para garantir a vaga.`,
          title: 'Pagamento expirando em breve',
          targetUrl: `/client/bookings/${booking.id}`,
          relatedId: booking.id,
          dedupeKey: `booking_expiration:${booking.id}:${Math.floor(
            booking.expiresAt.getTime() / 60_000,
          )}`,
          payload: {
            bookingId: booking.id,
            minutesLeft,
          },
          scheduledAt: booking.expiresAt.toISOString(),
          category: 'booking',
        });
        notified++;
        this.logger.log(
          `[ExpireBookingsJob] Sent expiration reminder for booking ${booking.id} (expires in ${minutesLeft}m)`,
        );
      } catch (error) {
        this.logger.error(
          `[ExpireBookingsJob] Failed to notify upcoming expiration for booking ${booking.id}: ${
            (error as Error).message ?? 'unknown'
          }`,
        );
      }
    }

    return notified;
  }
}
