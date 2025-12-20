// src/modules/loyalty/loyalty.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, LoyaltyTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddPointsDto } from './dto/add-points.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
  ) {}

  /**
   * Adiciona pontos ao saldo de fidelidade de um usuário e registra a transação.
   * Aplica multiplicadores de gamificação (Tier, Streak, NPS/Review).
   */
  async addPoints(dto: AddPointsDto): Promise<number> {
    const { userId, points, type, referenceId } = dto;

    if (!userId) throw new BadRequestException('userId é obrigatório.');
    if (!points || points <= 0)
      throw new BadRequestException('Pontos devem ser > 0.');

    let finalPoints = points;

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
    const currentBalance = await this.prisma.$transaction(async (tx) => {
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

      await tx.loyaltyTransaction.create({
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
    return loyalty?.currentPoints ?? 0;
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

  /**
   * Remove pontos expirados (após 180 dias sem uso).
   * Este método deve ser chamado por um job agendado (ex: cron diário).
   * A implementação real depende de como a expiração de pontos é modelada (ex: FIFO, data de expiração por transação).
   */
  async expireOldPoints(): Promise<void> {
    this.logger.log(
      '[LoyaltyService] Iniciando expiração de pontos antigos...',
    );
    const oneHundredEightyDaysAgo = new Date(
      Date.now() - 180 * 24 * 60 * 60 * 1000,
    );
    this.logger.debug(
      `[LoyaltyService] Data de corte para expiração: ${oneHundredEightyDaysAgo.toISOString()}`,
    );

    // Esta é uma lógica conceitual. A implementação real requer um modelo de dados mais granular para pontos.
    // Exemplo: Se cada LoyaltyTransaction tivesse um `expiresAt`
    // const expiredTransactions = await this.prisma.loyaltyTransaction.findMany({
    //   where: {
    //     createdAt: { lte: oneHundredEightyDaysAgo },
    //     points: { gt: 0 }, // Pontos ganhos
    //     // E se não foram "consumidos" por resgates (lógica complexa de FIFO)
    //   },
    // });

    // for (const tx of expiredTransactions) {
    //   // Debitar pontos do saldo do usuário
    //   await this.prisma.loyalty.update({
    //     where: { userId: tx.userId },
    //     data: { currentPoints: { decrement: tx.points } },
    //   });
    //   // Registrar transação de expiração
    //   await this.prisma.loyaltyTransaction.create({
    //     data: {
    //       userId: tx.userId,
    //       points: -tx.points,
    //       type: LoyaltyTransactionType.EXPIRED, // Novo tipo de transação no enum
    //       referenceId: tx.id,
    //     },
    //   });
    //   this.logger.log(`[LoyaltyService] ${tx.points} pontos expirados para o usuário ${tx.userId}.`);
    //   // TODO: Notificar o usuário sobre pontos expirados via NotificationsModule
    // }

    this.logger.warn(
      '[LoyaltyService] Lógica de expiração de pontos é complexa e requer modelagem de dados específica (ex: FIFO). Implementação conceitual.',
    );
    this.logger.log(
      '[LoyaltyService] Expiração de pontos concluída (conceitual).',
    );
    await Promise.resolve();
  }
}
