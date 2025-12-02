// backend-cleaning/src/queues/workers/notification.worker.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService } from '../../email/email.service'; // NEW

@Processor('notifications')
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService, // NEW
  ) {}

  @Process('send-notification')
  async sendNotification(
    job: Job<{
      userId: string;
      type: string;
      message: string;
      targetUrl?: string;
      title?: string;
      imageUrl?: string;
      actionButtons?: object;
    }>,
  ): Promise<void> {
    this.logger.log(
      `Processando tarefa 'send-notification' para userId ${job.data.userId}.`,
    );
    const { userId, type, message, targetUrl, title, imageUrl, actionButtons } =
      job.data;

    try {
      // Usar o DTO para criar a notificação in-app
      await this.notificationsService.createNotification({
        userId,
        type,
        message,
        targetUrl,
        title,
        imageUrl,
        actionButtons,
      });
      this.logger.log(
        `Notificação in-app enviada com sucesso para userId ${userId}.`,
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

    try {
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
