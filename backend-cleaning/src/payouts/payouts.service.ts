import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import {
  LedgerEntryType,
  PayoutStatus,
  Prisma,
  VerificationStatus,
  PixKeyType,
} from '@prisma/client';
import { QueuesService } from '../queues/queues.service';
import { RedisLockService } from '../common/locks/redis-lock.service';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import axios from 'axios';
import { ConnectService } from '../connect/connect.service';
import * as fs from 'fs';
import * as https from 'https';

interface GatewayUpdateInput {
  payoutId: string;
  status: string | PayoutStatus;
  gatewayTxnId?: string;
}

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);
  private readonly minWithdrawal: Prisma.Decimal;
  private readonly maxWithdrawal?: Prisma.Decimal;
  private readonly dailyLimit?: Prisma.Decimal;
  private readonly dailyCountMax: number;
  private readonly settleWindowDays: number;
  private readonly settleWindowHours: number;
  private readonly withdrawalFixedFee: Prisma.Decimal;
  private readonly withdrawalPercentFee: number;
  private readonly pspBaseUrl: string;
  private readonly pspToken?: string;
  private pspHttpsAgent?: https.Agent;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueuesService,
    private readonly redisLock: RedisLockService,
    private readonly configService: ConfigService,
    private readonly connectService: ConnectService,
  ) {
    const min = this.configService.get<string>('MIN_WITHDRAWAL_AMOUNT', '10');
    this.minWithdrawal = new Prisma.Decimal(min);
    const max = this.configService.get<string>('WITHDRAWAL_MAX_RS');
    this.maxWithdrawal = max ? new Prisma.Decimal(max) : undefined;
    const daily = this.configService.get<string>('WITHDRAWAL_DAILY_LIMIT_RS');
    this.dailyLimit = daily ? new Prisma.Decimal(daily) : undefined;
    this.dailyCountMax =
      parseInt(
        this.configService.get<string>('WITHDRAWAL_DAILY_COUNT_MAX', '3'),
      ) || 3;
    this.settleWindowDays =
      parseInt(
        this.configService.get<string>('WITHDRAWAL_SETTLEMENT_DAYS', '0'),
      ) || 0;
    this.settleWindowHours =
      parseInt(
        this.configService.get<string>('WITHDRAWAL_SETTLEMENT_HOURS', '0'),
      ) || 0;
    const fixedFee = this.configService.get<string>(
      'WITHDRAWAL_FIXED_FEE_RS',
      '0',
    );
    this.withdrawalFixedFee = new Prisma.Decimal(fixedFee);
    this.withdrawalPercentFee =
      parseFloat(
        this.configService.get<string>('WITHDRAWAL_PERCENT_FEE', '0'),
      ) || 0;
    this.pspBaseUrl = this.configService.get<string>(
      'PAGSEGURO_API_BASE_URL',
      'https://sandbox.api.pagseguro.com',
    );
    this.pspToken =
      this.configService.get<string>('PAGSEGURO_API_TOKEN') || undefined;

    // Optional mTLS for production transfers
    try {
      const certPath = this.configService.get<string>(
        'PAGSEGURO_MTLS_CERT_PATH',
      );
      const keyPath = this.configService.get<string>('PAGSEGURO_MTLS_KEY_PATH');
      const caPath = this.configService.get<string>('PAGSEGURO_MTLS_CA_PATH');
      if (
        certPath &&
        keyPath &&
        fs.existsSync(certPath) &&
        fs.existsSync(keyPath)
      ) {
        const cert = fs.readFileSync(certPath);
        const key = fs.readFileSync(keyPath);
        const ca =
          caPath && fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined;
        this.pspHttpsAgent = new https.Agent({
          cert,
          key,
          ca,
          rejectUnauthorized: true,
        });
        this.logger.log(
          'PayoutsService: mTLS habilitado para cliente HTTP do PSP.',
        );
      }
    } catch (err) {
      this.logger.warn(
        `PayoutsService: falha ao iniciar mTLS agent: ${err?.message}`,
      );
    }
  }

  async getBalance(userId: string): Promise<{ available: number }> {
    const available = await this.computeAvailableBalance(userId);
    return { available: Number(available.toFixed(2)) };
  }

  // Lista saques para admin com filtros (status/email/userId/from/to) e ordenação
  async listAdminWithdrawals(
    status?: string,
    email?: string,
    userId?: string,
    from?: string,
    to?: string,
    sortBy?: string,
    sortDir?: 'asc' | 'desc',
  ) {
    const where: Prisma.PayoutWhereInput = {};
    if (status) (where as any).status = status as any;
    else (where as any).status = PayoutStatus.PENDING;
    if (userId) (where as any).userId = userId;
    if (email && email.trim())
      (where as any).user = {
        email: { contains: email.trim(), mode: 'insensitive' },
      } as any;

    // Filtro por intervalo de datas em requestedAt
    const dateFilter: any = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) dateFilter.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) dateFilter.lte = d;
    }
    if (Object.keys(dateFilter).length > 0)
      (where as any).requestedAt = dateFilter as Prisma.DateTimeFilter;

    // Ordenação segura
    const allowedSorts = new Set(['requestedAt', 'amount', 'status']);
    const field = allowedSorts.has(String(sortBy || ''))
      ? (sortBy as 'requestedAt' | 'amount' | 'status')
      : 'requestedAt';
    const dir: 'asc' | 'desc' = sortDir === 'asc' ? 'asc' : 'desc';

    const items = await this.prisma.payout.findMany({
      where,
      orderBy: { [field]: dir } as any,
      include: { user: true },
    });
    return items.map((p) => ({
      id: p.id,
      userId: p.userId,
      userEmail: (p as any).user?.email ?? undefined,
      amount: Number(p.amount),
      status: p.status,
      requestedAt: (p.requestedAt as any as Date).toISOString(),
      processedAt: p.processedAt
        ? (p.processedAt as any as Date).toISOString()
        : null,
      gatewayTxnId: p.gatewayTxnId ?? null,
    }));
  }

  // Confirma manualmente um saque (admin)
  async adminConfirmWithdrawal(
    payoutId: string,
    input?: {
      gatewayTxnId?: string;
      note?: string;
      confirmedByUserId?: string;
    },
  ): Promise<{ ok: true; payoutId: string }> {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });
    if (!payout) throw new NotFoundException(`Payout ${payoutId} not found.`);
    if (payout.status === PayoutStatus.PAID) return { ok: true, payoutId };
    const gwId =
      input?.gatewayTxnId ||
      payout.gatewayTxnId ||
      `manual_${Date.now()}_${payout.id}`;
    await this.applyGatewayUpdate({
      payoutId,
      status: PayoutStatus.PAID,
      gatewayTxnId: gwId,
    });
    if (input?.note || input?.confirmedByUserId) {
      // Persistir observação como notification simples (não há campo específico no schema)
      try {
        await this.prisma.notification.create({
          data: {
            userId: payout.userId,
            type: 'WITHDRAWAL_PAID',
            title: 'Saque confirmado',
            message: input?.note
              ? `Saque confirmado manualmente. Nota: ${input.note}`
              : 'Saque confirmado manualmente.',
            targetUrl: '/app/(provider)/earnings',
          },
        });
      } catch {}
    }
    return { ok: true, payoutId };
  }

  async adminFailWithdrawal(
    payoutId: string,
    input?: {
      gatewayTxnId?: string;
      note?: string;
      confirmedByUserId?: string;
    },
  ): Promise<{ ok: true; payoutId: string }> {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });
    if (!payout) throw new NotFoundException(`Payout ${payoutId} not found.`);
    if (payout.status === PayoutStatus.PAID) {
      throw new BadRequestException('Cannot mark a PAID payout as FAILED.');
    }
    const gwId =
      input?.gatewayTxnId ||
      payout.gatewayTxnId ||
      `manual_${Date.now()}_${payout.id}`;
    await this.applyGatewayUpdate({
      payoutId,
      status: PayoutStatus.FAILED,
      gatewayTxnId: gwId,
    });
    if (input?.note) {
      try {
        await this.prisma.notification.create({
          data: {
            userId: payout.userId,
            type: 'WITHDRAWAL_FAILED',
            title: 'Saque falhou',
            message: `Saque marcado como FAILED. Nota: ${input.note}`,
            targetUrl: '/app/(provider)/earnings',
          },
        });
      } catch {}
    }
    return { ok: true, payoutId };
  }

  async adminCancelWithdrawal(
    payoutId: string,
    input?: {
      gatewayTxnId?: string;
      note?: string;
      confirmedByUserId?: string;
    },
  ): Promise<{ ok: true; payoutId: string }> {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });
    if (!payout) throw new NotFoundException(`Payout ${payoutId} not found.`);
    if (payout.status === PayoutStatus.PAID) {
      throw new BadRequestException('Cannot cancel a PAID payout.');
    }
    const gwId =
      input?.gatewayTxnId ||
      payout.gatewayTxnId ||
      `manual_${Date.now()}_${payout.id}`;
    await this.applyGatewayUpdate({
      payoutId,
      status: PayoutStatus.CANCELED,
      gatewayTxnId: gwId,
    });
    if (input?.note) {
      try {
        await this.prisma.notification.create({
          data: {
            userId: payout.userId,
            type: 'WITHDRAWAL_FAILED',
            title: 'Saque cancelado',
            message: `Saque marcado como CANCELADO. Nota: ${input.note}`,
            targetUrl: '/app/(provider)/earnings',
          },
        });
      } catch {}
    }
    return { ok: true, payoutId };
  }

  async requestWithdrawal(
    userId: string,
    dto: RequestWithdrawalDto,
    idempotencyKey?: string,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required.');
    }

    // In production, withdrawals must not proceed without a configured PSP token
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    if (nodeEnv === 'production' && !this.pspToken) {
      this.logger.error(
        'requestWithdrawal: PSP token missing in production. Blocking withdrawal request.',
      );
      throw new ForbiddenException(
        'Withdrawals are temporarily unavailable. Please try again later.',
      );
    }

    const lockKey = `payout:lock:${userId}`;
    const lockValue = randomUUID();

    const acquired = await this.tryAcquireLock(lockKey, lockValue);
    if (!acquired) {
      throw new ConflictException(
        'Another withdrawal is being processed. Please try again in a moment.',
      );
    }

    try {
      const payout = await this.prisma.$transaction(async (tx) => {
        // KYC + PIX key validation
        const provider = await tx.provider.findFirst({ where: { userId } });
        if (!provider) {
          throw new BadRequestException('Provider not found for user.');
        }
        if (provider.verificationStatus !== VerificationStatus.APPROVED) {
          throw new ForbiddenException(
            'KYC not approved. Complete verification to withdraw.',
          );
        }

        const existing = await tx.payout.findUnique({
          where: { idempotencyKey },
        });
        if (existing) {
          this.logger.debug(
            `requestWithdrawal: idempotent hit for key ${idempotencyKey}`,
          );
          return existing;
        }

        const balance = await this.computeBalance(tx, userId);
        const amount = new Prisma.Decimal(dto.amount);

        if (amount.lt(this.minWithdrawal)) {
          throw new BadRequestException(
            `Minimum withdrawal amount is R$ ${this.minWithdrawal.toFixed(2)}.`,
          );
        }
        if (this.maxWithdrawal && amount.gt(this.maxWithdrawal)) {
          throw new BadRequestException(
            `Maximum withdrawal amount is R$ ${this.maxWithdrawal.toFixed(2)}.`,
          );
        }

        // Daily limits (amount and count)
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dailyAgg = await tx.payout.aggregate({
          _sum: { amount: true },
          _count: true,
          where: { userId, requestedAt: { gte: since } },
        });
        const dailySum = dailyAgg._sum.amount ?? new Prisma.Decimal(0);
        const dailyCount = dailyAgg._count;
        if (this.dailyLimit && dailySum.add(amount).gt(this.dailyLimit)) {
          throw new BadRequestException(
            `Daily withdrawal limit exceeded. Remaining today: R$ ${this.dailyLimit.sub(dailySum).toFixed(2)}.`,
          );
        }
        if (this.dailyCountMax > 0 && dailyCount >= this.dailyCountMax) {
          throw new BadRequestException(
            'Daily withdrawal count limit reached. Try again tomorrow.',
          );
        }

        // PIX key effective
        const effectivePixKey = (dto.pixKey || provider.pixKey || '').trim();
        if (!effectivePixKey) {
          throw new BadRequestException(
            'Missing PIX key. Configure your PIX key first.',
          );
        }
        const effectivePixKeyType: PixKeyType | undefined =
          dto.pixKeyType as any;

        // Fees
        const percentFee = amount.mul(this.withdrawalPercentFee);
        const fee = percentFee.greaterThan(this.withdrawalFixedFee)
          ? percentFee
          : this.withdrawalFixedFee;
        const totalDebit = amount.add(fee);
        if (totalDebit.gt(balance)) {
          throw new BadRequestException(
            `Saldo insuficiente. Seu saldo atual é de R$ ${balance.toFixed(2)} (com taxas incluídas).`,
          );
        }

        await tx.ledgerEntry.create({
          data: {
            userId,
            amount: amount.mul(-1),
            type: LedgerEntryType.WITHDRAWAL,
            note:
              dto.notes ??
              `PIX withdrawal request for ${effectivePixKeyType || 'PIX'}: ${effectivePixKey}`,
          },
        });
        if (fee.gt(0)) {
          await tx.ledgerEntry.create({
            data: {
              userId,
              amount: fee.mul(-1),
              type: LedgerEntryType.FEE,
              note: 'Withdrawal fee',
            },
          });
        }

        const newPayout = await tx.payout.create({
          data: {
            userId,
            amount,
            idempotencyKey,
            status: PayoutStatus.PENDING,
          },
        });

        // Initiate PSP transfer if configured; else enqueue placeholder job
        if (this.pspToken) {
          try {
            const gatewayTxnId = await this.initiateGatewayTransfer(
              newPayout.id,
              amount.toNumber(),
              effectivePixKey,
              effectivePixKeyType,
              idempotencyKey,
            );
            await tx.payout.update({
              where: { id: newPayout.id },
              data: { status: PayoutStatus.PROCESSING, gatewayTxnId },
            });
            this.logger.log(
              `requestWithdrawal: payout ${newPayout.id} sent to PSP, txn=${gatewayTxnId}.`,
            );
          } catch (e) {
            this.logger.error(
              `requestWithdrawal: PSP initiation failed for payout ${newPayout.id}: ${e?.message}`,
            );
          }
        } else {
          await this.queues.addJob(
            'payouts',
            'process-payout',
            { payoutId: newPayout.id },
            {
              attempts: 5,
              backoff: { type: 'exponential', delay: 2000 },
              removeOnFail: false,
            },
          );
          this.logger.log(
            `requestWithdrawal: payout ${newPayout.id} scheduled for processing (placeholder).`,
          );
        }
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
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });
    if (!payout) {
      this.logger.warn(`processPayout: payout ${payoutId} not found.`);
      return;
    }

    if (payout.status !== PayoutStatus.PENDING) {
      this.logger.debug(
        `processPayout: payout ${payoutId} already processed with status ${payout.status}.`,
      );
      return;
    }

    // In production, do not simulate PAID when PSP token is missing
    const nodeEnv2 =
      this.configService.get<string>('NODE_ENV') || 'development';
    if (!this.pspToken && nodeEnv2 === 'production') {
      this.logger.warn(
        `processPayout: PSP token missing in production; payout ${payoutId} will remain PENDING.`,
      );
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

    this.logger.log(
      `processPayout: payout ${payoutId} marked as PROCESSING with gatewayTxnId ${gatewayTxnId}.`,
    );

    // Sem PSP configurado: em dev/test simular sucesso imediato; em prod não
    if (!this.pspToken && nodeEnv2 !== 'production') {
      await this.applyGatewayUpdate({
        payoutId,
        status: PayoutStatus.PAID,
        gatewayTxnId,
      });
    }
  }

  async handleGatewayWebhook(signature: string, eventId: string, payload: any) {
    if (!eventId) {
      throw new BadRequestException('Missing webhook event identifier.');
    }

    const secret = this.configService.get<string>('PSP_WEBHOOK_SECRET');
    if (secret) {
      if (!signature) {
        throw new BadRequestException('Missing webhook signature header.');
      }
      const payloadString = JSON.stringify(payload ?? {});
      if (!this.verifySignature(signature, payloadString, secret)) {
        this.logger.warn('handleGatewayWebhook: invalid signature.');
        throw new ForbiddenException('Invalid webhook signature.');
      }
    } else {
      this.logger.warn(
        'handleGatewayWebhook: PSP_WEBHOOK_SECRET not configured. Skipping signature validation.',
      );
    }

    const exists = await this.prisma.webhookReplay.findUnique({
      where: { eventId },
    });
    if (exists) {
      this.logger.debug(
        `handleGatewayWebhook: replay event ${eventId} ignored.`,
      );
      return { ok: true, replay: true };
    }

    await this.prisma.webhookReplay.create({
      data: { source: 'psp', eventId },
    });

    const { payoutId, status, gatewayTxnId } = payload ?? {};
    if (!payoutId || !status) {
      throw new BadRequestException(
        'Webhook payload missing payoutId or status.',
      );
    }

    await this.applyGatewayUpdate({ payoutId, status, gatewayTxnId });
    return { ok: true };
  }

  private async computeBalance(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<Prisma.Decimal> {
    // Total ledger sum
    const total = await tx.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { userId },
    });
    const sumAll = total._sum.amount ?? new Prisma.Decimal(0);

    // Settlement windows
    if (this.settleWindowDays <= 0) {
      // Support short hold by hours (e.g., +1h após COMPLETED)
      if (this.settleWindowHours > 0) {
        const cutoffHours = new Date(
          Date.now() - this.settleWindowHours * 60 * 60 * 1000,
        );
        const withheldAggHours = await tx.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            type: LedgerEntryType.EARNING,
            createdAt: { gt: cutoffHours },
          },
        });
        const withholdHours =
          withheldAggHours._sum.amount ?? new Prisma.Decimal(0);
        return sumAll.sub(withholdHours);
      }
      return sumAll;
    }

    // Withhold EARNING inside T+N or with active dispute
    const cutoff = new Date(
      Date.now() - this.settleWindowDays * 24 * 60 * 60 * 1000,
    );
    const withheldAgg = await tx.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: LedgerEntryType.EARNING,
        OR: [
          { createdAt: { gt: cutoff } },
          {
            booking: { dispute: { status: { in: ['PENDING', 'IN_REVIEW'] } } },
          },
        ],
      },
    });
    const withhold = withheldAgg._sum.amount ?? new Prisma.Decimal(0);
    return sumAll.sub(withhold);
  }

  private async computeAvailableBalance(
    userId: string,
  ): Promise<Prisma.Decimal> {
    return this.prisma.$transaction(async (tx) =>
      this.computeBalance(tx, userId),
    );
  }

  private async applyGatewayUpdate(input: GatewayUpdateInput): Promise<void> {
    const targetStatus = this.normalizeStatus(input.status);

    await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: input.payoutId },
      });
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

      if (
        targetStatus === PayoutStatus.FAILED ||
        targetStatus === PayoutStatus.CANCELED
      ) {
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

    // Fetch the updated payout to get userId for notification
    const updatedPayout = await this.prisma.payout.findUnique({
      where: { id: input.payoutId },
      select: { userId: true },
    });
    if (!updatedPayout) {
      this.logger.warn(
        `applyGatewayUpdate: payout ${input.payoutId} not found after update.`,
      );
      return;
    }

    // Notificações básicas (via fila)
    try {
      const type =
        targetStatus === PayoutStatus.PAID
          ? 'WITHDRAWAL_PAID'
          : targetStatus === PayoutStatus.FAILED ||
              targetStatus === PayoutStatus.CANCELED
            ? 'WITHDRAWAL_FAILED'
            : 'WITHDRAWAL_STATUS';
      await this.queues.addNotificationJob('send-notification', {
        userId: updatedPayout.userId,
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

  private verifySignature(
    signature: string,
    payload: string,
    secret: string,
  ): boolean {
    const computed = createHmac('sha256', secret).update(payload).digest('hex');
    const incoming = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;
    try {
      return timingSafeEqual(
        Buffer.from(incoming, 'hex'),
        Buffer.from(computed, 'hex'),
      );
    } catch {
      return false;
    }
  }

  private async tryAcquireLock(
    key: string,
    value: string,
    ttlMs = 15000,
  ): Promise<boolean> {
    const maxAttempts = 5;
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const acquired = await this.redisLock.acquireLock(key, value, ttlMs);
      if (acquired) {
        return true;
      }
      await delay(100);
    }

    return false;
  }

  private async initiateGatewayTransfer(
    payoutId: string,
    amount: number,
    pixKey: string,
    pixKeyType?: PixKeyType,
    idempotencyKey?: string,
  ): Promise<string> {
    if (!this.pspToken) throw new Error('PSP token not configured');

    const payload: any = {
      reference_id: payoutId,
      amount: Math.round(Math.max(0, amount) * 100),
      pix: {
        key: pixKey,
        key_type: pixKeyType || 'RANDOM',
      },
      description: `Withdrawal for ${payoutId}`,
      callback_url: `${this.configService.get<string>('API_BASE_URL') || ''}/payouts/webhook/gateway`,
    };
    const headers: any = {
      Authorization: `Bearer ${this.pspToken || (await this.connectService.getAccessToken())}`,
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;

    const url = `${this.pspBaseUrl.replace(/\/$/, '')}/payouts`;
    try {
      const res = await axios.post(url, payload, {
        headers,
        timeout: 10000,
        httpsAgent: this.pspHttpsAgent,
      });
      const txnId =
        res.data?.id || res.data?.transaction_id || `gw_${payoutId}`;
      return String(txnId);
    } catch (e: any) {
      this.logger.error(
        `PSP payout error: ${e?.response?.status} ${JSON.stringify(e?.response?.data || e.message)}`,
      );
      throw new Error('PSP payout initiation failed');
    }
  }
}
