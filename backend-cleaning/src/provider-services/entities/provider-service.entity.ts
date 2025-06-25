// src/provider-services/entities/provider-service.entity.ts
import { ProviderService as PrismaProviderService, Prisma } from '@prisma/client'; // <-- Importar Prisma
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Importe as entidades relacionadas se você quiser incluí-las no Swagger
// import { Service } from '../../services/entities/service.entity'; // Assumindo que você tem ServiceEntity
// import { Provider } => '../../providers/entities/provider.entity'; // Assumindo que você tem ProviderEntity

export class ProviderServiceEntity implements PrismaProviderService {
  @ApiProperty({ description: 'ID do serviço oferecido', example: 'uuid-do-servico-oferecido' })
  id: string;

  @ApiProperty({ description: 'ID do provedor que oferece o serviço', example: 'uuid-do-provedor' })
  providerId: string;

  @ApiProperty({ description: 'ID do tipo de serviço (e.g., Limpeza Padrão)', example: 'uuid-do-tipo-servico' })
  serviceId: string;

  @ApiProperty({ description: 'Preço do serviço', example: 150.00 })
  price: Prisma.Decimal; // <-- CORREÇÃO: Mudar para Prisma.Decimal

  @ApiProperty({ description: 'Duração estimada do serviço em minutos', example: 120 })
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Descrição adicional do serviço oferecido', example: 'Limpeza completa para apartamentos de até 80m².' })
  description: string | null;

  // Se você quiser que o Swagger documente as relações, você precisaria de entidades para elas também
  // @ApiProperty({ type: () => Service }) // Se Service for uma classe ServiceEntity
  // service: Service;

  // @ApiProperty({ type: () => Provider }) // Se Provider for uma classe ProviderEntity
  // provider: Provider;

  constructor(partial: Partial<PrismaProviderService>) {
    Object.assign(this, partial);
  }
}