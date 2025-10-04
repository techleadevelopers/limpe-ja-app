import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, LedgerEntryType, PayoutStatus } from '@prisma/client';
import { ProvidersService } from '../providers/providers.service';
import { EarningsResponseDto, WithdrawalResponseDto } from './dto/earnings.dto';
import { PayoutsService } from '../payouts/payouts.service';
import { RequestWithdrawalDto } from '../payouts/dto/request-withdrawal.dto';

@Injectable()
export class EarningsService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private payoutsService: PayoutsService,
  ) {}

  async getEarnings(userId: string): Promise<EarningsResponseDto> {
    const provider = await this.providersService.findByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    // totalEarnings: soma de EARNING
    const sumEarnings = await this.prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { userId, type: LedgerEntryType.EARNING },
    });
    const totalEarnings = Number((sumEarnings._sum.amount ?? new Prisma.Decimal(0)).toFixed(2));

    // availableForWithdrawal: soma de todas as entradas do ledger
    const sumAll = await this.prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { userId },
    });
    const availableForWithdrawal = Math.max(0, Number((sumAll._sum.amount ?? new Prisma.Decimal(0)).toFixed(2)));

    // pendingWithdrawals: payouts PENDING/PROCESSING
    const sumPending = await this.prisma.payout.aggregate({
      _sum: { amount: true },
      where: { userId, status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] } },
    });
    const pendingWithdrawals = Number((sumPending._sum.amount ?? new Prisma.Decimal(0)).toFixed(2));

    // recentTransactions: últimos 10 ledger entries
    const recentEntries = await this.prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const mapType = (t: LedgerEntryType): 'PAYMENT' | 'WITHDRAWAL' | 'COMMISSION' => {
      switch (t) {
        case LedgerEntryType.EARNING:
        case LedgerEntryType.RELEASE:
          return 'PAYMENT';
        case LedgerEntryType.WITHDRAWAL:
          return 'WITHDRAWAL';
        case LedgerEntryType.FEE:
        case LedgerEntryType.HOLD:
        case LedgerEntryType.ADJUSTMENT:
        case LedgerEntryType.REFUND:
        default:
          return 'COMMISSION';
      }
    };

    // earningsBreakdown: por mês (últimos 12 meses), apenas EARNING
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const earningEntries = await this.prisma.ledgerEntry.findMany({
      where: { userId, type: LedgerEntryType.EARNING, createdAt: { gte: twelveMonthsAgo } },
      orderBy: { createdAt: 'asc' },
    });
    const earningsBreakdown: { [period: string]: number } = {};
    earningEntries.forEach((e) => {
      const monthYear = e.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      earningsBreakdown[monthYear] = (earningsBreakdown[monthYear] || 0) + Number(e.amount);
    });

    return {
      totalEarnings,
      availableForWithdrawal,
      pendingWithdrawals,
      recentTransactions: recentEntries.map((le) => ({
        id: le.id,
        amount: Number(le.amount),
        type: mapType(le.type),
        description: le.note || 'N/A',
        date: le.createdAt,
      })),
      earningsBreakdown,
    };
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto, idempotencyKey?: string): Promise<WithdrawalResponseDto> {
    if (!idempotencyKey) {
      throw new BadRequestException('Header Idempotency-Key é obrigatório.');
    }
    const result = await this.payoutsService.requestWithdrawal(userId, dto, idempotencyKey);
    return {
      success: true,
      message: result.message,
      transactionId: result.payoutId,
    };
  }
}

