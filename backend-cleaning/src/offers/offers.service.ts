import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma, // Importe Prisma para usar Prisma.Decimal
  Offer as PrismaOffer,
  OfferTarget,
  OfferStatus,
} from '@prisma/client';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOfferDto): Promise<PrismaOffer> {
    // Validações de consistência
    if (dto.discountPercentage != null && dto.fixedDiscountAmount != null) {
      throw new BadRequestException(
        'Informe apenas um tipo de desconto: "discountPercentage" OU "fixedDiscountAmount".',
      );
    }
    if (
      dto.discountPercentage != null &&
      (dto.discountPercentage < 0 || dto.discountPercentage > 100)
    ) {
      throw new BadRequestException(
        'discountPercentage deve estar entre 0 e 100.',
      );
    }
    if (dto.fixedDiscountAmount != null && dto.fixedDiscountAmount < 0) {
      throw new BadRequestException(
        'fixedDiscountAmount não pode ser negativo.',
      );
    }
    // Removido o check !dto.validUntil, pois é obrigatório no DTO e no schema (validFrom é opcional)

    const target: OfferTarget =
      (dto.target as OfferTarget) ?? OfferTarget.GENERAL;
    if (target !== OfferTarget.GENERAL && !dto.targetId) {
      throw new BadRequestException(
        'targetId é obrigatório para ofertas específicas.',
      );
    }

    const status: OfferStatus =
      (dto.status as OfferStatus) ?? OfferStatus.ACTIVE;

    return this.prisma.offer.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        target,
        targetId: dto.targetId ?? null,
        status,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null, // CORREÇÃO: Adicionado validFrom
        validUntil: new Date(dto.validUntil),
        discountPercentage: dto.discountPercentage ?? null,
        fixedDiscountAmount:
          dto.fixedDiscountAmount != null
            ? new Prisma.Decimal(dto.fixedDiscountAmount)
            : null, // CORREÇÃO: Converte para Prisma.Decimal
        imageUrl: dto.imageUrl ?? null,
      },
    });
  }

  async findAll(): Promise<PrismaOffer[]> {
    return this.prisma.offer.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<PrismaOffer | null> {
    return this.prisma.offer.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateOfferDto): Promise<PrismaOffer> {
    const existing = await this.prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Oferta com ID "${id}" não encontrada.`);
    }

    if (dto.discountPercentage != null && dto.fixedDiscountAmount != null) {
      throw new BadRequestException(
        'Informe apenas um tipo de desconto: "discountPercentage" OU "fixedDiscountAmount".',
      );
    }
    if (
      dto.discountPercentage != null &&
      (dto.discountPercentage < 0 || dto.discountPercentage > 100)
    ) {
      throw new BadRequestException(
        'discountPercentage deve estar entre 0 e 100.',
      );
    }
    if (dto.fixedDiscountAmount != null && dto.fixedDiscountAmount < 0) {
      throw new BadRequestException(
        'fixedDiscountAmount não pode ser negativo.',
      );
    }
    if (
      dto.target &&
      dto.target !== OfferTarget.GENERAL &&
      !dto.targetId &&
      !existing.targetId
    ) {
      throw new BadRequestException(
        'targetId é obrigatório para ofertas específicas.',
      );
    }

    return this.prisma.offer.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        target: (dto.target as OfferTarget) ?? undefined,
        targetId:
          dto.target === OfferTarget.GENERAL
            ? null
            : (dto.targetId ?? undefined),
        status: (dto.status as OfferStatus) ?? undefined,
        validFrom:
          dto.validFrom !== undefined
            ? dto.validFrom
              ? new Date(dto.validFrom)
              : null
            : undefined, // CORREÇÃO: Adicionado validFrom
        validUntil:
          dto.validUntil !== undefined ? new Date(dto.validUntil) : undefined, // Permite definir explicitamente para null ou undefined
        discountPercentage:
          dto.discountPercentage !== undefined
            ? dto.discountPercentage
            : undefined,
        fixedDiscountAmount:
          dto.fixedDiscountAmount !== undefined
            ? dto.fixedDiscountAmount != null
              ? new Prisma.Decimal(dto.fixedDiscountAmount)
              : null
            : undefined, // CORREÇÃO: Converte para Prisma.Decimal
        imageUrl: dto.imageUrl ?? undefined,
      },
    });
  }

  async remove(id: string): Promise<PrismaOffer> {
    const existing = await this.prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Oferta com ID "${id}" não encontrada.`);
    }
    return this.prisma.offer.delete({ where: { id } });
  }

  // Busca de ofertas ativas/válidas, com filtros opcionais
  async searchOffers(
    searchTerm?: string,
    limit?: number,
    offset?: number,
    target?: OfferTarget,
    targetId?: string,
  ): Promise<PrismaOffer[]> {
    const where: Prisma.OfferWhereInput = {
      validUntil: { gte: new Date() },
      status: OfferStatus.ACTIVE,
    };

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (target) {
      where.target = target;
      if (target !== OfferTarget.GENERAL && targetId) {
        where.targetId = targetId;
      }
    }

    return this.prisma.offer.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }
}
