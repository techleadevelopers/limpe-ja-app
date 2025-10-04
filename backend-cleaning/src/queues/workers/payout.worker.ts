import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PayoutsService } from '../../payouts/payouts.service';

interface PayoutJobData {
  payoutId: string;
}

@Processor('payouts')
export class PayoutWorker {
  private readonly logger = new Logger(PayoutWorker.name);

  constructor(private readonly payoutsService: PayoutsService) {}

  @Process('process-payout')
  async handleProcess(job: Job<PayoutJobData>) {
    this.logger.debug(`handleProcess: processing payout ${job.data.payoutId}`);
    await this.payoutsService.processPayout(job.data.payoutId);
  }
}
