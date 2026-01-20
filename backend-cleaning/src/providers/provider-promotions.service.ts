import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderPromotionsCenterViewDto } from './dto/provider-promotions-center.dto';
import { ProviderEarningsViewDto } from '../earnings/dto/provider-earnings-view.dto';
import { ProvidersService } from './providers.service';
import { MissionsService } from '../missions/missions.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { EarningsService } from '../earnings/earnings.service';
import {
  UserRole,
  CouponStatus,
  CouponTarget,
  RewardType,
} from '@prisma/client';

@Injectable()
export class ProviderPromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly missionsService: MissionsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly earningsService: EarningsService,
  ) {}

  async getPromotionsCenter(
    userId: string,
  ): Promise<ProviderPromotionsCenterViewDto> {
    const provider = await this.providersService.findByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provider não encontrado.');
    }

    const now = new Date();
    const [coupons, missions, loyaltyRecord, earningsResponse, rewards] =
      await Promise.all([
        this.prisma.coupon.findMany({
          where: {
            target: CouponTarget.SPECIFIC_PROVIDER,
            targetId: provider.id,
            status: CouponStatus.ACTIVE,
            validFrom: { lte: now },
            validUntil: { gte: now },
          },
          orderBy: { validUntil: 'asc' },
        }),
        this.missionsService.getMyMissions(userId, UserRole.PROVIDER),
        this.prisma.loyalty.findUnique({ where: { userId } }),
        this.earningsService.getEarnings(userId),
        this.prisma.reward.findMany({
          where: { isActive: true },
          select: {
            id: true,
            description: true,
            costPoints: true,
            type: true,
          },
        }),
      ]);

    const currentPoints = loyaltyRecord?.currentPoints ?? 0;

    return {
      coupons: coupons.map((coupon) => ({
        code: coupon.code,
        description: coupon.description ?? coupon.code,
        value: Number(coupon.value),
        valueType: coupon.valueType,
        validFrom: coupon.validFrom.toISOString(),
        validUntil: coupon.validUntil.toISOString(),
        status: coupon.status,
      })),
      missions,
      loyalty: {
        currentPoints,
        availableRewards: rewards.map((reward) => ({
          rewardId: reward.id,
          description: reward.description ?? reward.type,
          costPoints: reward.costPoints,
          rewardType: reward.type,
        })),
      },
      earnings: earningsResponse.earningsView,
    };
  }
}
