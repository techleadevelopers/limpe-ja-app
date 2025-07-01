// src/offers/offers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Offer, Prisma } from '@prisma/client'; // Importado Prisma

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    return this.prisma.offer.create({
      data: {
        ...createOfferDto,
        validUntil: new Date(createOfferDto.validUntil), // Converte string para Date
      },
    });
  }

  async findAll(): Promise<Offer[]> {
    return this.prisma.offer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Offer | null> {
    return this.prisma.offer.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
    const existingOffer = await this.prisma.offer.findUnique({ where: { id } });
    if (!existingOffer) {
      throw new NotFoundException(`Oferta com ID "${id}" não encontrada.`);
    }

    return this.prisma.offer.update({
      where: { id },
      data: {
        ...updateOfferDto,
        validUntil: updateOfferDto.validUntil ? new Date(updateOfferDto.validUntil) : undefined,
      },
    });
  }

  async remove(id: string): Promise<Offer> {
    const existingOffer = await this.prisma.offer.findUnique({ where: { id } });
    if (!existingOffer) {
      throw new NotFoundException(`Oferta com ID "${id}" não encontrada.`);
    }
    return this.prisma.offer.delete({
      where: { id },
    });
  }

  // NOVO MÉTODO: searchOffers para ser usado pelo SearchService
  async searchOffers(searchTerm?: string, limit?: number, offset?: number): Promise<Offer[]> {
    const where: Prisma.OfferWhereInput = searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } }, // CORREÇÃO AQUI
            { description: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } }, // CORREÇÃO AQUI
          ],
        }
      : {};

    return this.prisma.offer.findMany({
      where: {
        ...where,
        validUntil: {
          gte: new Date(), // Apenas ofertas que ainda são válidas
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }
}