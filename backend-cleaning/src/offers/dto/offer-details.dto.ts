// src/offers/dto/offer-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Offer } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDate, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class OfferDetailsDto {
  @ApiProperty({ description: 'ID único da oferta', example: 'uuid-da-oferta' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Título da oferta', example: 'Desconto de 20% na primeira limpeza' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada da oferta', example: 'Válido para novos clientes que agendarem uma limpeza padrão.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Percentual de desconto', example: 20.0 })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Valor fixo de desconto', example: 50.00 })
  @IsOptional()
  @IsNumber()
  fixedDiscountAmount?: number;

  @ApiProperty({ description: 'Data de expiração da oferta', example: '2025-12-31T23:59:59.000Z' })
  @IsDate()
  @Type(() => Date)
  validUntil: Date;

  @ApiPropertyOptional({ description: 'URL da imagem promocional', example: 'https://example.com/offer-image.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Data de criação da oferta', example: '2023-01-01T10:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização da oferta', example: '2023-01-01T10:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  constructor(offer: Offer) {
    this.id = offer.id;
    this.title = offer.title;
    this.description = offer.description;
    this.discountPercentage = offer.discountPercentage;
    this.fixedDiscountAmount = offer.fixedDiscountAmount;
    this.validUntil = offer.validUntil;
    this.imageUrl = offer.imageUrl;
    this.createdAt = offer.createdAt;
    this.updatedAt = offer.updatedAt;
  }
}