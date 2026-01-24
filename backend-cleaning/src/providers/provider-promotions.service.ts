import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderPromotionsCenterViewDto } from './dto/provider-promotions-center.dto';
import { ProviderEarningsViewDto } from '../earnings/dto/provider-earnings-view.dto';
import { EarningsResponseDto } from '../earnings/dto/earnings.dto';
import { ProvidersService } from './providers.service';
import { MissionsService } from '../missions/missions.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { EarningsService } from '../earnings/earnings.service';
import { CacheService } from '../cache/cache.service';
import {
  UserRole,
  CouponStatus,
  CouponTarget,
  RewardType,
  Loyalty,
} from '@prisma/client';

@Injectable()
export class ProviderPromotionsService {
  private readonly PROMOTIONS_CACHE_PREFIX = 'provider_promotions_center';
  private readonly PROMOTIONS_CACHE_TTL_SECONDS = 3 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly missionsService: MissionsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly earningsService: EarningsService,
    private readonly cacheService: CacheService,
  ) {}

  async getPromotionsCenter(
    userId: string,
  ): Promise<ProviderPromotionsCenterViewDto> {
    const provider = await this.providersService.findByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Provider não encontrado.');
    }

    const loyaltyPromise = this.resolveCachedLoyaltyRecord(userId);
    const earningsPromise = this.resolveCachedEarningsResponse(userId);
    const now = new Date();
    const [coupons, missions, rewards] = await Promise.all([
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

    const [loyaltyRecord, earningsResponse] = await Promise.all([
      loyaltyPromise,
      earningsPromise,
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

  private getLoyaltyCacheKey(userId: string): string {
    return `${this.PROMOTIONS_CACHE_PREFIX}:loyalty:${userId}`;
  }

  private getEarningsCacheKey(userId: string): string {
    return `${this.PROMOTIONS_CACHE_PREFIX}:earnings:${userId}`;
  }

  private async resolveCachedLoyaltyRecord(
    userId: string,
  ): Promise<Loyalty | null> {
    const cacheKey = this.getLoyaltyCacheKey(userId);
    const cached = await this.cacheService.get<Loyalty | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    const fresh = await this.prisma.loyalty.findUnique({ where: { userId } });
    await this.cacheService.set(cacheKey, fresh, this.PROMOTIONS_CACHE_TTL_SECONDS);
    return fresh;
  }

  private async resolveCachedEarningsResponse(
    userId: string,
  ): Promise<EarningsResponseDto> {
    const cacheKey = this.getEarningsCacheKey(userId);
    const cached = await this.cacheService.get<EarningsResponseDto>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    const fresh = await this.earningsService.getEarnings(userId);
    await this.cacheService.set(cacheKey, fresh, this.PROMOTIONS_CACHE_TTL_SECONDS);
    return fresh;
  }
}
