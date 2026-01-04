// src/providers/dto/provider-service-offering.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceDetailsDto } from '../../services/dto/service-details.dto';
import { Prisma } from '@prisma/client'; // <-- ADICIONADO: Importar Prisma aqui!

export class ProviderServiceOfferingDto {
  @ApiProperty({
    description: 'ID da oferta de serviço do provedor',
    example: 'uuid-do-providerservice',
  })
  @IsString()
  id: string;

  @ApiProperty({ description: 'ID do provedor', example: 'uuid-do-provedor' })
  @IsString()
  providerId: string;

  @ApiProperty({
    description: 'ID do serviço base (categoria)',
    example: 'uuid-do-servico-base',
  })
  @IsString()
  serviceId: string;

  @ApiProperty({
    description: 'Preço que o provedor cobra por este serviço',
    example: 150.0,
  })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({
    description: 'Preço por hora declarado pelo provedor',
    example: 120.0,
  })
  @IsOptional()
  @IsNumber()
  pricePerHour?: number;

  @ApiPropertyOptional({
    description: 'Duração do serviço em minutos',
    example: 120,
  })
  @IsOptional()
  @IsInt()
  durationMinutes?: number | null;

  @ApiPropertyOptional({
    description: 'Descrição específica do provedor para este serviço',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    type: () => ServiceDetailsDto,
    description: 'Detalhes do serviço base (categoria)',
  })
  @ValidateNested()
  @Type(() => ServiceDetailsDto)
  service: ServiceDetailsDto;

  @ApiProperty({
    description: 'Data de criação',
    example: '2023-01-01T10:00:00.000Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2023-01-01T10:00:00.000Z',
  })
  @IsString()
  updatedAt: string;

  constructor(source: any) {
    // `source` será um ProviderService & { service: Service }
    this.id = source.id;
    this.providerId = source.providerId;
    this.serviceId = source.serviceId;
    // Lógica defensiva para price: pode vir do DB como Prisma.Decimal, mas precisa ser number
    this.price =
      source.price instanceof Prisma.Decimal
        ? source.price.toNumber()
        : source.price;
    this.durationMinutes = source.durationMinutes;
    this.description = source.description;
    this.pricePerHour =
      source.pricePerHour instanceof Prisma.Decimal
        ? source.pricePerHour.toNumber()
        : source.pricePerHour;

    // Garante que service existe antes de tentar instanciar.
    // Se ServiceDetailsDto pode aceitar null (se service for opcional),
    // ou se o serviço não for obrigatório, pode ser `source.service ? new ServiceDetailsDto(source.service) : null;`
    // Como a interface ProviderServiceOffering tem `service: ServiceDetailsDto` (obrigatório),
    // ele deve ser sempre instanciado ou um erro de tipagem ocorrerá.
    // Assumimos que source.service virá sempre.
    this.service = new ServiceDetailsDto(source.service);

    // ** CORREÇÃO APLICADA AQUI para createdAt e updatedAt **
    let formattedCreatedAt: string;
    if (source.createdAt instanceof Date) {
      formattedCreatedAt = source.createdAt.toISOString();
    } else if (typeof source.createdAt === 'string') {
      formattedCreatedAt = source.createdAt;
    } else {
      // Fallback seguro: se o tipo for inesperado, usa a data atual
      console.warn(
        `[ProviderServiceOfferingDto] Tipo inesperado para createdAt: ${typeof source.createdAt}. Usando data atual como fallback.`,
      );
      formattedCreatedAt = new Date().toISOString();
    }
    this.createdAt = formattedCreatedAt;

    let formattedUpdatedAt: string;
    if (source.updatedAt instanceof Date) {
      formattedUpdatedAt = source.updatedAt.toISOString();
    } else if (typeof source.updatedAt === 'string') {
      formattedUpdatedAt = source.updatedAt;
    } else {
      // Fallback seguro: se o tipo for inesperado, usa a data atual
      console.warn(
        `[ProviderServiceOfferingDto] Tipo inesperado para updatedAt: ${typeof source.updatedAt}. Usando data atual como fallback.`,
      );
      formattedUpdatedAt = new Date().toISOString();
    }
    this.updatedAt = formattedUpdatedAt;

    // console.log(`DEBUG ProviderServiceOfferingDto: Source:`, source); // Pode reativar para depuração
    // console.log(`DEBUG ProviderServiceOfferingDto: createdAt type: ${typeof source.createdAt}, value:`, source.createdAt); // Pode reativar para depuração
  }
}
