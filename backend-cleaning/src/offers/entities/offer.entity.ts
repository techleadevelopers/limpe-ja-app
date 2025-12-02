// src/offers/entities/offer.entity.ts
import { Offer as PrismaOffer, Prisma } from '@prisma/client'; // Importe Prisma
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Adicionado enums para consistência com o backend
export enum OfferTarget {
  GENERAL = 'GENERAL',
  SPECIFIC_SERVICE = 'SPECIFIC_SERVICE',
  SPECIFIC_PROVIDER = 'SPECIFIC_PROVIDER',
  NEW_CLIENTS = 'NEW_CLIENTS',
}

export enum OfferStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

export class Offer implements PrismaOffer {
  @ApiProperty({ description: 'ID da oferta', example: 'uuid-da-oferta' })
  id: string;

  @ApiProperty({
    description: 'Título da oferta',
    example: 'Desconto de 20% na primeira limpeza',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada da oferta',
    example: 'Válido para novos clientes que agendarem uma limpeza padrão.',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Percentual de desconto (se aplicável)',
    example: 20.0,
  })
  discountPercentage: number | null;

  @ApiPropertyOptional({
    description: 'Valor fixo de desconto (se aplicável)',
    example: 50.0,
  })
  fixedDiscountAmount: Prisma.Decimal | null; // CORREÇÃO: Tipo ajustado para Prisma.Decimal

  @ApiProperty({
    description: 'Data de início da validade da oferta',
    example: '2025-01-01T00:00:00.000Z',
  })
  validFrom: Date | null; // CORREÇÃO: Tipo ajustado para Date | null

  @ApiProperty({
    description: 'Data de expiração da oferta',
    example: '2025-12-31T23:59:59.000Z',
  })
  validUntil: Date;

  @ApiPropertyOptional({
    description: 'URL da imagem promocional',
    example: 'https://example.com/offer-image.jpg',
  })
  imageUrl: string | null;

  @ApiProperty({
    enum: OfferTarget,
    description: 'Alvo da oferta (ex: GENERAL, SPECIFIC_PROVIDER)',
    example: OfferTarget.GENERAL,
  })
  target: OfferTarget;

  @ApiPropertyOptional({
    description: 'ID do alvo específico (ex: providerId ou serviceId)',
    example: 'uuid-do-provedor',
  })
  targetId: string | null;

  @ApiProperty({
    enum: OfferStatus,
    description: 'Status da oferta',
    example: OfferStatus.ACTIVE,
  })
  status: OfferStatus;

  @ApiProperty({
    description: 'Data de criação da oferta',
    example: '2025-06-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização da oferta',
    example: '2025-06-01T10:00:00.000Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<PrismaOffer>) {
    Object.assign(this, partial);
  }
}
