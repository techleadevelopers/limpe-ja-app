// src/providers/dto/provider-availability-summary.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ProviderAvailabilitySummaryDto {
  @ApiProperty({
    description:
      'Quantidade de provedores com endereço dentro do raio solicitado.',
    example: 28,
  })
  availableProvidersCount: number;

  @ApiProperty({
    description: 'Indica se a proximidade está com alta demanda recente.',
    example: true,
  })
  busy: boolean;
}
