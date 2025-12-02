// src/support/jobs/escalations.job.ts

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SupportService } from '../support.service';
import { SupportTicketCategory } from '@prisma/client';

export interface CheckSlaJobData {
  ticketId: string;
  category: SupportTicketCategory;
}

const QUEUE_NAME = 'support-escalations'; // Definindo o nome da fila como uma constante

@Processor(QUEUE_NAME) // Usando a constante
export class EscalationsJobProcessor extends WorkerHost {
  constructor(private readonly supportService: SupportService) {
    super();
  }

  async process(job: Job<CheckSlaJobData, any, string>): Promise<any> {
    const { ticketId, category } = job.data;
    console.log(
      `Processing SLA check for ticket ${ticketId}, category ${category}`,
    );
    await this.supportService.handleSlaEscalation(ticketId, category);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    // Usando o nome da fila diretamente, pois é conhecido
    console.log(`Job ${job.id} completed for queue ${QUEUE_NAME}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    // Usando o nome da fila diretamente, pois é conhecido
    console.error(
      `Job ${job.id} failed for queue ${QUEUE_NAME} with error ${err.message}`,
    );
  }
}
