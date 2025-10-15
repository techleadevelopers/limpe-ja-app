// src/queues/queues.service.ts
import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, JobOptions } from 'bull';

// Interface para estender as opções de tarefa do Bull.js
interface CustomJobOptions extends JobOptions {
  attempts?: number;
  backoff?: { type: 'exponential' | 'fixed'; delay: number };
  jobId?: string;
  delay?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);
  private readonly queueNames = [
    'verification',
    'notifications',
    'disputes',
    'data_export',
    'subscription-generation',
    'emails',
    'support-escalations',
    'payouts',
  ] as const;

  constructor(
    @InjectQueue('verification') private readonly verificationQueue: Queue,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    @InjectQueue('disputes') private readonly disputesQueue: Queue,
    @InjectQueue('data_export') private readonly dataExportQueue: Queue,
    @InjectQueue('subscription-generation') private readonly subscriptionGenerationQueue: Queue,
    @InjectQueue('emails') private readonly emailsQueue: Queue, // NEW: Fila para e-mails
    @InjectQueue('support-escalations') private readonly supportEscalationsQueue: Queue, // Fila de escalonamento de suporte
    @InjectQueue('payouts') private readonly payoutsQueue: Queue,
  ) {}

  /**
   * Retorna a instância da fila Bull.js com base no nome.
   * @param queueName O nome da fila.
   * @returns A instância da fila.
   * @throws BadRequestException se o nome da fila for desconhecido.
   */
  private getQueueInstance(queueName: string): Queue {
    switch (queueName) {
      case 'verification':
        return this.verificationQueue;
      case 'notifications':
        return this.notificationsQueue;
      case 'disputes':
        return this.disputesQueue;
      case 'data_export':
        return this.dataExportQueue;
      case 'subscription-generation':
        return this.subscriptionGenerationQueue;
      case 'emails': // NEW: Case para a fila de e-mails
        return this.emailsQueue;
      case 'support-escalations':
        return this.supportEscalationsQueue;
      default:
        this.logger.error(`Fila desconhecida: ${queueName}`);
        throw new BadRequestException(`Fila desconhecida: ${queueName}`);
    }
  }

  /**
   * Adiciona uma tarefa a uma fila específica.
   * @param queueName O nome da fila (ex: 'verification', 'notifications', 'disputes', 'data_export', 'subscription-generation', 'emails').
   * @param jobName O nome da tarefa a ser adicionada.
   * @param data Os dados da tarefa.
   * @param options Opções para a tarefa (ex: attempts, backoff, jobId, delay, removeOnComplete, removeOnFail).
   */
  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: CustomJobOptions,
  ): Promise<void> {
    const queue = this.getQueueInstance(queueName);

    try {
      const finalOptions: CustomJobOptions = {
        attempts: options?.attempts ?? 3,
        backoff: options?.backoff ?? { type: 'exponential', delay: 1000 },
        removeOnComplete: options?.removeOnComplete ?? true,
        removeOnFail: options?.removeOnFail ?? false,
        ...options,
      };

      await queue.add(jobName, data, finalOptions);
      this.logger.log(`Tarefa '${jobName}' adicionada à fila '${queueName}' com dados: ${JSON.stringify(data)}.`);
    } catch (error) {
      this.logger.error(`Erro ao adicionar tarefa '${jobName}' à fila '${queueName}': ${error.message}`);
      throw new InternalServerErrorException(`Falha ao adicionar tarefa à fila: ${error.message}`);
    }
  }

  /**
   * Remove um job específico de uma fila.
   * @param queueName O nome da fila.
   * @param jobId O ID do job a ser removido.
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueueInstance(queueName);

    try {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Job '${jobId}' removido da fila '${queueName}'.`);
      } else {
        this.logger.warn(`Job '${jobId}' não encontrado na fila '${queueName}'.`);
      }
    } catch (error) {
      this.logger.error(`Erro ao remover job '${jobId}' da fila '${queueName}': ${error.message}`);
      throw new InternalServerErrorException(`Falha ao remover job da fila: ${error.message}`);
    }
  }

  /**
   * Adiciona uma tarefa à fila de verificação.
   * @param name Nome da tarefa (ex: 'process-document-ocr', 'perform-liveness-check').
   * @param data Dados da tarefa.
   */
  async addVerificationJob(name: string, data: any): Promise<void> {
    return this.addJob('verification', name, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnFail: false,
    });
  }

  /**
   * Adiciona uma tarefa à fila de notificações (in-app e/ou push).
   * @param name Nome da tarefa (ex: 'send-notification', 'send-push-notification').
   * @param data Dados da tarefa.
   */
  async addNotificationJob(name: string, data: any): Promise<void> {
    return this.addJob('notifications', name, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnFail: false,
    });
  }

  /**
   * Helpers premium: agenda lembretes de booking (T-24h, T-2h, T-15m) e início (T0)
   * deeplink deve abrir a tela adequada no app; prioridade alta para T0.
   */
  async scheduleBookingReminders(params: {
    bookingId: string;
    clientUserId: string;
    providerUserId: string;
    scheduledAt: Date; // data+hora local já resolvida
    deeplinkClient?: string;
    deeplinkProvider?: string;
    locale?: string;
  }): Promise<void> {
    const { bookingId, clientUserId, providerUserId, scheduledAt, deeplinkClient, deeplinkProvider } = params;
    const baseId = `booking:${bookingId}`;
    const now = Date.now();
    const t0 = scheduledAt.getTime();
    const hh = String(scheduledAt.getHours()).padStart(2, '0');
    const mm = String(scheduledAt.getMinutes()).padStart(2, '0');
    const hora = `${hh}:${mm}`;
    const emits = [
      { key: 'T-24h',  ms: t0 - 24 * 3600000, title: 'Serviço amanhã',        body: `Limpeza amanhã às ${hora}.` },
      { key: 'T-2h',   ms: t0 -  2 * 3600000, title: 'Faltam 2 horas',        body: `Prepare-se para ${hora}.` },
      { key: 'T-15m',  ms: t0 - 15 *   60000, title: 'Faltam 15 minutos',     body: `Início às ${hora}.` },
      { key: 'T0',     ms: t0,               title: 'É agora',                body: `Inicie o serviço às ${hora}.` },
    ];

    for (const e of emits) {
      const delay = Math.max(0, e.ms - now);
      const opts = { attempts: 3, backoff: { type: 'exponential' as const, delay: 1000 }, removeOnFail: false, delay };
      // Cliente
      await this.addJob('notifications', 'send-notification', {
        userId: clientUserId,
        kind: 'booking_reminder',
        title: e.title,
        body: e.body,
        deeplink: deeplinkClient,
        priority: e.key === 'T0' ? 1 : 2,
        idempotencyKey: `${baseId}:${e.key}:client`,
      }, opts);
      // Push com som alto e deeplink (cliente)
      await this.addJob('notifications', 'send-push-notification', {
        userId: clientUserId,
        title: e.title,
        body: e.body,
        data: { url: deeplinkClient, priority: e.key === 'T0' ? 'max' : 'high', channelId: 'high-priority' },
      }, opts);
      // Provedor
      await this.addJob('notifications', 'send-notification', {
        userId: providerUserId,
        kind: 'booking_reminder',
        title: e.title,
        body: e.body,
        deeplink: deeplinkProvider,
        priority: e.key === 'T0' ? 1 : 2,
        idempotencyKey: `${baseId}:${e.key}:provider`,
      }, opts);
      // Push com som alto e deeplink (provedor)
      await this.addJob('notifications', 'send-push-notification', {
        userId: providerUserId,
        title: e.title,
        body: e.body,
        data: { url: deeplinkProvider, priority: e.key === 'T0' ? 'max' : 'high', channelId: 'high-priority' },
      }, opts);
    }
  }

  /**
   * Adiciona uma tarefa à fila de disputas.
   * @param name Nome da tarefa (ex: 'process-dispute', 'initiate-refund').
   * @param data Dados da tarefa.
   */
  async addDisputeJob(name: string, data: any): Promise<void> {
    return this.addJob('disputes', name, data, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnFail: false,
    });
  }

  /**
   * Adiciona uma tarefa à fila de exportação de dados.
   * @param name Nome da tarefa (ex: 'export-user-data').
   * @param data Dados da tarefa.
   */
  async addDataExportJob(name: string, data: any): Promise<void> {
    return this.addJob('data_export', name, data, {
      attempts: 1,
      removeOnFail: true,
    });
  }

  /**
   * Adiciona uma tarefa à fila de geração de assinaturas.
   * @param subscriptionId O ID da assinatura.
   * @param delayMs O atraso em milissegundos para a tarefa.
   */
  async addSubscriptionGenerationJob(subscriptionId: string, delayMs: number): Promise<void> {
    const jobName = 'generate-recurring-booking';
    const data = { subscriptionId };
    const options: CustomJobOptions = {
      jobId: `subscription-generation-${subscriptionId}`,
      delay: delayMs,
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 1,
    };
    return this.addJob('subscription-generation', jobName, data, options);
  }

  /**
   * Remove uma tarefa da fila de geração de assinaturas.
   * @param subscriptionId O ID da assinatura cujo job deve ser removido.
   */
  async removeSubscriptionGenerationJob(subscriptionId: string): Promise<void> {
    const jobId = `subscription-generation-${subscriptionId}`;
    return this.removeJob('subscription-generation', jobId);
  }

  /**
   * NEW: Adiciona uma tarefa à fila de e-mails.
   * @param name Nome da tarefa (ex: 'send-email').
   * @param data Dados da tarefa (to, subject, text, html).
   */
  async addEmailJob(name: string, data: { to: string; subject: string; text: string; html: string }): Promise<void> {
    return this.addJob('emails', name, data, {
      attempts: 5, // Tenta novamente 5 vezes em caso de falha de e-mail
      backoff: {
        type: 'exponential',
        delay: 2000, // Atraso inicial de 2 segundos, exponencial
      },
      removeOnFail: false, // Manter falhas para análise
    });
  }

  /**
   * Retorna o status resumido de todas as filas monitoradas pelo admin.
   */
  async getAllQueuesStatus(): Promise<any[]> {
    return Promise.all(
      this.queueNames.map(async (queueName) => this.getQueueStatus(queueName))
    );
  }

  /**
   * Retorna o status detalhado de uma fila específica.
   */
  async getQueueStatus(queueName: string): Promise<any> {
    const queue = this.getQueueInstance(queueName);
    const counts = await queue.getJobCounts();
    const isPaused = await queue.isPaused();

    return {
      name: queueName,
      counts,
      isPaused,
    };
  }

  /**
   * Lista jobs de uma fila com base no status informado.
   * @param queueName Nome da fila.
   * @param status Status desejado (waiting, active, completed, failed, delayed ou all).
   * @param limit Quantidade máxima de jobs a retornar.
   */
  async getJobsByStatus(queueName: string, status: string = 'waiting', limit = 50): Promise<any[]> {
    const queue = this.getQueueInstance(queueName);
    const validStatuses = ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'];

    const normalizedStatus = status.toLowerCase();
    const statusesToFetch = normalizedStatus === 'all'
      ? validStatuses
      : validStatuses.includes(normalizedStatus)
        ? [normalizedStatus]
        : ['waiting'];

    try {
      const jobs = await queue.getJobs(statusesToFetch as any, 0, limit - 1, false);

      return Promise.all(
        jobs.map(async (job) => {
          const jobState = await job.getState();
          return {
            id: job.id,
            name: job.name,
            data: job.data,
            attemptsMade: job.attemptsMade,
            progress: job.progress,
            timestamp: job.timestamp,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            failedReason: job.failedReason,
            state: jobState,
          };
        })
      );
    } catch (error) {
      this.logger.error(`Erro ao listar jobs na fila ${queueName}: ${error.message}`);
      throw new InternalServerErrorException(`Falha ao listar jobs: ${error.message}`);
    }
  }

  /**
   * Reexecuta um job específico de determinada fila.
   */
  async retryJobById(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueueInstance(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new BadRequestException(`Job ${jobId} não encontrado na fila ${queueName}`);
    }

    const jobState = await job.getState();
    if (jobState === 'failed') {
      await job.retry();
      this.logger.log(`Job ${jobId} da fila ${queueName} reenfileirado para nova tentativa.`);
    } else if (jobState === 'completed' || jobState === 'delayed') {
      // FIX: Checagem de estado + type assertion para compatibilidade Bull/BullMQ
      // O método existe runtime, mas TS precisa do 'as any' em alguns tipos
      (job as any).moveToWaiting();
      this.logger.log(`Job ${jobId} da fila ${queueName} movido para waiting.`);
    } else {
      throw new BadRequestException(`Job ${jobId} está em estado '${jobState}' – não pode ser reenfileirado.`);
    }
  }
}
