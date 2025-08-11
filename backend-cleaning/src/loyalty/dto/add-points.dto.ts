// src/modules/loyalty/dto/add-points.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsEnum } from 'class-validator';
import { LoyaltyTransactionType } from '@prisma/client'; // Assumindo que você terá um enum no Prisma para tipos de transação de fidelidade

export class AddPointsDto {
  @ApiProperty({ description: 'ID do usuário que receberá os pontos.' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Quantidade de pontos a serem adicionados.' })
  @IsNumber()
  points: number;

  @ApiProperty({
    description: 'Tipo de transação de fidelidade (e.g., SERVICE_COMPLETED, REVIEW_SUBMITTED, REFERRAL).',
    enum: LoyaltyTransactionType,
  })
  @IsEnum(LoyaltyTransactionType)
  type: LoyaltyTransactionType;

  @ApiProperty({ description: 'ID da entidade de referência (e.g., bookingId, reviewId, referralId).', required: false })
  @IsUUID()
  @IsString()
  referenceId?: string;
}