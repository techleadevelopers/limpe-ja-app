// src/modules/loyalty/loyalty.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddPointsDto } from './dto/add-points.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { LoyaltyTransactionType } from '@prisma/client'; // Assumindo que você terá um enum no Prisma para tipos de transação de fidelidade
import { CouponsService } from '../coupons/coupons.service'; // Para resgate de cupons

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private prisma: PrismaService,
    private couponsService: CouponsService, // Injetar CouponsService para resgate
  ) {}

  /**
   * Adiciona pontos ao saldo de fidelidade de um usuário.
   * @param dto AddPointsDto contendo userId, points e type.
   */
  async addPoints(dto: AddPointsDto): Promise<number> {
    const { userId, points, type, referenceId } = dto;
    this.logger.log(`Adicionando ${points} pontos para o usuário ${userId} do tipo ${type}.`);

    if (points <= 0) {
      throw new BadRequestException('Pontos a serem adicionados devem ser maiores que zero.');
    }

    // Multiplicadores temporários (exemplo)
    let finalPoints = points;
    if (type === LoyaltyTransactionType.REFERRAL && new Date().getMonth() === 7) { // Ex: Agosto, mês de promoção de indicação
      finalPoints = points * 2; // Multiplicador x2 para indicações em agosto
      this.logger.log(`Multiplicador aplicado: Pontos de indicação dobrados para ${finalPoints}.`);
    }

    const userLoyalty = await this.prisma.loyalty.upsert({
      where: { userId },
      update: {
        currentPoints: {
          increment: finalPoints,
        },
      },
      create: {
        userId,
        currentPoints: finalPoints,
      },
    });

    await this.prisma.loyaltyTransaction.create({
      data: {
        userId,
        points: finalPoints,
        type,
        referenceId, // Armazena o ID do serviço, avaliação, etc.
      },
    });

    this.logger.log(`Usuário ${userId} agora tem ${userLoyalty.currentPoints} pontos.`);
    return userLoyalty.currentPoints;
  }

  /**
   * Resgata pontos do saldo de fidelidade de um usuário por uma recompensa.
   * @param userId O ID do usuário que está resgatando os pontos.
   * @param redeemData RedeemPointsDto contendo detalhes da recompensa a ser resgatada.
   */
  // CORREÇÃO: Altere a assinatura do método para aceitar userId e redeemData separadamente
  async redeemPoints(userId: string, redeemData: RedeemPointsDto): Promise<boolean> {
    // CORREÇÃO: Remova 'userId' da desestruturação do 'redeemData', pois ele já é um parâmetro
    const { pointsToRedeem, rewardType, rewardId } = redeemData;
    this.logger.log(`Tentando resgatar ${pointsToRedeem} pontos para o usuário ${userId} para recompensa do tipo ${rewardType}.`);

    if (pointsToRedeem <= 0) {
      throw new BadRequestException('Pontos a serem resgatados devem ser maiores que zero.');
    }

    const userLoyalty = await this.prisma.loyalty.findUnique({ where: { userId } });

    if (!userLoyalty || userLoyalty.currentPoints < pointsToRedeem) {
      throw new BadRequestException('Pontos insuficientes para realizar o resgate.');
    }

    // Lógica específica de resgate
    if (rewardType === 'DISCOUNT_COUPON') {
      // Exemplo: Criar um cupom de desconto dinamicamente ou aplicar um já existente
      // Isso dependerá da sua implementação de cupons.
      // Você pode ter um "catálogo" de recompensas no DB
      // CORREÇÃO: Certifique-se de que 'rewardId' não seja undefined se 'rewardType' for 'DISCOUNT_COUPON'
      if (!rewardId) {
          throw new BadRequestException('ID da recompensa é obrigatório para o tipo DISCOUNT_COUPON.');
      }
      const reward = await this.prisma.reward.findUnique({ where: { id: rewardId } }); // Exemplo de busca de recompensa
      // CORREÇÃO: Adicione uma verificação para 'reward.costPoints' existir
      if (!reward || reward.costPoints === undefined || reward.costPoints !== pointsToRedeem) {
          throw new BadRequestException('Recompensa inválida ou custo de pontos incorreto.');
      }
      
      // Aqui você chamaria seu CouponsService para gerar/aplicar o desconto
      // Ex: const newCoupon = await this.couponsService.generateDiscountCoupon(userId, reward.value);
      // Ou, se for um cupom predefinido:
      // const couponApplied = await this.couponsService.applyCouponToUser(reward.couponCode, userId);
      
      // Por simplicidade, vamos apenas simular a aplicação do cupom
      this.logger.log(`Simulando aplicação de cupom ${rewardId} para o usuário ${userId}.`);
      // Lógica real de integração com CouponsService para criar/ativar o cupom para o usuário
      // await this.couponsService.createPersonalizedCoupon(userId, reward.value, reward.type);

    } else {
      throw new BadRequestException('Tipo de recompensa não suportado.');
    }

    // Decrementa os pontos após o resgate bem-sucedido
    await this.prisma.loyalty.update({
      where: { userId },
      data: {
        currentPoints: {
          decrement: pointsToRedeem,
        },
      },
    });

    await this.prisma.loyaltyTransaction.create({
      data: {
        userId,
        points: -pointsToRedeem, // Pontos negativos para resgate
        type: LoyaltyTransactionType.REDEEM,
        referenceId: rewardId, // ID da recompensa resgatada
      },
    });

    this.logger.log(`Resgate de ${pointsToRedeem} pontos bem-sucedido para o usuário ${userId}.`);
    return true;
  }

  /**
   * Busca o saldo de pontos atual de um usuário.
   * @param userId ID do usuário.
   */
  async getUserPoints(userId: string): Promise<number> {
    const userLoyalty = await this.prisma.loyalty.findUnique({ where: { userId } });
    return userLoyalty ? userLoyalty.currentPoints : 0;
  }

  /**
   * Busca o histórico de transações de pontos de um usuário.
   * @param userId ID do usuário.
   */
  async getLoyaltyHistory(userId: string) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}