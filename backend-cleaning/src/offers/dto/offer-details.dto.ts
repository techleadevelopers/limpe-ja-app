// src/offers/dto/offer-details.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  Offer as PrismaOffer,
  OfferStatus,
  OfferTarget,
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * DTO de resposta padronizada para ofertas.
 * Alinhado com o modelo do Prisma para evitar conflitos de enumeração.
 */
export class OfferDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty({ enum: OfferStatus })
  status: OfferStatus;

  @ApiProperty({ enum: OfferTarget })
  target: OfferTarget;

  @ApiProperty({ required: false, nullable: true })
  targetId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  validFrom?: Date | null;

  @ApiProperty()
  validUntil: Date;

  @ApiProperty({ required: false, nullable: true, type: Number })
  discountPercentage?: number | null;

  @ApiProperty({ required: false, nullable: true, type: Number })
  fixedDiscountAmount?: Prisma.Decimal | null;

  @ApiProperty({ required: false, nullable: true })
  imageUrl?: string | null;

  constructor(o: PrismaOffer) {
    const record: Record<string, unknown> = o;
    const getString = (value: unknown): string | null =>
      typeof value === 'string' ? value : null;
    const getDate = (value: unknown): Date | null => {
      if (value instanceof Date) return value;
      if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    };
    const getDecimal = (value: unknown): Prisma.Decimal | null =>
      value instanceof Decimal
        ? value
        : typeof value === 'number'
          ? new Decimal(value)
          : null;
    const getNumber = (value: unknown): number | null =>
      typeof value === 'number' ? value : null;

    this.id = o.id;
    const nameFallback = getString(record['name']) || '';
    this.title = getString(o.title) || nameFallback;
    this.description = getString(record['description']);
    this.status = o.status;
    this.target = o.target;
    this.targetId = getString(record['targetId']);
    this.createdAt = o.createdAt;
    this.updatedAt = o.updatedAt;
    this.validFrom = getDate(record['validFrom']);
    this.validUntil = getDate(record['validUntil']) ?? o.validUntil;
    this.discountPercentage = getNumber(record['discountPercentage']);
    this.fixedDiscountAmount = getDecimal(record['fixedDiscountAmount']);
    this.imageUrl = getString(record['imageUrl']);
  }
}
