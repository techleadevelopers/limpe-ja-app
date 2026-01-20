import { ApiProperty } from '@nestjs/swagger';
import { CouponStatus } from '@prisma/client';
import { MissionViewDto } from '../../missions/dto/mission-view.dto';
import { ProviderEarningsViewDto } from '../../earnings/dto/provider-earnings-view.dto';

class ProviderCouponDto {
  @ApiProperty({
    description: 'Código público do cupom',
    example: 'PROV-10OFF',
  })
  code: string;

  @ApiProperty({
    description: 'Descrição da promoção',
    example: '10% off exclusivo para você',
  })
  description?: string;

  @ApiProperty({ description: 'Valor do desconto', example: 10 })
  value: number;

  @ApiProperty({ description: 'Tipo do desconto', example: 'PERCENT' })
  valueType: 'PERCENT' | 'FIXED';

  @ApiProperty({
    description: 'Data inicial de validade (ISO)',
    example: '2025-12-01T00:00:00Z',
  })
  validFrom: string;

  @ApiProperty({
    description: 'Data final de validade (ISO)',
    example: '2025-12-31T23:59:59Z',
  })
  validUntil: string;

  @ApiProperty({
    description: 'Status público do cupom',
    example: CouponStatus.ACTIVE,
  })
  status: CouponStatus;
}

class LoyaltyRewardDto {
  @ApiProperty({
    description: 'ID interno da recompensa',
    example: 'reward-abc',
  })
  rewardId: string;

  @ApiProperty({
    description: 'Texto descritivo da recompensa',
    example: 'Cupom de R$ 15',
  })
  description: string;

  @ApiProperty({ description: 'Custo em pontos', example: 500 })
  costPoints: number;

  @ApiProperty({ description: 'Tipo da recompensa', example: 'COUPON' })
  rewardType: string;
}

class LoyaltySummaryDto {
  @ApiProperty({
    description: 'Saldo atual de pontos do provider',
    example: 1200,
  })
  currentPoints: number;

  @ApiProperty({
    description: 'Recompensas ativas elegíveis para resgate',
    type: [LoyaltyRewardDto],
  })
  availableRewards: LoyaltyRewardDto[];
}

export class ProviderPromotionsCenterViewDto {
  @ApiProperty({
    description:
      'Promoções/cupons ativos emitidos com target SPECIFIC_PROVIDER',
    type: [ProviderCouponDto],
  })
  coupons: ProviderCouponDto[];

  @ApiProperty({
    description:
      'Missões relevantes para o provider com progresso e recompensa',
    type: [MissionViewDto],
  })
  missions: MissionViewDto[];

  @ApiProperty({
    description: 'Resumo de fidelidade do provider',
    type: LoyaltySummaryDto,
  })
  loyalty: LoyaltySummaryDto;

  @ApiProperty({
    description: 'Flags de ganhos fornecidas pelo EarningsService',
    type: ProviderEarningsViewDto,
  })
  earnings: ProviderEarningsViewDto;
}
