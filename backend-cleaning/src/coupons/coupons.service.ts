// backend-cleaning/src/coupons/coupons.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateBookingStatusDto } from './dto/update-coupon.dto'; // CORRIGIDO: Importa UpdateBookingStatusDto
import { CouponType, CouponTarget, CouponStatus } from './entities/coupon.entity';
import { Prisma } from '@prisma/client';
import { CouponApplicationResult } from './dto/apply-coupon.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class CouponsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    const { code, validFrom, validUntil, type, target, ...rest } = createCouponDto;

    const existingCoupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (existingCoupon) {
      throw new BadRequestException(`Coupon with code '${code}' already exists.`);
    }

    return this.prisma.coupon.create({
      data: {
        ...rest,
        code: code.toUpperCase(),
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        usesCount: 0,
        status: CouponStatus.ACTIVE,
        valueType: type,
        target: target,
      },
    });
  }

  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with code '${code}' not found.`);
    }
    return coupon;
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ATENÇÃO: O tipo do DTO aqui deve ser UpdateBookingStatusDto
  async update(id: string, updateCouponDto: UpdateBookingStatusDto) { // CORRIGIDO: Tipo do DTO
    const existingCoupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existingCoupon) {
      throw new NotFoundException(`Coupon with ID '${id}' not found.`);
    }

    const { validFrom, validUntil, type, target, ...rest } = updateCouponDto;

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...rest,
        code: updateCouponDto.code?.toUpperCase(),
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        valueType: type,
        target: target,
      },
    });
  }

  async applyCoupon(code: string, userId: string, bookingData: {
    originalPrice?: number;
    clientId?: string;
    providerServiceId?: string;
    providerId?: string;
    scheduledDate?: string;
  }): Promise<CouponApplicationResult> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) {
      return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom inválido.' };
    }

    const now = new Date();
    if (coupon.validFrom > now || coupon.validUntil < now) {
      return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom expirado ou ainda não ativo.' };
    }

    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
      return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom esgotado.' };
    }

    if (coupon.status !== CouponStatus.ACTIVE) {
      return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom inativo.' };
    }

    const client = await this.prisma.client.findUnique({ where: { userId } });
    if (!client) {
      return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Usuário não encontrado.' };
    }

    if (coupon.target === CouponTarget.NEW_CLIENTS) {
      const clientBookingsCount = await this.prisma.booking.count({ where: { clientId: client.id } });
      if (clientBookingsCount > 0) {
        return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom exclusivo para novos clientes.' };
      }
    } else if (coupon.target === CouponTarget.SPECIFIC_SERVICE) {
      if (!bookingData.providerServiceId || bookingData.providerServiceId !== coupon.targetId) {
        return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom não aplicável a este serviço.' };
      }
    } else if (coupon.target === CouponTarget.SPECIFIC_PROVIDER) {
      if (!bookingData.providerId || bookingData.providerId !== coupon.targetId) {
        return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom não aplicável a este provedor.' };
      }
    }

    const originalPrice = bookingData.originalPrice || 0;
    let discountAmount = 0;
    let newTotalPrice = originalPrice;

    if (coupon.valueType === CouponType.PERCENTAGE) {
      discountAmount = originalPrice * coupon.value.toNumber();
      newTotalPrice = originalPrice - discountAmount;
    } else if (coupon.valueType === CouponType.FIXED_AMOUNT) {
      discountAmount = coupon.value.toNumber();
      newTotalPrice = originalPrice - discountAmount;
    }

    newTotalPrice = Math.max(0, newTotalPrice);

    return {
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      newTotalPrice: parseFloat(newTotalPrice.toFixed(2)),
      message: 'Cupom aplicado com sucesso!',
      coupon,
    };
  }

  async markCouponAsUsed(couponId: string) {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        usesCount: {
          increment: 1,
        },
      },
    });
  }
}