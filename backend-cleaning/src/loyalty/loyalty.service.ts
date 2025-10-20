// src/modules/loyalty/loyalty.service.ts
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
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
   * Adiciona pontos ao saldo de fidelidade de um usuÃ¡rio e registra a transaÃ§Ã£o.
   * Aplica multiplicadores de gamificaÃ§Ã£o (Tier, Streak, NPS/Review).
   */
  async addPoints(dto: AddPointsDto): Promise<number> {
    const { userId, points, type, referenceId } = dto;

    if (!userId) throw new BadRequestException('userId Ã© obrigatÃ³rio.');
    if (!points || points <= 0) throw new BadRequestException('Pontos devem ser > 0.');

    let finalPoints = points;

    // --- NOVO: LÃ³gica de Multiplicadores ---
    // O 'points' recebido no DTO Ã© o 'pontos_base' (calculado pelo mÃ³dulo chamador, ex: BookingsService)

    // 1. Fetch do Tier do usuÃ¡rio (assumindo um campo 'tier' no modelo Loyalty ou um novo modelo UserTier)
    const userLoyalty = await this.prisma.loyalty.findUnique({ where: { userId } });
    let m_tier = 1.0;
    // Assumindo que o tier Ã© um campo no Loyalty ou calculado com base em pontosLast90Days
    // if (userLoyalty?.currentTier === 'PRATA') m_tier = 1.1;
    // else if (userLoyalty?.currentTier === 'OURO') m_tier = 1.25;
    // else if (userLoyalty?.currentTier === 'PLATINA') m_tier = 1.5;

    // 2. Fetch do Streak de reservas do usuÃ¡rio (requer lÃ³gica para calcular semanas consecutivas)
    const weeksConsecutiveBookings = await this.getUserBookingStreak(userId);
    const m_streak = 1 + 0.05 * Math.min(weeksConsecutiveBookings, 6);

    // 3. Fetch do status de review do usuÃ¡rio (requer lÃ³gica para verificar review recente com boa nota)
    const hasRecentGoodReview = await this.hasRecentGoodReview(userId);
    const m_review = hasRecentGoodReview ? 1.1 : 1.0;

    // AplicaÃ§Ã£o da fÃ³rmula final: pontos = floor(pontos_base Ã— m_tier Ã— m_streak Ã— m_review)
    finalPoints = Math.floor(points * m_tier * m_streak * m_review);

    // Exemplo de campanha: dobrar pontos de indicaÃ§Ã£o em agosto (mantido)
    if (type === LoyaltyTransactionType.REFERRAL && new Date().getMonth() === 7) {
      finalPoints = finalPoints * 2;
      this.logger.log(`[LoyaltyService] Campanha ativa: pontos de indicaÃ§Ã£o dobrados (${finalPoints}).`);
    }
    // --- Fim da LÃ³gica de Multiplicadores ---

    const loyalty = await this.prisma.loyalty.upsert({
      where: { userId },
      create: { userId, currentPoints: finalPoints },
      update: { currentPoints: { increment: finalPoints } },
    });

    await this.prisma.loyaltyTransaction.create({
      data: {
        userId,
        points: finalPoints,
        type,
        referenceId,
      },
    });

    this.logger.log(`[LoyaltyService] ${finalPoints} pontos creditados ao usuÃ¡rio ${userId}. Saldo: ${loyalty.currentPoints}`);
    // Telemetria: loyalty_points_earned
    this.logger.log(`[TELEMETRY] loyalty_points_earned: { userId: ${userId}, points: ${finalPoints}, type: ${type}, currentBalance: ${loyalty.currentPoints} }`);

    return loyalty.currentPoints;
  }

  /**
   * Resgata pontos por uma recompensa.
   * Para rewardType === 'DISCOUNT_COUPON', gera um cupom pessoal (uso Ãºnico, 30 dias).
   */
  async redeemPoints(userId: string, redeemData: RedeemPointsDto): Promise<{
    success: boolean;
    couponCode?: string;
    expiresAt?: string;
  }> {
    if (!userId) throw new BadRequestException('userId Ã© obrigatÃ³rio.');
    const { pointsToRedeem, rewardType, rewardId } = redeemData;

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      throw new BadRequestException('pointsToRedeem deve ser > 0.');
    }
    if (rewardType !== 'DISCOUNT_COUPON') {
      throw new BadRequestException('Tipo de recompensa nÃ£o suportado no momento.');
    }
    if (!rewardId) {
      throw new BadRequestException('rewardId Ã© obrigatÃ³rio para DISCOUNT_COUPON.');
    }

    // Telemetria: loyalty_redeem_attempt
    this.logger.log(`[TELEMETRY] loyalty_redeem_attempt: { userId: ${userId}, pointsToRedeem: ${pointsToRedeem}, rewardId: ${rewardId} }`);

    // Verifica saldo
    const loyalty = await this.prisma.loyalty.findUnique({ where: { userId } });
    if (!loyalty || loyalty.currentPoints < pointsToRedeem) {
      this.logger.warn(`[LoyaltyService] redeemPoints: Pontos insuficientes para resgate. UsuÃ¡rio ${userId} tem ${loyalty?.currentPoints || 0}, precisa de ${pointsToRedeem}.`);
      throw new BadRequestException('Pontos insuficientes para resgate.');
    }

    // Busca a recompensa (catÃ¡logo) - Assumimos que a tabela 'Reward' existe no Prisma
    const reward = await this.prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) {
      this.logger.warn(`[LoyaltyService] redeemPoints: Recompensa ${rewardId} invÃ¡lida ou inativa.`);
      throw new NotFoundException('Recompensa invÃ¡lida ou inativa.');
    }
    if (reward.costPoints !== pointsToRedeem) {
      this.logger.warn(`[LoyaltyService] redeemPoints: Custo de pontos informado (${pointsToRedeem}) nÃ£o corresponde ao da recompensa (${reward.costPoints}).`);
      throw new BadRequestException('Custo de pontos informado nÃ£o corresponde ao da recompensa.');
    }

    // Determina tipo de desconto baseado no valor:
    const isPercent = new Prisma.Decimal(reward.value).lte(1);
    const valueType = isPercent ? 'PERCENT' : 'FIXED';

    const now = new Date();
    const validUntilDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias de validade
    const validUntil = validUntilDate.toISOString();

    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `POINTS-${random}`;

    // Cria o cupom via service
    await this.couponsService.create({
      code,
      type: valueType as any,
      value: Number(new Prisma.Decimal(reward.value).toFixed(2)),
      validFrom: now.toISOString(),
      validUntil,
      maxUses: 1,
      target: 'GENERAL' as any,
      description: reward.description ?? 'Cupom resgatado com pontos de fidelidade',
      isActive: true,
      issuedToUserId: userId, // Amarra o cupom ao usuÃ¡rio que o resgatou
      issuedBy: 'LOYALTY_REDEEM', // Origem do cupom
    });

    // Debita pontos e registra transaÃ§Ã£o
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

    this.logger.log(`[redeemPoints] UsuÃ¡rio ${userId} resgatou ${pointsToRedeem} pontos. Cupom: ${code} (expira em ${validUntil}).`);
    // Telemetria: loyalty_points_redeemed
    this.logger.log(`[TELEMETRY] loyalty_points_redeemed: { userId: ${userId}, pointsRedeemed: ${pointsToRedeem}, rewardId: ${rewardId}, couponCode: ${code} }`);

    return { success: true, couponCode: code, expiresAt: validUntil };
  }

  /**
   * Retorna o saldo atual de pontos.
   */
  async getUserPoints(userId: string): Promise<number> {
    if (!userId) throw new BadRequestException('userId Ã© obrigatÃ³rio.');
    const loyalty = await this.prisma.loyalty.findUnique({ where: { userId } });
    return loyalty?.currentPoints ?? 0;
  }

  /**
   * HistÃ³rico de transaÃ§Ãµes de fidelidade do usuÃ¡rio.
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
  async getActiveRewards(limit?: number, offset?: number, type?: string, q?: string) {
    const where: any = { isActive: true };
    if (type) where.type = type;
    if (q) where.name = { contains: q, mode: 'insensitive' };
    const rewards = await this.prisma.reward.findMany({
      where,
      select: { id: true, name: true, description: true, costPoints: true, value: true, isActive: true, type: true },
      orderBy: { costPoints: 'asc' },
      take: typeof limit === 'number' ? limit : 20,
      skip: typeof offset === 'number' ? offset : 0,
    });
    return rewards;
  }

  // =========================
  // MÃ©todos Auxiliares para Multiplicadores (Novos)
  // =========================

  // TODO: Implementar busca de tier do usuÃ¡rio.
  // Isso exigiria uma nova tabela (ex: UserTier) ou um campo no modelo User/Loyalty.
  private async getUserTier(userId: string): Promise<'BRONZE' | 'PRATA' | 'OURO' | 'PLATINA'> {
    // Exemplo: Buscar do Prisma.userTier ou calcular baseado em pontos acumulados
    // const userTierRecord = await this.prisma.userTier.findUnique({ where: { userId } });
    // return userTierRecord?.tier || 'BRONZE';

    // Por enquanto, retorna um valor padrÃ£o para nÃ£o quebrar a lÃ³gica
    this.logger.warn(`[LoyaltyService] getUserTier nÃ£o implementado. Retornando BRONZE.`);
    return 'BRONZE';
  }

  // TODO: Implementar cÃ¡lculo de streak de reservas.
  // Isso exigiria analisar o histÃ³rico de bookings do usuÃ¡rio.
  private async getUserBookingStreak(userId: string): Promise<number> {
    // Exemplo: Contar semanas consecutivas com bookings COMPLETED
    // const client = await this.prisma.client.findUnique({ where: { userId }, select: { id: true } });
    // if (!client) return 0;
    // const completedBookings = await this.prisma.booking.findMany({
    //   where: { clientId: client.id, status: 'COMPLETED' },
    //   orderBy: { createdAt: 'desc' },
    //   select: { createdAt: true },
    // });
    // LÃ³gica complexa para calcular semanas consecutivas...
    this.logger.warn(`[LoyaltyService] getUserBookingStreak nÃ£o implementado. Retornando 0.`);
    return 0; // Placeholder
  }

  // TODO: Implementar verificaÃ§Ã£o de review recente com boa nota.
  // Isso exigiria analisar o histÃ³rico de reviews do usuÃ¡rio.
  private async hasRecentGoodReview(userId: string): Promise<boolean> {
    // Exemplo: Verificar se hÃ¡ uma review >= 4 estrelas nas Ãºltimas 4 semanas
    // const client = await this.prisma.client.findUnique({ where: { userId }, select: { id: true } });
    // if (!client) return false;
    // const fourWeeksAgo = new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000);
    // const recentReview = await this.prisma.review.findFirst({
    //   where: { clientId: client.id, rating: { gte: 4 }, createdAt: { gte: fourWeeksAgo } },
    // });
    // return !!recentReview;
    this.logger.warn(`[LoyaltyService] hasRecentGoodReview nÃ£o implementado. Retornando false.`);
    return false; // Placeholder
  }

  // =========================
  // LÃ³gica de Tiers (Upgrade/Downgrade e Decaimento)
  // =========================

  /**
   * Recalcula o tier de todos os usuÃ¡rios com base nos pontos acumulados nos Ãºltimos 90 dias.
   * Este mÃ©todo deve ser chamado por um job agendado (ex: cron diÃ¡rio/semanal).
   */
  async recalculateUserTiers(): Promise<void> {
    this.logger.log('[LoyaltyService] Iniciando recalculo de tiers dos usuÃ¡rios...');
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

      // Atualiza o tier do usuÃ¡rio (assumindo um campo 'currentTier' no modelo Loyalty)
      // Se 'currentTier' nÃ£o existe no modelo Loyalty, vocÃª precisaria de um novo modelo 'UserTier'
      // ou adicionar o campo ao modelo Loyalty no schema.prisma.
      await this.prisma.loyalty.update({
        where: { userId: loyalty.userId },
        data: {
          // currentTier: newTier, // Descomente se 'currentTier' for adicionado ao modelo Loyalty
          // pointsLast90Days: totalPoints90d, // Descomente se 'pointsLast90Days' for adicionado ao modelo Loyalty
        },
      });
      this.logger.log(`[LoyaltyService] UsuÃ¡rio ${loyalty.userId}: ${totalPoints90d} pontos em 90 dias -> Tier ${newTier}`);
    }
    this.logger.log('[LoyaltyService] Recalculo de tiers concluÃ­do.');
  }

  /**
   * Remove pontos expirados (apÃ³s 180 dias sem uso).
   * Este mÃ©todo deve ser chamado por um job agendado (ex: cron diÃ¡rio).
   * A implementaÃ§Ã£o real depende de como a expiraÃ§Ã£o de pontos Ã© modelada (ex: FIFO, data de expiraÃ§Ã£o por transaÃ§Ã£o).
   */
  async expireOldPoints(): Promise<void> {
    this.logger.log('[LoyaltyService] Iniciando expiraÃ§Ã£o de pontos antigos...');
    const oneHundredEightyDaysAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    // Esta Ã© uma lÃ³gica conceitual. A implementaÃ§Ã£o real requer um modelo de dados mais granular para pontos.
    // Exemplo: Se cada LoyaltyTransaction tivesse um `expiresAt`
    // const expiredTransactions = await this.prisma.loyaltyTransaction.findMany({
    //   where: {
    //     createdAt: { lte: oneHundredEightyDaysAgo },
    //     points: { gt: 0 }, // Pontos ganhos
    //     // E se nÃ£o foram "consumidos" por resgates (lÃ³gica complexa de FIFO)
    //   },
    // });

    // for (const tx of expiredTransactions) {
    //   // Debitar pontos do saldo do usuÃ¡rio
    //   await this.prisma.loyalty.update({
    //     where: { userId: tx.userId },
    //     data: { currentPoints: { decrement: tx.points } },
    //   });
    //   // Registrar transaÃ§Ã£o de expiraÃ§Ã£o
    //   await this.prisma.loyaltyTransaction.create({
    //     data: {
    //       userId: tx.userId,
    //       points: -tx.points,
    //       type: LoyaltyTransactionType.EXPIRED, // Novo tipo de transaÃ§Ã£o no enum
    //       referenceId: tx.id,
    //     },
    //   });
    //   this.logger.log(`[LoyaltyService] ${tx.points} pontos expirados para o usuÃ¡rio ${tx.userId}.`);
    //   // TODO: Notificar o usuÃ¡rio sobre pontos expirados via NotificationsModule
    // }

    this.logger.warn('[LoyaltyService] LÃ³gica de expiraÃ§Ã£o de pontos Ã© complexa e requer modelagem de dados especÃ­fica (ex: FIFO). ImplementaÃ§Ã£o conceitual.');
    this.logger.log('[LoyaltyService] ExpiraÃ§Ã£o de pontos concluÃ­da (conceitual).');
  }
}
