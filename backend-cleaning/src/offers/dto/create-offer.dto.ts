// src/offers/dto/create-offer.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min, Max, IsEnum } from 'class-validator';
import { OfferStatus, OfferTarget } from '../entities/offer.entity'; // Importar enums

export class CreateOfferDto {
  @ApiProperty({ description: 'Título da oferta', example: 'Desconto de 20% na primeira limpeza' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada da oferta', example: 'Válido para novos clientes que agendarem uma limpeza padrão.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Percentual de desconto (entre 0 e 100)', example: 20.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Valor fixo de desconto', example: 50.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedDiscountAmount?: number;

  @ApiProperty({ description: 'Data de expiração da oferta (ISO 8601)', example: '2025-12-31T23:59:59.000Z' })
  @IsDateString()
  validUntil: string; // Usar string e converter para Date no serviço

  @ApiPropertyOptional({ description: 'URL da imagem promocional', example: 'https://example.com/offer-image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ enum: OfferTarget, description: 'Alvo da oferta (ex: GENERAL, SPECIFIC_PROVIDER)', example: OfferTarget.GENERAL })
  @IsEnum(OfferTarget)
  @IsNotEmpty() // Adicionado para garantir que o target não seja vazio
  target: OfferTarget;

  @ApiPropertyOptional({ description: 'ID do alvo específico (ex: providerId ou serviceId)', example: 'uuid-do-provedor' })
  @IsOptional()
  @IsString()
  targetId?: string | null;

  @ApiPropertyOptional({ enum: OfferStatus, description: 'Status da oferta', example: OfferStatus.ACTIVE })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;
}