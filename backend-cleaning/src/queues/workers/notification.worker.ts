// backend-cleaning/src/queues/workers/notification.worker.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService } from '../../email/email.service'; // NEW
import { RedisLockService } from '../../common/locks/redis-lock.service';

type NotificationJobData = {
  userId: string;
  type?: string;
  kind?: string;
  bookingId?: string;
  message?: string;
  body?: string;
  targetUrl?: string;
  deeplink?: string;
  title?: string;
  imageUrl?: string;
  actionButtons?: object;
  priority?: string;
  idempotencyKey?: string;
};

@Processor('notifications')
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService, // NEW
    private readonly redisLock: RedisLockService,
  ) {}

  private async shouldSendPush(idempotencyKey?: string): Promise<boolean> {
    if (!idempotencyKey) return true;
    const ttlMs = 24 * 60 * 60 * 1000; // 24h
    const lockKey = `push:idem:${idempotencyKey}`;
    const acquired = await this.redisLock.acquireLock(
      lockKey,
      `job:${Date.now()}`,
      ttlMs,
    );
    return acquired;
  }

  private isBookingCritical(kind?: string, type?: string): boolean {
    const normalizedKind = kind?.toLowerCase() ?? '';
    const normalizedType = type?.toLowerCase() ?? '';
    return (
      normalizedKind.includes('booking') || normalizedType.includes('booking')
    );
  }

  @Process('send-notification')
  async sendNotification(job: Job<NotificationJobData>): Promise<void> {
    this.logger.log(
      `Processando tarefa 'send-notification' para userId ${job.data.userId}.`,
    );
    const {
      userId,
      type,
      kind,
      bookingId,
      message,
      body,
      targetUrl,
      deeplink,
      title,
      imageUrl,
      actionButtons,
      priority,
      idempotencyKey,
    } = job.data;
    const notificationType =
      type ?? kind?.toUpperCase() ?? 'GENERAL_NOTIFICATION';
    const finalMessage = message || body || title || 'Notificação';
    const finalTarget = deeplink || targetUrl;
    const resolvedPriority: 'default' | 'high' =
      priority === 'default' ? 'default' : 'high';

    try {
      // Usar o DTO para criar a notificação in-app
      await this.notificationsService.createNotification({
        userId,
        type: notificationType,
        message: finalMessage,
        targetUrl: finalTarget,
        title,
        imageUrl,
        actionButtons,
      });
      this.logger.log(
        `Notificação in-app enviada com sucesso para userId ${userId}.`,
      );

      // Deduplicação forte por idempotencyKey (TTL 24h)
      const canSendPush = await this.shouldSendPush(idempotencyKey);
      if (!canSendPush) {
        this.logger.warn(
          `Push deduplicado (idempotencyKey=${idempotencyKey}) para userId ${userId}, não será reenviado.`,
        );
        return;
      }

      // Dispara push físico usando o mesmo payload (APNs/FCM)
      const shouldFallback = this.isBookingCritical(kind, notificationType);
      const whatsappFallback = shouldFallback
        ? {
            bookingId,
            kind,
            type: notificationType,
            title: title || finalMessage,
            message: finalMessage,
          }
        : undefined;
      await this.notificationsService.sendPushNotification(
        userId,
        title || finalMessage,
        finalMessage,
        {
          deeplink: finalTarget,
          priority: resolvedPriority,
          idempotencyKey,
        },
        {
          priority: resolvedPriority,
          whatsappFallback,
        },
      );
    } catch (error) {
      this.logger.error(
        `Falha ao enviar notificação in-app para userId ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  // NEW: Processador para envio de push notifications
  @Process('send-push-notification')
  async sendPushNotification(
    job: Job<{
      userId: string;
      title: string;
      body: string;
      data?: Record<string, any>;
    }>,
  ): Promise<void> {
    this.logger.log(
      `Processando tarefa 'send-push-notification' para userId ${job.data.userId}.`,
    );
    const { userId, title, body, data } = job.data;

    const idempotencyKey =
      data?.['idempotencyKey'] ||
      data?.['idempotency_key'] ||
      data?.['idemKey'] ||
      undefined;

    try {
      const canSendPush = await this.shouldSendPush(idempotencyKey);
      if (!canSendPush) {
        this.logger.warn(
          `Push deduplicado (idempotencyKey=${idempotencyKey}) para userId ${userId}, não será reenviado.`,
        );
        return;
      }

      await this.notificationsService.sendPushNotification(
        userId,
        title,
        body,
        data,
      );
      this.logger.log(
        `Push notification enviada com sucesso para userId ${userId}.`,
      );
    } catch (error) {
      this.logger.error(
        `Falha ao enviar push notification para userId ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  // NEW: Processador para envio de e-mails (se a fila de e-mails for 'notifications')
  // Se você tiver uma fila 'emails' separada, este processador deve ir para um worker de e-mail.
  @Process('send-email')
  async sendEmail(
    job: Job<{ to: string; subject: string; text: string; html: string }>,
  ): Promise<void> {
    this.logger.log(`Processando tarefa 'send-email' para ${job.data.to}.`);
    const { to, subject, text, html } = job.data;
    try {
      await this.emailService.sendEmail(to, subject, text, html);
      this.logger.log(`E-mail enviado com sucesso para ${to}.`);
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${to}: ${error.message}`);
      throw error;
    }
  }
}
