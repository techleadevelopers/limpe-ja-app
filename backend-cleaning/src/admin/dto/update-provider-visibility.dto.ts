import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderVisibilityStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProviderVisibilityDto {
  @ApiProperty({
    enum: ProviderVisibilityStatus,
    description: 'Novo status de visibilidade da vitrine',
    example: ProviderVisibilityStatus.VITRINE_IRREGULAR,
  })
  @IsEnum(ProviderVisibilityStatus)
  visibilityStatus: ProviderVisibilityStatus;

  @ApiPropertyOptional({
    description: 'Motivo opcional para justificar o bloqueio',
    example: 'Selfie muito próxima',
  })
  @IsOptional()
  @IsString()
  visibilityReason?: string;
}
