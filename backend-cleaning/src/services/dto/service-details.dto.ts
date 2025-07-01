// src/services/dto/service-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Service, Prisma } from '@prisma/client';
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

  @ApiProperty({ description: 'Data de criação do serviço', example: '2023-01-01T10:00:00.000Z' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Data da última atualização do serviço', example: '2023-01-01T10:00:00.000Z' })
  @IsString()
  updatedAt: string;

  @ApiProperty({ description: 'Preço associado a este serviço', example: 75.50 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Duração estimada em minutos (se for um ProviderService)', example: 120 })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;


  constructor(data: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    price: Prisma.Decimal | number;
    durationMinutes?: number;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || null;
    this.icon = data.icon || null;

    this.createdAt = data.createdAt instanceof Date ? data.createdAt.toISOString() : data.createdAt;
    this.updatedAt = data.updatedAt instanceof Date ? data.updatedAt.toISOString() : data.updatedAt;

    this.price = typeof data.price === 'object' && 'toNumber' in data.price
      ? data.price.toNumber()
      : data.price;

    this.durationMinutes = data.durationMinutes;
  }
}