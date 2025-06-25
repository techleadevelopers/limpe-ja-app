// src/offers/entities/offer.entity.ts
import { Offer as PrismaOffer } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Offer implements PrismaOffer {
  @ApiProperty({ description: 'ID da oferta', example: 'uuid-da-oferta' })
  id: string;

  @ApiProperty({ description: 'Título da oferta', example: 'Desconto de 20% na primeira limpeza' })
  title: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada da oferta', example: 'Válido para novos clientes que agendarem uma limpeza padrão.' })
  description: string | null;

  @ApiPropertyOptional({ description: 'Percentual de desconto (se aplicável)', example: 20.0 })
  discountPercentage: number | null;

  @ApiPropertyOptional({ description: 'Valor fixo de desconto (se aplicável)', example: 50.00 })
  fixedDiscountAmount: number | null;

  @ApiProperty({ description: 'Data de expiração da oferta', example: '2025-12-31T23:59:59.000Z' })
  validUntil: Date;

  @ApiPropertyOptional({ description: 'URL da imagem promocional', example: 'https://example.com/offer-image.jpg' })
  imageUrl: string | null;

  @ApiProperty({ description: 'Data de criação da oferta', example: '2025-06-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização da oferta', example: '2025-06-01T10:00:00.000Z' })
  updatedAt: Date;

  constructor(partial: Partial<PrismaOffer>) {
    Object.assign(this, partial);
  }
}