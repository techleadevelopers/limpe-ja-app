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
   * Adiciona pontos ao saldo de fidelidade de um usuário e registra a transação.
   */
  async addPoints(dto: AddPointsDto): Promise<number> {
    const { userId, points, type, referenceId } = dto;

    if (!userId) throw new BadRequestException('userId é obrigatório.');
    if (!points || points <= 0) throw new BadRequestException('Pontos devem ser > 0.');

    // Exemplo de campanha: dobrar pontos de indicação em agosto
    let finalPoints = points;
    if (type === LoyaltyTransactionType.REFERRAL && new Date().getMonth() === 7) {
      finalPoints = points * 2;
      this.logger.log(`[addPoints] Campanha ativa: pontos de indicação dobrados (${finalPoints}).`);
    }

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

    this.logger.log(`[addPoints] ${finalPoints} pontos creditados ao usuário ${userId}. Saldo: ${loyalty.currentPoints}`);
    return loyalty.currentPoints;
  }

  /**
   * Resgata pontos por uma recompensa.
   * Para rewardType === 'DISCOUNT_COUPON', gera um cupom pessoal (uso único, 30 dias).
   */
  async redeemPoints(userId: string, redeemData: RedeemPointsDto): Promise<{
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
      throw new BadRequestException('Tipo de recompensa não suportado no momento.');
    }
    if (!rewardId) {
      throw new BadRequestException('rewardId é obrigatório para DISCOUNT_COUPON.');
    }

    // Verifica saldo
    const loyalty = await this.prisma.loyalty.findUnique({ where: { userId } });
    if (!loyalty || loyalty.currentPoints < pointsToRedeem) {
      throw new BadRequestException('Pontos insuficientes para resgate.');
    }

    // Busca a recompensa (catálogo)
    const reward = await this.prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) {
      throw new NotFoundException('Recompensa inválida ou inativa.');
    }
    if (reward.costPoints !== pointsToRedeem) {
      throw new BadRequestException('Custo de pontos informado não corresponde ao da recompensa.');
    }

    // Determina tipo de desconto baseado no valor:
    // value <= 1 => percentual (ex.: 0.20 = 20%); value > 1 => valor fixo em moeda.
    const isPercent = new Prisma.Decimal(reward.value).lte(1);
    const valueType = isPercent ? 'PERCENT' : 'FIXED';

    // Prepara o cupom pessoal (uso único, 30 dias)
    const now = new Date();
    const validFrom = now.toISOString();
    const validUntilDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const validUntil = validUntilDate.toISOString();

    // Código único e “difícil de adivinhar”
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `POINTS-${random}`;

    // Cria o cupom via service (mantém separação de responsabilidades)
    await this.couponsService.create({
      code,
      type: valueType as any, // CouponType compatível no service
      value: Number(new Prisma.Decimal(reward.value).toFixed(2)),
      validFrom,
      validUntil,
      maxUses: 1,
      target: 'GENERAL' as any, // Pode-se evoluir com alvo específico (serviço/provedor) no futuro
      description: reward.description ?? 'Cupom resgatado com pontos de fidelidade',
      isActive: true,
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

    this.logger.log(`[redeemPoints] Usuário ${userId} resgatou ${pointsToRedeem} pontos. Cupom: ${code} (expira em ${validUntil}).`);

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
}
