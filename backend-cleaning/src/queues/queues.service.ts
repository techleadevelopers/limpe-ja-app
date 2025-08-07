// backend-cleaning/src/queues/queues.service.ts
import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, JobOptions } from 'bull'; // Import JobOptions from 'bull'

// Interface para estender as opções de tarefa do Bull.js
interface CustomJobOptions extends JobOptions {
  attempts?: number;
  backoff?: { type: 'exponential' | 'fixed'; delay: number };
  jobId?: string; // Adicionado para permitir IDs de tarefa personalizados
  delay?: number; // Adicionado para agendamento de tarefas
  removeOnComplete?: boolean | number; // Adicionado para controle de remoção
  removeOnFail?: boolean | number; // Adicionado para controle de remoção
}

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    @InjectQueue('verification') private readonly verificationQueue: Queue,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    @InjectQueue('disputes') private readonly disputesQueue: Queue,
    @InjectQueue('data_export') private readonly dataExportQueue: Queue,
    @InjectQueue('subscription-generation') private readonly subscriptionGenerationQueue: Queue, // NOVO: Fila dedicada para geração de assinaturas
    // Se houver outras filas, adicione-as aqui
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
      case 'subscription-generation': // NOVO: Case para a fila de geração de assinaturas
        return this.subscriptionGenerationQueue;
      default:
        this.logger.error(`Fila desconhecida: ${queueName}`);
        throw new BadRequestException(`Fila desconhecida: ${queueName}`);
    }
  }

  /**
   * Adiciona uma tarefa a uma fila específica.
   * @param queueName O nome da fila (ex: 'verification', 'notifications', 'disputes', 'data_export', 'subscription-generation').
   * @param jobName O nome da tarefa a ser adicionada.
   * @param data Os dados da tarefa.
   * @param options Opções para a tarefa (ex: attempts, backoff, jobId, delay, removeOnComplete, removeOnFail).
   */
  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: CustomJobOptions, // Usa a interface CustomJobOptions
  ): Promise<void> {
    const queue = this.getQueueInstance(queueName);

    try {
      await queue.add(jobName, data, options); // Passa todas as opções diretamente
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
      attempts: 3, // Tenta novamente 3 vezes em caso de falha
      backoff: {
        type: 'exponential',
        delay: 1000, // Atraso inicial de 1 segundo, exponencial
      },
    });
  }

  /**
   * Adiciona uma tarefa à fila de notificações.
   * @param name Nome da tarefa (ex: 'send-email', 'send-push-notification').
   * @param data Dados da tarefa.
   */
  async addNotificationJob(name: string, data: any): Promise<void> {
    return this.addJob('notifications', name, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  /**
   * Adiciona uma tarefa à fila de disputas.
   * @param name Nome da tarefa (ex: 'process-dispute', 'initiate-refund').
   * @param data Dados da tarefa.
   */
  async addDisputeJob(name: string, data: any): Promise<void> {
    return this.addJob('disputes', name, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  /**
   * Adiciona uma tarefa à fila de exportação de dados.
   * @param name Nome da tarefa (ex: 'export-user-data').
   * @param data Dados da tarefa.
   */
  async addDataExportJob(name: string, data: any): Promise<void> {
    return this.addJob('data_export', name, data, {
      attempts: 1, // Não retentar exportações de dados que falharam
    });
  }

  /**
   * NOVO: Adiciona uma tarefa à fila de geração de assinaturas.
   * @param subscriptionId O ID da assinatura.
   * @param delayMs O atraso em milissegundos para a tarefa.
   */
  async addSubscriptionGenerationJob(subscriptionId: string, delayMs: number): Promise<void> {
    const jobName = 'generate-recurring-booking';
    const data = { subscriptionId };
    const options: CustomJobOptions = {
      jobId: `subscription-generation-${subscriptionId}`, // ID único para o job
      delay: delayMs,
      removeOnComplete: true, // Remove o job da fila após conclusão
      removeOnFail: true, // Remove o job da fila se falhar (para evitar duplicação)
      attempts: 1, // Geralmente, jobs recorrentes não devem tentar novamente se falharem para evitar duplicatas
    };
    return this.addJob('subscription-generation', jobName, data, options);
  }

  /**
   * NOVO: Remove uma tarefa da fila de geração de assinaturas.
   * @param subscriptionId O ID da assinatura cujo job deve ser removido.
   */
  async removeSubscriptionGenerationJob(subscriptionId: string): Promise<void> {
    const jobId = `subscription-generation-${subscriptionId}`;
    return this.removeJob('subscription-generation', jobId);
  }
}