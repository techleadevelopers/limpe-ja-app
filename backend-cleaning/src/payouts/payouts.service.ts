import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { LedgerEntryType, PayoutStatus, Prisma } from '@prisma/client';
import { QueuesService } from '../queues/queues.service';
import { RedisLockService } from '../common/locks/redis-lock.service';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

interface GatewayUpdateInput {
  payoutId: string;
  status: string | PayoutStatus;
  gatewayTxnId?: string;
}

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);
  private readonly minWithdrawal: Prisma.Decimal;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueuesService,
    private readonly redisLock: RedisLockService,
    private readonly configService: ConfigService,
  ) {
    const min = this.configService.get<string>('MIN_WITHDRAWAL_AMOUNT', '10');
    this.minWithdrawal = new Prisma.Decimal(min);
  }

  async getBalance(userId: string): Promise<{ available: number }> {
    const total = await this.prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { userId },
    });
    const sum = total._sum.amount ?? new Prisma.Decimal(0);
    return { available: Number(sum.toFixed(2)) };
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto, idempotencyKey?: string) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required.');
    }

    const lockKey = `payout:lock:${userId}`;
    const lockValue = randomUUID();

    const acquired = await this.tryAcquireLock(lockKey, lockValue);
    if (!acquired) {
      throw new ConflictException('Another withdrawal is being processed. Please try again in a moment.');
    }

    try {
      const payout = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.payout.findUnique({ where: { idempotencyKey } });
        if (existing) {
          this.logger.debug(`requestWithdrawal: idempotent hit for key ${idempotencyKey}`);
          return existing;
        }

        const balance = await this.computeBalance(tx, userId);
        const amount = new Prisma.Decimal(dto.amount);

        if (amount.lt(this.minWithdrawal)) {
          throw new BadRequestException(`Minimum withdrawal amount is R$ ${this.minWithdrawal.toFixed(2)}.`);
        }
        if (amount.gt(balance)) {
          throw new BadRequestException(`Insufficient balance. Available: R$ ${balance.toFixed(2)}.`);
        }

        await tx.ledgerEntry.create({
          data: {
            userId,
            amount: amount.mul(-1),
            type: LedgerEntryType.WITHDRAWAL,
            note: dto.notes ?? `PIX withdrawal request for ${dto.pixKeyType}: ${dto.pixKey}`,
          },
        });

        const newPayout = await tx.payout.create({
          data: {
            userId,
            amount,
            idempotencyKey,
            status: PayoutStatus.PENDING,
          },
        });

        await this.queues.addJob('payouts', 'process-payout', { payoutId: newPayout.id }, {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnFail: false,
        });

        this.logger.log(`requestWithdrawal: payout ${newPayout.id} scheduled for processing.`);
        return newPayout;
      });

      const result = {
        message: 'Withdrawal request received and queued for processing.',
        payoutId: payout.id,
        status: payout.status,
      };
      // Notificação de solicitado
      try {
        await this.queues.addNotificationJob('send-notification', {
          userId,
          type: 'WITHDRAWAL_REQUESTED',
          message: `Solicitação de saque criada (R$ ${payout.amount.toFixed(2)}).`,
          targetUrl: '/app/(provider)/earnings',
        });
      } catch {}
      return result;
    } finally {
      await this.redisLock.releaseLock(lockKey, lockValue);
    }
  }

  async processPayout(payoutId: string): Promise<void> {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) {
      this.logger.warn(`processPayout: payout ${payoutId} not found.`);
      return;
    }

    if (payout.status !== PayoutStatus.PENDING) {
      this.logger.debug(`processPayout: payout ${payoutId} already processed with status ${payout.status}.`);
      return;
    }

    const gatewayTxnId = payout.gatewayTxnId ?? `gw_${Date.now()}_${payout.id}`;

    await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.PROCESSING,
        gatewayTxnId,
      },
    });

    this.logger.log(`processPayout: payout ${payoutId} marked as PROCESSING with gatewayTxnId ${gatewayTxnId}.`);

    // Simulate immediate success for now. In the future, this would call the PSP and rely on webhook.
    await this.applyGatewayUpdate({ payoutId, status: PayoutStatus.PAID, gatewayTxnId });
  }

  async handleGatewayWebhook(signature: string, eventId: string, payload: any) {
    if (!signature || !eventId) {
      throw new BadRequestException('Missing webhook headers.');
    }

    const secret = this.configService.get<string>('PSP_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('handleGatewayWebhook: PSP_WEBHOOK_SECRET is not configured.');
      throw new ForbiddenException('Webhook signature validation not configured.');
    }

    const payloadString = JSON.stringify(payload ?? {});
    if (!this.verifySignature(signature, payloadString, secret)) {
      this.logger.warn('handleGatewayWebhook: invalid signature.');
      throw new ForbiddenException('Invalid webhook signature.');
    }

    const exists = await this.prisma.webhookReplay.findUnique({ where: { eventId } });
    if (exists) {
      this.logger.debug(`handleGatewayWebhook: replay event ${eventId} ignored.`);
      return { ok: true, replay: true };
    }

    await this.prisma.webhookReplay.create({ data: { source: 'psp', eventId } });

    const { payoutId, status, gatewayTxnId } = payload ?? {};
    if (!payoutId || !status) {
      throw new BadRequestException('Webhook payload missing payoutId or status.');
    }

    await this.applyGatewayUpdate({ payoutId, status, gatewayTxnId });
    return { ok: true };
  }

  private async computeBalance(tx: Prisma.TransactionClient, userId: string): Promise<Prisma.Decimal> {
    const total = await tx.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { userId },
    });
    return total._sum.amount ?? new Prisma.Decimal(0);
  }

  private async applyGatewayUpdate(input: GatewayUpdateInput): Promise<void> {
    const targetStatus = this.normalizeStatus(input.status);

    await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { id: input.payoutId } });
      if (!payout) {
        throw new NotFoundException(`Payout ${input.payoutId} not found.`);
      }

      const updateData: Prisma.PayoutUpdateInput = {
        status: targetStatus,
        processedAt: new Date(),
      };
      if (input.gatewayTxnId && !payout.gatewayTxnId) {
        updateData.gatewayTxnId = input.gatewayTxnId;
      }

      await tx.payout.update({ where: { id: payout.id }, data: updateData });

      if (targetStatus === PayoutStatus.FAILED || targetStatus === PayoutStatus.CANCELED) {
        await tx.ledgerEntry.create({
          data: {
            userId: payout.userId,
            amount: payout.amount,
            type: LedgerEntryType.RELEASE,
            note: `Payout ${targetStatus.toLowerCase()} rollback`,
          },
        });
      }
    });
    // Notificações básicas (via fila)
    try {
      const type = targetStatus === PayoutStatus.PAID ? 'WITHDRAWAL_PAID' : (targetStatus === PayoutStatus.FAILED || targetStatus === PayoutStatus.CANCELED) ? 'WITHDRAWAL_FAILED' : 'WITHDRAWAL_STATUS';
      await this.queues.addNotificationJob('send-notification', {
        userId: (await this.prisma.user.findUnique({ where: { id: (await this.prisma.user.findFirst({ where: { id: payout.userId } }))?.id || payout.userId }))?.id || payout.userId,
        type,
        message: `Saque ${targetStatus}.`,
        targetUrl: '/app/(provider)/earnings',
      });
    } catch {}
  }

  private normalizeStatus(status: string | PayoutStatus): PayoutStatus {
    if (typeof status !== 'string') {
      return status;
    }
    const upper = status.toUpperCase();
    switch (upper) {
      case 'PROCESSING':
        return PayoutStatus.PROCESSING;
      case 'PAID':
      case 'COMPLETED':
        return PayoutStatus.PAID;
      case 'FAILED':
      case 'ERROR':
        return PayoutStatus.FAILED;
      case 'CANCELED':
      case 'CANCELLED':
        return PayoutStatus.CANCELED;
      case 'PENDING':
      default:
        return PayoutStatus.PENDING;
    }
  }

  private verifySignature(signature: string, payload: string, secret: string): boolean {
    const computed = createHmac('sha256', secret).update(payload).digest('hex');
    const incoming = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    try {
      return timingSafeEqual(Buffer.from(incoming, 'hex'), Buffer.from(computed, 'hex'));
    } catch {
      return false;
    }
  }

  private async tryAcquireLock(key: string, value: string, ttlMs = 5000): Promise<boolean> {
    const maxAttempts = 5;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const acquired = await this.redisLock.acquireLock(key, value, ttlMs);
      if (acquired) {
        return true;
      }
      await delay(100);
    }

    return false;
  }
}
