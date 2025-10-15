import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PayoutsService } from '../../payouts/payouts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerEntryType } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

interface PayoutJobData {
  payoutId: string;
}

@Processor('payouts')
export class PayoutWorker {
  private readonly logger = new Logger(PayoutWorker.name);

  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Process('process-payout')
  async handleProcess(job: Job<PayoutJobData>) {
    this.logger.debug(`handleProcess: processing payout ${job.data.payoutId}`);
    await this.payoutsService.processPayout(job.data.payoutId);
  }
}

interface ReleaseJobData { bookingId: string; userId: string }

@Processor('payouts')
export class ReleaseWorker {
  private readonly logger = new Logger(ReleaseWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Process('release-earning')
  async handleRelease(job: Job<ReleaseJobData>) {
    const { bookingId, userId } = job.data;
    this.logger.debug(`handleRelease: releasing HOLD for booking ${bookingId} user ${userId}`);
    const hold = await this.prisma.ledgerEntry.findFirst({ where: { bookingId, userId, type: LedgerEntryType.HOLD } });
    if (!hold) { this.logger.warn(`No HOLD found for booking ${bookingId}`); return; }
    await this.prisma.ledgerEntry.update({ where: { id: hold.id }, data: { type: LedgerEntryType.EARNING, note: `Released earning for booking ${bookingId}` } });
    try {
      await this.notifications.createNotification({ userId, type: 'PAYOUT_AVAILABLE', message: 'Seu saldo foi liberado para saque.', targetUrl: '/(provider)/earnings', title: 'Saldo liberado' });
      await this.notifications.sendPushNotification(userId, 'Saldo liberado', 'Seu saldo está disponível para saque.', { url: '/(provider)/earnings', channelId: 'high-priority', priority: 'max' });
    } catch (e:any) {
      this.logger.warn(`handleRelease: notifications failed ${e?.message}`);
    }
  }
}
