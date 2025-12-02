// src/queues/workers/dispute.worker.ts
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DisputeService } from '../../disputes/dispute.service';
import { DisputeReason } from '@prisma/client'; // alinhar com CreateDisputeDto

type DisputeJobData = {
  bookingId: string;
  reporterUserId: string;
  reporterRole: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  reason: DisputeReason;
  description?: string;
  refundAmount?: number; // nome que chega no job
  attachments?: string[];
};

@Injectable()
export class DisputeWorker extends WorkerHost {
  private readonly logger = new Logger(DisputeWorker.name);

  constructor(private readonly disputeService: DisputeService) {
    super();
  }

  async process(job: Job<DisputeJobData, any, string>): Promise<any> {
    this.logger.log(
      `[DisputeWorker] Processando job '${job.name}' com ID: ${job.id}`,
    );

    try {
      if (job.name === 'process-booking-dispute') {
        const {
          bookingId,
          reporterUserId,
          reporterRole,
          reason,
          description,
          refundAmount,
          attachments,
        } = job.data;

        // Monta o payload no formato do CreateDisputeDto
        await this.disputeService.createDispute(
          {
            bookingId,
            reason,
            description: description ?? '',
            refundAmountProposed: refundAmount, // <<< campo correto do DTO
            attachments,
          },
          reporterUserId,
          reporterRole,
        );

        this.logger.log(
          `[DisputeWorker] Disputa para booking ${bookingId} criada com sucesso.`,
        );
      }

      this.logger.log(
        `[DisputeWorker] Job '${job.name}' finalizado com sucesso.`,
      );
    } catch (error: any) {
      this.logger.error(
        `[DisputeWorker] Erro crítico no job '${job.name}' para bookingId: ${job.data?.bookingId}. Erro: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any, any, string>) {
    this.logger.log(
      `[DisputeWorker] Job '${job.name}' com ID '${job.id}' foi completado.`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any, any, string>, error: Error) {
    this.logger.error(
      `[DisputeWorker] Job '${job.name}' com ID '${job.id}' falhou com erro: ${error.message}`,
    );
  }
}
