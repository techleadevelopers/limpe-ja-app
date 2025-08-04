// backend-cleaning/src/queues/queues.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    @InjectQueue('verification') private readonly verificationQueue: Queue,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    @InjectQueue('disputes') private readonly disputesQueue: Queue,
    @InjectQueue('data_export') private readonly dataExportQueue: Queue,
  ) {}

  /**
   * Adiciona uma tarefa à fila de verificação.
   * @param name Nome da tarefa (ex: 'process-document-ocr', 'perform-liveness-check').
   * @param data Dados da tarefa.
   */
  async addVerificationJob(name: string, data: any): Promise<void> {
    try {
      await this.verificationQueue.add(name, data, {
        attempts: 3, // Tenta novamente 3 vezes em caso de falha
        backoff: {
          type: 'exponential',
          delay: 1000, // Atraso inicial de 1 segundo, exponencial
        },
      });
      this.logger.log(`Tarefa '${name}' adicionada à fila 'verification' para provedor ${data.providerId}.`);
    } catch (error) {
      this.logger.error(`Erro ao adicionar tarefa '${name}' à fila 'verification': ${error.message}`);
    }
  }

  /**
   * Adiciona uma tarefa à fila de notificações.
   * @param name Nome da tarefa (ex: 'send-email', 'send-push-notification').
   * @param data Dados da tarefa.
   */
  async addNotificationJob(name: string, data: any): Promise<void> {
    try {
      await this.notificationsQueue.add(name, data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
      this.logger.log(`Tarefa '${name}' adicionada à fila 'notifications' para userId ${data.userId}.`);
    } catch (error) {
      this.logger.error(`Erro ao adicionar tarefa '${name}' à fila 'notifications': ${error.message}`);
    }
  }

  /**
   * Adiciona uma tarefa à fila de disputas.
   * @param name Nome da tarefa (ex: 'process-dispute', 'initiate-refund').
   * @param data Dados da tarefa.
   */
  async addDisputeJob(name: string, data: any): Promise<void> {
    try {
      await this.disputesQueue.add(name, data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
      this.logger.log(`Tarefa '${name}' adicionada à fila 'disputes' para booking ${data.bookingId}.`);
    } catch (error) {
      this.logger.error(`Erro ao adicionar tarefa '${name}' à fila 'disputes': ${error.message}`);
    }
  }

  /**
   * Adiciona uma tarefa à fila de exportação de dados.
   * @param name Nome da tarefa (ex: 'export-user-data').
   * @param data Dados da tarefa.
   */
  async addDataExportJob(name: string, data: any): Promise<void> {
    try {
      await this.dataExportQueue.add(name, data, {
        attempts: 1, // Não retentar exportações de dados que falharam
      });
      this.logger.log(`Tarefa '${name}' adicionada à fila 'data_export' para userId ${data.userId}.`);
    } catch (error) {
      this.logger.error(`Erro ao adicionar tarefa '${name}' à fila 'data_export': ${error.message}`);
    }
  }
}