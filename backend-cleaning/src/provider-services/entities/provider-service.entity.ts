import { ProviderService as PrismaProviderService, Prisma, PricingType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderServiceEntity implements PrismaProviderService {
  @ApiProperty({ description: 'ID do serviço oferecido', example: 'uuid-do-servico-oferecido' })
  id: string;

  @ApiProperty({ description: 'ID do provedor que oferece o serviço', example: 'uuid-do-provedor' })
  providerId: string;

  @ApiProperty({ description: 'ID do tipo de serviço (e.g., Limpeza Padrão)', example: 'uuid-do-tipo-servico' })
  serviceId: string;

  @ApiPropertyOptional({ description: 'Preço do serviço (se pricingType for FIXED_PRICE)', example: 150.00 })
  price: Prisma.Decimal | null; // CORRIGIDO: Agora é opcional

  @ApiPropertyOptional({ description: 'Preço por hora (se pricingType for HOURLY)', example: 45.00 })
  pricePerHour: Prisma.Decimal | null; // ADICIONADO: Campo que estava faltando

  @ApiPropertyOptional({ description: 'Duração estimada do serviço em minutos', example: 120 })
  durationMinutes: number | null; // CORRIGIDO: Agora é opcional

  @ApiPropertyOptional({ description: 'Descrição adicional do serviço oferecido', example: 'Limpeza completa para apartamentos de até 80m².' })
  description: string | null;

  @ApiProperty({ description: 'Data de criação do serviço oferecido', example: '2023-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do serviço oferecido', example: '2023-01-01T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'Tipo de precificação do serviço', enum: PricingType, example: PricingType.FIXED_PRICE })
  pricingType: PricingType;

  @ApiPropertyOptional({ description: 'Preço por metro quadrado (se pricingType for BY_SIZE)', example: 10.50 })
  pricePerSquareMeter: Prisma.Decimal | null;

  @ApiPropertyOptional({ description: 'Preço por cômodo (se pricingType for BY_SIZE)', example: 50.00 })
  pricePerRoom: Prisma.Decimal | null;

  // Propriedades adicionais do modelo Prisma, se houver (ex: bookings, subscriptions)
  // Para a entidade, geralmente mapeamos apenas os campos diretos.
  // Se necessário, adicione aqui as relações, mas para fins de DTO/entidade simples,
  // os campos primitivos e enums são o foco.
  // bookings: any[]; // Exemplo, se você precisar mapear relações aqui
  // subscriptions: any[]; // Exemplo

  constructor(partial: Partial<PrismaProviderService>) {
    Object.assign(this, partial);
  }
}