import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderPromotion, VerificationStatus, Prisma } from '@prisma/client';
import { CreateProviderPromotionDto } from './dto/create-provider-promotion.dto';
import { UpdateProviderPromotionDto } from './dto/update-provider-promotion.dto';
import { ProviderPromotionDto } from './dto/provider-promotion.dto';
import { AuthenticatedProviderUser } from './types/authenticated-provider-user.interface';

@Injectable()
export class ProviderPromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPromotions(
    user: AuthenticatedProviderUser,
  ): Promise<ProviderPromotionDto[]> {
    const provider = await this.resolveProvider(user);
    const promotions = await this.prisma.providerPromotion.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
    });
    return promotions.map((promotion) => this.toDto(promotion));
  }

  async createPromotion(
    user: AuthenticatedProviderUser,
    dto: CreateProviderPromotionDto,
  ): Promise<ProviderPromotionDto> {
    const provider = await this.resolveProvider(user);
    const validUntil = this.parseValidUntil(dto.validUntil);
    const data: Prisma.ProviderPromotionUncheckedCreateInput = {
      providerId: provider.id,
      title: dto.title,
      percentOff: dto.percentOff,
      validUntil,
      isActive: dto.isActive ?? false,
    };

    if (dto.isActive) {
      this.ensureProviderApproved(provider);
      const created = await this.prisma.$transaction(async (tx) => {
        await tx.providerPromotion.updateMany({
          where: { providerId: provider.id, isActive: true },
          data: { isActive: false },
        });
        return tx.providerPromotion.create({ data });
      });
      return this.toDto(created);
    }

    const created = await this.prisma.providerPromotion.create({ data });
    return this.toDto(created);
  }

  async updatePromotion(
    user: AuthenticatedProviderUser,
    promotionId: string,
    dto: UpdateProviderPromotionDto,
  ): Promise<ProviderPromotionDto> {
    const provider = await this.resolveProvider(user);
    const promotion = await this.prisma.providerPromotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion || promotion.providerId !== provider.id) {
      throw new NotFoundException(
        'Promoção não encontrada para este provedor.',
      );
    }

    const updateData: Prisma.ProviderPromotionUncheckedUpdateInput = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }
    if (dto.percentOff !== undefined) {
      updateData.percentOff = dto.percentOff;
    }
    if (dto.validUntil) {
      updateData.validUntil = this.parseValidUntil(dto.validUntil);
    }
    if (dto.isActive !== undefined && dto.isActive === false) {
      updateData.isActive = false;
    }

    if (Object.keys(updateData).length === 0 && dto.isActive !== true) {
      throw new BadRequestException(
        'Nenhum campo válido fornecido para atualização.',
      );
    }

    if (dto.isActive === true) {
      this.ensureProviderApproved(provider);
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.providerPromotion.updateMany({
          where: { providerId: provider.id, isActive: true },
          data: { isActive: false },
        });
        return tx.providerPromotion.update({
          where: { id: promotionId },
          data: {
            ...updateData,
            isActive: true,
          },
        });
      });
      return this.toDto(updated);
    }

    const updated = await this.prisma.providerPromotion.update({
      where: { id: promotionId },
      data: updateData,
    });

    return this.toDto(updated);
  }

  private async resolveProvider(
    user: AuthenticatedProviderUser,
  ): Promise<{ id: string; verificationStatus: VerificationStatus }> {
    const providerId = user.providerId;
    if (providerId) {
      const provider = await this.prisma.provider.findUnique({
        where: { id: providerId },
        select: { id: true, verificationStatus: true },
      });
      if (provider) {
        return provider;
      }
    }

    const provider = await this.prisma.provider.findUnique({
      where: { userId: user.userId },
      select: { id: true, verificationStatus: true },
    });

    if (!provider) {
      throw new NotFoundException(
        'Provedor vinculado ao token não foi encontrado.',
      );
    }

    return provider;
  }

  private parseValidUntil(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('validUntil deve ser uma data ISO válida.');
    }
    this.validateValidUntil(parsed);
    return parsed;
  }

  private validateValidUntil(validUntil: Date) {
    const now = new Date();
    if (validUntil.getTime() <= now.getTime()) {
      throw new BadRequestException('validUntil deve estar no futuro.');
    }
    const max = new Date(now);
    max.setDate(max.getDate() + 30);
    if (validUntil.getTime() > max.getTime()) {
      throw new BadRequestException('validUntil não pode ultrapassar 30 dias.');
    }
  }

  private ensureProviderApproved(provider: {
    verificationStatus: VerificationStatus;
  }) {
    if (provider.verificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenException(
        'Somente provedores aprovados podem ativar promoções.',
      );
    }
  }

  private toDto(promotion: ProviderPromotion): ProviderPromotionDto {
    return {
      id: promotion.id,
      providerId: promotion.providerId,
      title: promotion.title,
      percentOff: promotion.percentOff,
      validFrom: promotion.validFrom,
      validUntil: promotion.validUntil,
      isActive: promotion.isActive,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    };
  }
}
