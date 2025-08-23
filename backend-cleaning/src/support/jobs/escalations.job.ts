// src/support/jobs/escalations.job.ts

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SupportService } from '../support.service';
import { SupportTicketCategory } from '@prisma/client';

export interface CheckSlaJobData {
  ticketId: string;
  category: SupportTicketCategory;
}

@Processor('support-escalations') // Nome da fila
export class EscalationsJobProcessor extends WorkerHost {
  constructor(private readonly supportService: SupportService) {
    super();
  }

  async process(job: Job<CheckSlaJobData, any, string>): Promise<any> {
    const { ticketId, category } = job.data;
    console.log(`Processing SLA check for ticket ${ticketId}, category ${category}`);
    await this.supportService.handleSlaEscalation(ticketId, category);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} completed for queue ${job.queue.name}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    console.error(`Job ${job.id} failed for queue ${job.queue.name} with error ${err.message}`);
  }
}