// backend-cleaning/src/queues/workers/notification.worker.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('notifications')
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send-notification')
  async sendNotification(job: Job<{ userId: string; type: string; message: string; targetUrl?: string }>): Promise<void> {
    this.logger.log(`Processando tarefa 'send-notification' para userId ${job.data.userId}.`);
    const { userId, type, message, targetUrl } = job.data;

    try {
      // Este método 'createNotification' já existe no NotificationsService
      // e agora será chamado de forma assíncrona pelo worker.
      await this.notificationsService.createNotification(userId, type, message, targetUrl);
      this.logger.log(`Notificação enviada com sucesso para userId ${userId}.`);
    } catch (error) {
      this.logger.error(`Falha ao enviar notificação para userId ${userId}: ${error.message}`);
      throw error;
    }
  }

  // Você pode adicionar outros tipos de processos de notificação aqui, como:
  // @Process('send-email')
  // async sendEmail(job: Job<{ recipient: string; subject: string; body: string }>): Promise<void> {
  //   this.logger.log(`Sending email to ${job.data.recipient}`);
  //   // Lógica para enviar e-mail
  // }
}