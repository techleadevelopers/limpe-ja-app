// src/modules/loyalty/loyalty.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  LoyaltyTransaction,
  LoyaltyTransactionType,
} from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ObservabilityService } from '../observability/observability.service';
import { AddPointsDto } from './dto/add-points.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationService } from '../services/NotificationService';

const DAILY_LIMITS: Partial<Record<LoyaltyTransactionType, number>> = {
  [LoyaltyTransactionType.REVIEW_SUBMITTED]: 500,
  [LoyaltyTransactionType.SERVICE_COMPLETED]: 800,
  [LoyaltyTransactionType.REFERRAL]: 1000,
};

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);
  private readonly POINT_EXPIRATION_DAYS = 180;

  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
    private readonly notificationService: NotificationService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  /**
   * Adiciona pontos ao saldo de fidelidade de um usuário e registra a transação.
   * Aplica multiplicadores de gamificação (Tier, Streak, NPS/Review).
   */
  async addPoints(
    dto: AddPointsDto,
    options?: { prisma?: Prisma.TransactionClient },
  ): Promise<number> {
    const { userId, points, type, referenceId } = dto;

    if (!userId) throw new BadRequestException('userId é obrigatório.');
    if (!points || points <= 0)
      throw new BadRequestException('Pontos devem ser > 0.');

    let finalPoints = points;
    let createdTransaction: LoyaltyTransaction | null = null;

    // --- NOVO: Lógica de Multiplicadores ---
    // O 'points' recebido no DTO é o 'pontos_base' (calculado pelo módulo chamador, ex: BookingsService)

    // 1. Fetch do Tier do usuário (placeholder: mantido estático até modelagem do tier)
    const m_tier = 1.0;

    // 2. Fetch do Streak de reservas do usuário (requer lógica para calcular semanas consecutivas)
    const weeksConsecutiveBookings = this.getUserBookingStreak(userId);
    const m_streak = 1 + 0.05 * Math.min(weeksConsecutiveBookings, 6);

    // 3. Fetch do status de review do usuário (requer lógica para verificar review recente com boa nota)
    const hasRecentGoodReview = this.hasRecentGoodReview(userId);
    const m_review = hasRecentGoodReview ? 1.1 : 1.0;

    // Aplicação da fórmula final: pontos = floor(pontos_base × m_tier × m_streak × m_review)
    finalPoints = Math.floor(points * m_tier * m_streak * m_review);

    // Exemplo de campanha: dobrar pontos de indicação em agosto (mantido)
    if (
      type === LoyaltyTransactionType.REFERRAL &&
      new Date().getMonth() === 7
    ) {
      finalPoints = finalPoints * 2;
      this.logger.log(
        `[LoyaltyService] Campanha ativa: pontos de indicação dobrados (${finalPoints}).`,
      );
    }
    // --- Fim da Lógica de Multiplicadores ---

    // Idempotente: evita duplicar pontos para mesma combinação userId+type+referenceId
    const transactionClient = options?.prisma;
    const runInTransaction = async (
      action: (tx: Prisma.TransactionClient) => Promise<number>,
    ) => {
      if (transactionClient) {
        return action(transactionClient);
      }
      return this.prisma.$transaction(action);
    };

    const currentBalance = await runInTransaction(async (tx) => {
      await this.enforceDailyLimit(tx, userId, type, finalPoints);

      const alreadyExists = await tx.loyaltyTransaction.findUnique({
        where: {
          userId_type_referenceId: {
            userId,
            type,
            referenceId: referenceId ?? null,
          },
        },
      });

      if (alreadyExists) {
        const existing = await tx.loyalty.findUnique({ where: { userId } });
        this.logger.warn(
          `[LoyaltyService] Pontos já registrados para user=${userId}, ref=${referenceId}, type=${type}. Ignorando duplicado.`,
        );
        return existing?.currentPoints ?? 0;
      }

      const loyalty = await tx.loyalty.upsert({
        where: { userId },
        create: { userId, currentPoints: finalPoints },
        update: { currentPoints: { increment: finalPoints } },
      });

      createdTransaction = await tx.loyaltyTransaction.create({
        data: {
          userId,
          points: finalPoints,
          type,
          referenceId,
        },
      });

      this.logger.log(
        `[LoyaltyService] ${finalPoints} pontos creditados ao usuário ${userId}. Saldo: ${loyalty.currentPoints}`,
      );
      // Telemetria: loyalty_points_earned
      this.logger.log(
        `[TELEMETRY] loyalty_points_earned: { userId: ${userId}, points: ${finalPoints}, type: ${type}, currentBalance: ${loyalty.currentPoints} }`,
      );

      return loyalty.currentPoints;
    });

    if (finalPoints > 0 && createdTransaction) {
      const notificationTitle = 'Pontos de fidelidade recebidos!';
      const notificationBody =
        'Você ganhou novos pontos de fidelidade! 🌟 Continue assim.';
      const notificationPayload: Record<string, unknown> = {
        points: finalPoints,
        type,
        referenceId: referenceId ?? undefined,
        transactionId: createdTransaction.id,
      };
      try {
        await this.notificationService.sendToUser(
          userId,
          notificationTitle,
          notificationBody,
          notificationPayload,
        );
        this.logger.log(
          `[Push] LoyaltyTransaction ${createdTransaction.id} | userId ${userId} | points ${finalPoints}`,
        );
      } catch (error) {
        this.logger.warn(
          `[LoyaltyService] Falha ao notificar user ${userId} sobre pontos ganhos: ${
            error instanceof Error ? error.message : JSON.stringify(error)
          }`,
        );
      }
    }

    return currentBalance;
  }

  /**
   * Resgata pontos por uma recompensa.
   * Para rewardType === 'DISCOUNT_COUPON', gera um cupom pessoal (uso único, 30 dias).
   */
  async redeemPoints(
    userId: string,
    redeemData: RedeemPointsDto,
  ): Promise<{
    success: boolean;
    couponCode?: string;
    expiresAt?: string;
  }> {
    if (!userId) throw new BadRequestException('userId é obrigatório.');
    const { pointsToRedeem, rewardType, rewardId } = redeemData;

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      throw new BadRequestException('pointsToRedeem deve ser > 0.');
    }
    if (rewardType !== 'DISCOUNT_COUPON') {
      throw new BadRequestException(
        'Tipo de recompensa não suportado no momento.',
      );
    }
    if (!rewardId) {
      throw new BadRequestException(
        'rewardId é obrigatório para DISCOUNT_COUPON.',
      );
    }

    // Telemetria: loyalty_redeem_attempt
    this.logger.log(
      `[TELEMETRY] loyalty_redeem_attempt: { userId: ${userId}, pointsToRedeem: ${pointsToRedeem}, rewardId: ${rewardId} }`,
    );

    // Verifica saldo
    const loyalty = await this.prisma.loyalty.findUnique({ where: { userId } });
    if (!loyalty || loyalty.currentPoints < pointsToRedeem) {
      this.logger.warn(
        `[LoyaltyService] redeemPoints: Pontos insuficientes para resgate. Usuário ${userId} tem ${loyalty?.currentPoints || 0}, precisa de ${pointsToRedeem}.`,
      );
      throw new BadRequestException('Pontos insuficientes para resgate.');
    }

    // Busca a recompensa (catálogo) - Assumimos que a tabela 'Reward' existe no Prisma
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
    });
    if (!reward || !reward.isActive) {
      this.logger.warn(
        `[LoyaltyService] redeemPoints: Recompensa ${rewardId} inválida ou inativa.`,
      );
      throw new NotFoundException('Recompensa inválida ou inativa.');
    }
    if (reward.costPoints !== pointsToRedeem) {
      this.logger.warn(
        `[LoyaltyService] redeemPoints: Custo de pontos informado (${pointsToRedeem}) não corresponde ao da recompensa (${reward.costPoints}).`,
      );
      throw new BadRequestException(
        'Custo de pontos informado não corresponde ao da recompensa.',
      );
    }

    // Determina tipo de desconto baseado no valor:
    const isPercent = new Prisma.Decimal(reward.value).lte(1);
    const valueType: 'PERCENT' | 'FIXED' = isPercent ? 'PERCENT' : 'FIXED';
    const couponTarget = 'GENERAL';

    const now = new Date();
    const validUntilDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias de validade
    const validUntil = validUntilDate.toISOString();

    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `POINTS-${random}`;

    // Cria o cupom via service
    await this.couponsService.create({
      code,
      type: valueType,
      value: Number(new Prisma.Decimal(reward.value).toFixed(2)),
      validFrom: now.toISOString(),
      validUntil,
      maxUses: 1,
      target: couponTarget,
      description:
        reward.description ?? 'Cupom resgatado com pontos de fidelidade',
      isActive: true,
      issuedToUserId: userId, // Amarra o cupom ao usuário que o resgatou
      issuedBy: 'LOYALTY_REDEEM', // Origem do cupom
    });

    // Debita pontos e registra transação
    await this.prisma.loyalty.update({
      where: { userId },
      data: { currentPoints: { decrement: pointsToRedeem } },
    });

    await this.prisma.loyaltyTransaction.create({
      data: {
        userId,
        points: -pointsToRedeem,
        type: LoyaltyTransactionType.REDEEM,
        referenceId: rewardId,
      },
    });

    this.logger.log(
      `[redeemPoints] Usuário ${userId} resgatou ${pointsToRedeem} pontos. Cupom: ${code} (expira em ${validUntil}).`,
    );
    // Telemetria: loyalty_points_redeemed
    this.logger.log(
      `[TELEMETRY] loyalty_points_redeemed: { userId: ${userId}, pointsRedeemed: ${pointsToRedeem}, rewardId: ${rewardId}, couponCode: ${code} }`,
    );

    return { success: true, couponCode: code, expiresAt: validUntil };
  }

  /**
   * Retorna o saldo atual de pontos.
   */
  async getUserPoints(userId: string): Promise<number> {
    if (!userId) throw new BadRequestException('userId é obrigatório.');
    const loyalty = await this.prisma.loyalty.findUnique({ where: { userId } });
    if (!loyalty) return 0;
    const pendingExpiration = await this.calculatePendingExpiration(userId);
    return Math.max(0, loyalty.currentPoints - pendingExpiration);
  }

  /**
   * Histórico de transações de fidelidade do usuário.
   */
  async getLoyaltyHistory(userId: string) {
    if (!userId) throw new BadRequestException('userId é obrigatório.');
    return this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista recompensas ativas do catálogo de pontos (Reward).
   */
  async getActiveRewards(
    limit?: number,
    offset?: number,
    type?: string,
    q?: string,
  ) {
    const where: Prisma.RewardWhereInput = { isActive: true };
    if (type) where.type = { equals: type };
    if (q) where.name = { contains: q, mode: 'insensitive' };
    const rewards = await this.prisma.reward.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        costPoints: true,
        value: true,
        isActive: true,
        type: true,
      },
      orderBy: { costPoints: 'asc' },
      take: typeof limit === 'number' ? limit : 20,
      skip: typeof offset === 'number' ? offset : 0,
    });
    return rewards;
  }

  // =========================
  // Métodos Auxiliares para Multiplicadores (Novos)
  // =========================

  // TODO: Implementar busca de tier do usuário.
  // Isso exigiria uma nova tabela (ex: UserTier) ou um campo no modelo User/Loyalty.
  private getUserTier(userId: string): 'BRONZE' | 'PRATA' | 'OURO' | 'PLATINA' {
    // Exemplo: Buscar do Prisma.userTier ou calcular baseado em pontos acumulados
    // const userTierRecord = await this.prisma.userTier.findUnique({ where: { userId } });
    // return userTierRecord?.tier || 'BRONZE';

    // Por enquanto, retorna um valor padrão para não quebrar a lógica
    this.logger.warn(
      `[LoyaltyService] getUserTier não implementado para user ${userId}. Retornando BRONZE.`,
    );
    return 'BRONZE';
  }

  // TODO: Implementar cálculo de streak de reservas.
  // Isso exigiria analisar o histórico de bookings do usuário.
  private getUserBookingStreak(userId: string): number {
    // Exemplo: Contar semanas consecutivas com bookings COMPLETED
    // const client = await this.prisma.client.findUnique({ where: { userId }, select: { id: true } });
    // if (!client) return 0;
    // const completedBookings = await this.prisma.booking.findMany({
    //   where: { clientId: client.id,  status: 'FINISHED' },
    //   orderBy: { createdAt: 'desc' },
    //   select: { createdAt: true },
    // });
    // Lógica complexa para calcular semanas consecutivas...
    this.logger.warn(
      `[LoyaltyService] getUserBookingStreak não implementado para user ${userId}. Retornando 0.`,
    );
    return 0; // Placeholder
  }

  // TODO: Implementar verificação de review recente com boa nota.
  // Isso exigiria analisar o histórico de reviews do usuário.
  private hasRecentGoodReview(userId: string): boolean {
    // Exemplo: Verificar se há uma review >= 4 estrelas nas últimas 4 semanas
    // const client = await this.prisma.client.findUnique({ where: { userId }, select: { id: true } });
    // if (!client) return false;
    // const fourWeeksAgo = new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000);
    // const recentReview = await this.prisma.review.findFirst({
    //   where: { clientId: client.id, rating: { gte: 4 }, createdAt: { gte: fourWeeksAgo } },
    // });
    // return !!recentReview;
    this.logger.warn(
      `[LoyaltyService] hasRecentGoodReview não implementado para user ${userId}. Retornando false.`,
    );
    return false; // Placeholder
  }

  // =========================
  // Lógica de Tiers (Upgrade/Downgrade e Decaimento)
  // =========================

  /**
   * Recalcula o tier de todos os usuários com base nos pontos acumulados nos últimos 90 dias.
   * Este método deve ser chamado por um job agendado (ex: cron diário/semanal).
   */
  async recalculateUserTiers(): Promise<void> {
    this.logger.log(
      '[LoyaltyService] Iniciando recálculo de tiers dos usuários...',
    );
    const usersLoyalty = await this.prisma.loyalty.findMany();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    for (const loyalty of usersLoyalty) {
      const pointsLast90Days = await this.prisma.loyaltyTransaction.aggregate({
        _sum: { points: true },
        where: {
          userId: loyalty.userId,
          createdAt: { gte: ninetyDaysAgo },
          points: { gt: 0 }, // Apenas pontos ganhos
        },
      });
      const totalPoints90d = pointsLast90Days._sum.points || 0;

      let newTier: 'BRONZE' | 'PRATA' | 'OURO' | 'PLATINA' = 'BRONZE';
      if (totalPoints90d >= 3000) {
        newTier = 'PLATINA';
      } else if (totalPoints90d >= 1500) {
        newTier = 'OURO';
      } else if (totalPoints90d >= 600) {
        newTier = 'PRATA';
      }

      // Atualiza o tier do usuário (assumindo um campo 'currentTier' no modelo Loyalty)
      // Se 'currentTier' não existe no modelo Loyalty, você precisaria de um novo modelo 'UserTier'
      // ou adicionar o campo ao modelo Loyalty no schema.prisma.
      await this.prisma.loyalty.update({
        where: { userId: loyalty.userId },
        data: {
          // currentTier: newTier, // Descomente se 'currentTier' for adicionado ao modelo Loyalty
          // pointsLast90Days: totalPoints90d, // Descomente se 'pointsLast90Days' for adicionado ao modelo Loyalty
        },
      });
      this.logger.log(
        `[LoyaltyService] Usuário ${loyalty.userId}: ${totalPoints90d} pontos em 90 dias -> Tier ${newTier}`,
      );
    }
    this.logger.log('[LoyaltyService] Recálculo de tiers concluído.');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePointsExpiration() {
    const start = Date.now();
    const expiredCount = await this.expirePointsOlderThan180Days();
    this.observabilityService.recordJobExecution(
      'points-expiration',
      Date.now() - start,
      expiredCount,
    );
  }

  private async expirePointsOlderThan180Days(): Promise<number> {
    this.logger.log(
      '[LoyaltyService] Iniciando expiração de pontos antigos (>=180 dias)...',
    );
    const cutoff = new Date(
      Date.now() - this.POINT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
    );
    const entries = await this.prisma.loyaltyTransaction.findMany({
      where: {
        points: { gt: 0 },
        createdAt: { lte: cutoff },
      },
      select: {
        id: true,
        userId: true,
        points: true,
      },
    });

    let expiredTotal = 0;
    for (const entry of entries) {
      const alreadyExpired = await this.prisma.loyaltyTransaction.findFirst({
        where: {
          referenceId: `expire:${entry.id}`,
        },
      });
      if (alreadyExpired) {
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.loyalty.update({
          where: { userId: entry.userId },
          data: { currentPoints: { decrement: entry.points } },
        });
        await tx.loyaltyTransaction.create({
          data: {
            userId: entry.userId,
            points: -entry.points,
            type: LoyaltyTransactionType.ADMIN_ADJUSTMENT,
            referenceId: `expire:${entry.id}`,
          },
        });
      });
      expiredTotal += entry.points;
      this.logger.log(
        `[LoyaltyService] Expirados ${entry.points} pontos do usuário ${entry.userId} (transação ${entry.id}).`,
      );
    }
    return expiredTotal;
  }

  private async enforceDailyLimit(
    tx: Prisma.TransactionClient,
    userId: string,
    type: LoyaltyTransactionType,
    addingPoints: number,
  ): Promise<void> {
    const limit = DAILY_LIMITS[type];
    if (!limit) return;
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const pointsToday = await tx.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: {
        userId,
        type,
        points: { gt: 0 },
        createdAt: { gte: startOfDay },
      },
    });
    const earned = pointsToday._sum.points ?? 0;
    if (earned + addingPoints > limit) {
      throw new BadRequestException(
        `Limite diário de ${limit} pontos para ${type} atingido.`,
      );
    }
  }

  private async calculatePendingExpiration(userId: string): Promise<number> {
    const cutoff = new Date(
      Date.now() - this.POINT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
    );
    const [expiredRefs, candidates] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where: {
          userId,
          referenceId: { startsWith: 'expire:' },
        },
        select: { referenceId: true },
      }),
      this.prisma.loyaltyTransaction.findMany({
        where: {
          userId,
          points: { gt: 0 },
          createdAt: { lte: cutoff },
        },
        select: { id: true, points: true },
      }),
    ]);
    const expiredSet = new Set(
      expiredRefs
        .map((ref) => ref.referenceId?.replace('expire:', ''))
        .filter(Boolean),
    );
    return candidates
      .filter((candidate) => !expiredSet.has(candidate.id))
      .reduce((sum, candidate) => sum + candidate.points, 0);
  }
}
