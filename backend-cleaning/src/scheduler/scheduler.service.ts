import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import {
  NotificationSchedule,
  NotificationScheduleStatus,
  NotificationScheduleType,
  Prisma,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { I18nService } from '../common/i18n/i18n.service';

type ReminderSlotKey = '24H' | '2H' | '30M';

interface ScheduleNotificationInput {
  bookingId: string;
  runAt: Date;
  type: NotificationScheduleType;
  dedupeKey: string;
  slot?: ReminderSlotKey | null;
  payload: CreateNotificationDto;
}

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readyPromise: Promise<void> | null = null;

  private readonly reminderSlots: Array<{
    slot: ReminderSlotKey;
    offsetMs: number;
    translationKey: string;
  }> = [
    { slot: '24H', offsetMs: 24 * 60 * 60 * 1000, translationKey: 't24h' },
    { slot: '2H', offsetMs: 2 * 60 * 60 * 1000, translationKey: 't2h' },
    { slot: '30M', offsetMs: 30 * 60 * 1000, translationKey: 't30m' },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly i18n: I18nService,
  ) {}

  onModuleInit() {
    this.readyPromise = this.rehydratePendingSchedules();
  }

  async scheduleBookingReminders(params: {
    bookingId: string;
    clientUserId: string;
    scheduledAt: Date;
    targetUrl?: string;
    locale?: string;
  }): Promise<void> {
    if (!params.clientUserId) {
      this.logger.warn(
        `[SchedulerService] clientUserId ausente; lembretes não serão agendados para booking ${params.bookingId}.`,
      );
      return;
    }
    await this.ensureReady();
    const now = Date.now();
    const locale = params.locale ?? 'pt-BR';
    const scheduledAt = params.scheduledAt;
    const hourLabel = `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(
      scheduledAt.getMinutes(),
    ).padStart(2, '0')}`;
    const targetUrl =
      params.targetUrl ?? `/client/bookings/${params.bookingId}`;
    const promises: Promise<void>[] = [];

    for (const slot of this.reminderSlots) {
      const runAt = new Date(scheduledAt.getTime() - slot.offsetMs);
      if (runAt.getTime() <= now) continue;
      const title = await this.translate(
        `notification.reminder.${slot.translationKey}.title`,
        locale,
        { time: hourLabel },
      );
      const message = await this.translate(
        `notification.reminder.${slot.translationKey}.body`,
        locale,
        { time: hourLabel },
      );
      const dedupeKey = `${params.bookingId}:BOOKING_REMINDER:${slot.slot}`;
      promises.push(
        this.scheduleNotification({
          bookingId: params.bookingId,
          runAt,
          type: NotificationScheduleType.BOOKING_REMINDER,
          dedupeKey,
          slot: slot.slot,
          payload: {
            userId: params.clientUserId,
            type: 'BOOKING_REMINDER',
            title,
            message,
            targetUrl,
            category: 'booking',
            payload: {
              bookingId: params.bookingId,
              slot: slot.slot,
              scheduledAt: scheduledAt.toISOString(),
            },
            idempotencyKey: dedupeKey,
          },
        }),
      );
    }

    const lateRunAt = new Date(scheduledAt.getTime() + 15 * 60 * 1000);
    if (lateRunAt.getTime() > now) {
      const title = await this.translate('notification.late.title', locale, {
        time: hourLabel,
      });
      const message = await this.translate('notification.late.body', locale, {
        time: hourLabel,
      });
      const dedupeKey = `${params.bookingId}:PROVIDER_LATE`;
      promises.push(
        this.scheduleNotification({
          bookingId: params.bookingId,
          runAt: lateRunAt,
          type: NotificationScheduleType.PROVIDER_LATE,
          dedupeKey,
          slot: null,
          payload: {
            userId: params.clientUserId,
            type: 'PROVIDER_LATE',
            title,
            message,
            targetUrl,
            category: 'booking',
            payload: {
              bookingId: params.bookingId,
              scheduledAt: scheduledAt.toISOString(),
            },
            idempotencyKey: dedupeKey,
          },
        }),
      );
    }

    if (promises.length === 0) {
      this.logger.debug(
        `[SchedulerService] Nenhum lembrete pendente para booking ${params.bookingId}.`,
      );
      return;
    }

    await Promise.all(promises);
  }

  async cancelPendingSchedules(
    bookingId: string,
    options?: {
      types?: NotificationScheduleType[];
      runAfter?: Date;
    },
  ): Promise<void> {
    await this.ensureReady();
    const where: Prisma.NotificationScheduleWhereInput = {
      bookingId,
      status: NotificationScheduleStatus.PENDING,
    };
    if (options?.types && options.types.length > 0) {
      where.type = { in: options.types };
    }
    if (options?.runAfter) {
      where.runAt = { gt: options.runAfter };
    }
    const toCancel = await this.prisma.notificationSchedule.findMany({
      where,
      select: { id: true },
    });
    toCancel.forEach((record) => this.clearTimer(record.id));
    if (toCancel.length === 0) return;
    const cancelledAt = new Date();
    await this.prisma.notificationSchedule.updateMany({
      where,
      data: {
        status: NotificationScheduleStatus.CANCELLED,
        cancelledAt,
      },
    });
  }

  async notifyJobStarted(params: {
    bookingId: string;
    clientUserId: string;
    targetUrl?: string;
    locale?: string;
  }): Promise<void> {
    if (!params.clientUserId) return;
    await this.ensureReady();
    await this.cancelPendingSchedules(params.bookingId, {
      types: [
        NotificationScheduleType.BOOKING_REMINDER,
        NotificationScheduleType.PROVIDER_LATE,
      ],
      runAfter: new Date(),
    });
    await this.scheduleNotification(
      {
        bookingId: params.bookingId,
        runAt: new Date(),
        type: NotificationScheduleType.JOB_STARTED,
        dedupeKey: `${params.bookingId}:JOB_STARTED`,
        payload: {
          userId: params.clientUserId,
          type: 'JOB_STARTED',
          title: await this.translate(
            'notification.job.started.title',
            params.locale ?? 'pt-BR',
          ),
          message: await this.translate(
            'notification.job.started.body',
            params.locale ?? 'pt-BR',
          ),
          targetUrl: params.targetUrl ?? `/client/bookings/${params.bookingId}`,
          category: 'booking',
          payload: {
            bookingId: params.bookingId,
          },
          idempotencyKey: `${params.bookingId}:JOB_STARTED`,
        },
      },
      true,
    );
  }

  async notifyJobEnded(params: {
    bookingId: string;
    clientUserId: string;
    targetUrl?: string;
    locale?: string;
  }): Promise<void> {
    if (!params.clientUserId) return;
    await this.ensureReady();
    await this.scheduleNotification(
      {
        bookingId: params.bookingId,
        runAt: new Date(),
        type: NotificationScheduleType.JOB_ENDED,
        dedupeKey: `${params.bookingId}:JOB_ENDED`,
        payload: {
          userId: params.clientUserId,
          type: 'JOB_ENDED',
          title: await this.translate(
            'notification.job.ended.title',
            params.locale ?? 'pt-BR',
          ),
          message: await this.translate(
            'notification.job.ended.body',
            params.locale ?? 'pt-BR',
          ),
          targetUrl: params.targetUrl ?? `/client/bookings/${params.bookingId}`,
          category: 'booking',
          payload: {
            bookingId: params.bookingId,
          },
          idempotencyKey: `${params.bookingId}:JOB_ENDED`,
        },
      },
      true,
    );
  }

  private async ensureReady() {
    if (this.readyPromise) {
      await this.readyPromise;
    }
  }

  private async rehydratePendingSchedules(): Promise<void> {
    try {
      const pending = await this.prisma.notificationSchedule.findMany({
        where: { status: NotificationScheduleStatus.PENDING },
        orderBy: { runAt: 'asc' },
      });
      for (const record of pending) {
        const runAt = this.toDateOrNull(record.runAt);
        if (!runAt) {
          this.logger.debug(
            `[SchedulerService] Schedule ${record.id} sem runAt válido; ignorando reidratação.`,
          );
          continue;
        }
        this.scheduleTimer({ ...record, runAt } as NotificationSchedule);
      }
    } catch (error) {
      this.logger.error(
        `[SchedulerService] Falha ao reidratar schedules pendentes: ${error}`,
      );
    }
  }

  private scheduleTimer(record: NotificationSchedule) {
    this.clearTimer(record.id);
    const delay = Math.max(0, record.runAt.getTime() - Date.now());
    const timer = setTimeout(() => {
      void this.processSchedule(record.id);
    }, delay);
    this.timers.set(record.id, timer);
  }

  private clearTimer(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  private async processSchedule(id: string) {
    this.timers.delete(id);
    const record = await this.prisma.notificationSchedule.findUnique({
      where: { id },
    });
    if (!record || record.status !== NotificationScheduleStatus.PENDING) {
      return;
    }
    await this.deliver(record);
  }

  private async deliver(record: NotificationSchedule) {
    if (!record.payload) {
      const cancelledAt = new Date();
      await this.prisma.notificationSchedule.update({
        where: { id: record.id },
        data: {
          status: NotificationScheduleStatus.CANCELLED,
          cancelledAt,
        },
      });
      this.logger.warn(
        `[SchedulerService] Payload ausente no schedule ${record.id}; marcando como CANCELLED.`,
      );
      return;
    }
    const payload = record.payload as Partial<CreateNotificationDto>;
    if (!payload.userId || !payload.type) {
      const cancelledAt = new Date();
      await this.prisma.notificationSchedule.update({
        where: { id: record.id },
        data: {
          status: NotificationScheduleStatus.CANCELLED,
          cancelledAt,
        },
      });
      this.logger.warn(
        `[SchedulerService] Payload incompleto no schedule ${record.id}; marcando como CANCELLED.`,
      );
      return;
    }
    try {
      await this.notificationsService.createNotification({
        ...payload,
        dedupeKey: record.dedupeKey,
      } as CreateNotificationDto);
      await this.prisma.notificationSchedule.update({
        where: { id: record.id },
        data: {
          status: NotificationScheduleStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      const cancelledAt = new Date();
      this.logger.error(
        `[SchedulerService] Falha ao postar notification schedule ${record.id}: ${error}`,
      );
      await this.prisma.notificationSchedule.update({
        where: { id: record.id },
        data: {
          status: NotificationScheduleStatus.CANCELLED,
          cancelledAt,
        },
      });
    }
  }

  private async scheduleNotification(
    input: ScheduleNotificationInput,
    fireImmediately = false,
  ) {
    await this.ensureReady();
    const record = await this.prisma.notificationSchedule.create({
      data: {
        bookingId: input.bookingId,
        runAt: input.runAt,
        type: input.type,
        slot: input.slot,
        status: NotificationScheduleStatus.PENDING,
        dedupeKey: input.dedupeKey,
        payload: input.payload as unknown as Prisma.InputJsonValue,
      },
    });
    if (fireImmediately) {
      await this.processSchedule(record.id);
    } else {
      this.scheduleTimer(record);
    }
  }

  private async translate(
    key: string,
    locale: string,
    values?: Record<string, unknown>,
  ): Promise<string> {
    try {
      return await this.i18n.translate(key, locale, values);
    } catch (error) {
      this.logger.warn(
        `[SchedulerService] Não foi possível traduzir ${key}: ${error}`,
      );
      return key;
    }
  }

  private toDateOrNull(value: unknown): Date | null {
    if (!value) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value as string);
    return Number.isFinite(date.getTime()) ? date : null;
  }
}
