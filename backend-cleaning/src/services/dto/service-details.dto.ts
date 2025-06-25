// src/services/dto/service-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Service, Prisma } from '@prisma/client'; // <-- Importar Prisma
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class ServiceDetailsDto {
  @ApiProperty({ description: 'ID do tipo de serviço', example: 'uuid-do-servico' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Nome do tipo de serviço', example: 'Limpeza Padrão' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do tipo de serviço', example: 'Limpeza básica de ambientes residenciais.' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Nome do arquivo do ícone para o serviço', example: 'residencial.png' })
  @IsOptional()
  @IsString()
  icon?: string | null;

  // Estas propriedades são OBRIGATÓRIAS quando ServiceDetailsDto é construído via ProviderDetailsDto
  // Elas vêm do Service associado ao ProviderService
  @ApiProperty({ description: 'Data de criação do serviço', example: '2023-01-01T10:00:00.000Z' })
  @IsString()
  createdAt: string; // Vem como string de toISOString()

  @ApiProperty({ description: 'Data da última atualização do serviço', example: '2023-01-01T10:00:00.000Z' })
  @IsString()
  updatedAt: string; // Vem como string de toISOString()

  // Esta propriedade é OBRIGATÓRIA quando ServiceDetailsDto é construído via ProviderDetailsDto
  // Ela vem do ProviderService e já é convertida para number
  @ApiProperty({ description: 'Preço associado a este serviço (do ProviderService)', example: 75.50 })
  @IsNumber()
  price: number; // Já é number após toNumber() em ProviderDetailsDto

  // durationMinutes não é mapeado em ProviderDetailsDto, então pode ser opcional aqui
  @ApiPropertyOptional({ description: 'Duração estimada em minutos (se for um ProviderService)', example: 120 })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;


  // O construtor é importante para quando você cria um ServiceDetailsDto diretamente
  // ou quando ele é instanciado por um framework (como NestJS para validação).
  // Ele precisa ser flexível para aceitar tanto um Service do Prisma quanto um ProviderService.
  constructor(data: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    createdAt: Date | string; // Pode ser Date (do Service) ou string (de toISOString)
    updatedAt: Date | string; // Pode ser Date (do Service) ou string (de toISOString)
    price: Prisma.Decimal | number; // Pode ser Decimal (do Service/ProviderService) ou number
    durationMinutes?: number;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || null;
    this.icon = data.icon || null;

    // Converte Date para string se necessário
    this.createdAt = typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toISOString();
    this.updatedAt = typeof data.updatedAt === 'string' ? data.updatedAt : data.updatedAt.toISOString();

    // Converte Prisma.Decimal para number se necessário
    this.price = typeof data.price === 'object' && 'toNumber' in data.price
      ? data.price.toNumber()
      : data.price;

    this.durationMinutes = data.durationMinutes;
  }
}