import { Prisma } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderServiceEntity {
  @ApiProperty({
    description: 'ID do servico oferecido',
    example: 'uuid-do-servico',
  })
  id: string;

  @ApiProperty({
    description: 'ID do provedor que oferece o servico',
    example: 'uuid-provedor',
  })
  providerId: string;

  @ApiProperty({
    description: 'ID do tipo de servico',
    example: 'uuid-tipo-servico',
  })
  serviceId: string;

  @ApiProperty({ description: 'Preco por hora', example: 45.0 })
  pricePerHour: Prisma.Decimal;

  @ApiPropertyOptional({
    description: 'Duracao estimada em minutos',
    example: 180,
  })
  durationMinutes: number | null;

  @ApiPropertyOptional({
    description: 'Descricao adicional do servico',
    example: 'Limpeza completa para ate 80m2',
  })
  description: string | null;

  @ApiProperty({ description: 'Indica se o servico precisa de revisao manual' })
  needsReview: boolean;

  @ApiProperty({
    description: 'Data de criacao',
    example: '2023-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualizacao',
    example: '2023-01-01T10:00:00.000Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<ProviderServiceEntity>) {
    Object.assign(this, partial);
  }
}
