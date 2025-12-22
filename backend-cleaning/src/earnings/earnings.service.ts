import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  LedgerEntryType,
  PayoutStatus,
  BookingStatus,
  PaymentIntentStatus,
} from '@prisma/client';
import { ProvidersService } from '../providers/providers.service';
import {
  EarningsResponseDto,
  WithdrawalResponseDto,
} from './dto/earnings.dto';
import { PayoutsService } from '../payouts/payouts.service';
import { RequestWithdrawalDto } from '../payouts/dto/request-withdrawal.dto';
import { ProviderEarningsViewDto } from './dto/provider-earnings-view.dto';

@Injectable()
export class EarningsService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private payoutsService: PayoutsService, // Mantido, embora getBalance não seja mais usado em getEarnings
  ) {}

  async getEarnings(userId: string): Promise<EarningsResponseDto> {
    const provider = await this.providersService.findByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provedor não encontrado.');
    }

    // --- INÍCIO DA NOVA LÓGICA DO DASHBOARD ---

    // 1. totalGrossSales: HOLD positivos
    const gross = await this.prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: LedgerEntryType.HOLD,
        amount: { gt: 0 }, // Apenas HOLDs positivos representam vendas brutas
      },
    });

    const totalGrossSales = Number(
      (gross._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
    );

    // 2. availableForWithdrawal: EARNING - WITHDRAWAL
    // Assume-se que entradas do tipo WITHDRAWAL são registradas com valores negativos no campo 'amount'
    // para que a soma direta resulte em EARNING - WITHDRAWAL.
    const available = await this.prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: { in: [LedgerEntryType.EARNING, LedgerEntryType.WITHDRAWAL] },
      },
    });

    const availableForWithdrawal = Number(
      (available._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
    );

    // 3. pendingEarnings: Gross - Available
    const pendingEarnings = Number(
      (totalGrossSales - availableForWithdrawal).toFixed(2),
    );

    // --- FIM DA NOVA LÓGICA DO DASHBOARD ---

    // As seções abaixo são mantidas do código original, pois não foram contraditas pela correção.

    // recentTransactions: últimos 10 ledger entries
    const recentEntries = await this.prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const mapType = (
      t: LedgerEntryType,
    ): 'PAYMENT' | 'WITHDRAWAL' | 'COMMISSION' => {
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
      where: {
        userId,
        type: LedgerEntryType.EARNING,
        createdAt: { gte: twelveMonthsAgo },
      },
      orderBy: { createdAt: 'asc' },
    });
    const earningsBreakdown: { [period: string]: number } = {};
    earningEntries.forEach((e) => {
      const monthYear = e.createdAt.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
      earningsBreakdown[monthYear] =
        (earningsBreakdown[monthYear] || 0) + Number(e.amount);
    });

    const earningsView = new ProviderEarningsViewDto(
      totalGrossSales,
      availableForWithdrawal,
    );

    // Retorna os dados, mapeando as novas métricas para os campos existentes no DTO
    return {
      totalEarnings: totalGrossSales, // Mapeia totalGrossSales para totalEarnings
      availableForWithdrawal: availableForWithdrawal, // Usa a nova availableForWithdrawal
      pendingWithdrawals: pendingEarnings, // Mapeia pendingEarnings para pendingWithdrawals
      preApprovedEarnings: 0, // Não há equivalente na nova lógica, definido como 0
      recentTransactions: recentEntries.map((le) => ({
        id: le.id,
        amount: Number(le.amount),
        type: mapType(le.type),
        description: le.note || 'N/A',
        createdAt:
          le.createdAt instanceof Date
            ? le.createdAt.toISOString()
            : (le.createdAt as any),
      })),
      earningsBreakdown,
      earningsView,
    };
  }

  async requestWithdrawal(
    userId: string,
    dto: RequestWithdrawalDto,
    idempotencyKey?: string,
  ): Promise<WithdrawalResponseDto> {
    if (!idempotencyKey) {
      throw new BadRequestException('Header Idempotency-Key é obrigatório.');
    }
    const result = await this.payoutsService.requestWithdrawal(
      userId,
      dto,
      idempotencyKey,
    );
    return {
      success: true,
      message: result.message,
      transactionId: result.payoutId,
    };
  }
}
