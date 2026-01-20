import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderVisibilityStatus } from '@prisma/client';

export class ProviderVisibilityDto {
  @ApiProperty({
    enum: ProviderVisibilityStatus,
    description: 'Status atual da vitrine do provedor',
  })
  visibilityStatus: ProviderVisibilityStatus;

  @ApiPropertyOptional({
    description: 'Motivo informado para o bloqueio ou rejeição',
    example: 'Selfie informal',
  })
  visibilityReason?: string | null;

  @ApiPropertyOptional({
    description: 'Data e hora da última atualização do status de visibilidade',
    example: '2025-01-01T12:00:00.000Z',
  })
  visibilityUpdatedAt?: string | null;

  constructor(params: {
    visibilityStatus: ProviderVisibilityStatus;
    visibilityReason?: string | null;
    visibilityUpdatedAt?: string | null;
  }) {
    this.visibilityStatus = params.visibilityStatus;
    this.visibilityReason = params.visibilityReason ?? null;
    this.visibilityUpdatedAt = params.visibilityUpdatedAt ?? null;
  }
}
