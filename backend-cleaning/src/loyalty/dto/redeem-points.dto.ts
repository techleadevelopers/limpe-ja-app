// src/modules/loyalty/dto/redeem-points.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID } from 'class-validator';

export class RedeemPointsDto {
  @ApiProperty({ description: 'ID da recompensa a ser resgatada.' })
  @IsUUID()
  rewardId: string;

  @ApiProperty({ description: 'Quantidade de pontos a serem resgatados para esta recompensa.' })
  @IsNumber()
  pointsToRedeem: number;

  @ApiProperty({ description: 'Tipo da recompensa (e.g., DISCOUNT_COUPON, GIFT_CARD).', example: 'DISCOUNT_COUPON' })
  @IsString()
  rewardType: string; // Pode ser um enum se você tiver tipos de recompensa fixos
}