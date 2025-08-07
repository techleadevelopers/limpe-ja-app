// backend-cleaning/src/coupons/coupons.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
// CORREÇÃO: Importar CouponStatus diretamente do Prisma
import { CouponType, CouponTarget, CouponStatus, Prisma } from '@prisma/client'; // Prisma enums
import { CouponApplicationResult } from './dto/apply-coupon.dto'; // Interface for result
import { UsersService } from '../users/users.service'; // Assuming UsersService for client data

@Injectable()
export class CouponsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService, // To check client type (e.g., new client)
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    const { code, validFrom, validUntil, ...rest } = createCouponDto;

    const existingCoupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (existingCoupon) {
      throw new BadRequestException(`Coupon with code '${code}' already exists.`);
    }

    return this.prisma.coupon.create({
      data: {
        ...rest,
        code: code.toUpperCase(), // Store codes as uppercase for consistency
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        usesCount: 0,
        status: CouponStatus.ACTIVE, // CORREÇÃO: Usar CouponStatus diretamente
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

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const existingCoupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existingCoupon) {
      throw new NotFoundException(`Coupon with ID '${id}' not found.`);
    }

    const { validFrom, validUntil, ...rest } = updateCouponDto;

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...rest,
        code: updateCouponDto.code?.toUpperCase(),
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
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

    // 1. Check validity period
    const now = new Date();
    if (coupon.validFrom > now || coupon.validUntil < now) {
      return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom expirado ou ainda não ativo.' };
    }

    // 2. Check usage limits
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
      return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom esgotado.' };
    }

    // 3. Check status
    if (coupon.status !== CouponStatus.ACTIVE) { // CORREÇÃO: Usar CouponStatus diretamente
      return { discountAmount: 0, newTotalPrice: bookingData.originalPrice || 0, message: 'Cupom inativo.' };
    }

    // 4. Check target eligibility
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

    // Calculate discount
    const originalPrice = bookingData.originalPrice || 0;
    let discountAmount = 0;
    let newTotalPrice = originalPrice;

    if (coupon.type === CouponType.PERCENTAGE) {
      discountAmount = originalPrice * coupon.value.toNumber(); // value is a Decimal, convert to number
      newTotalPrice = originalPrice - discountAmount;
    } else if (coupon.type === CouponType.FIXED_AMOUNT) {
      discountAmount = coupon.value.toNumber();
      newTotalPrice = originalPrice - discountAmount;
    }

    newTotalPrice = Math.max(0, newTotalPrice); // Ensure price doesn't go below zero

    return {
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      newTotalPrice: parseFloat(newTotalPrice.toFixed(2)),
      message: 'Cupom aplicado com sucesso!',
      coupon,
    };
  }

  // This method would be called by the BookingsService after a booking is confirmed
  async markCouponAsUsed(couponId: string) {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        usesCount: {
          increment: 1,
        },
        // Optionally, update status to USED_UP if maxUses is reached
        // A lógica de atualização de status para 'USED_UP' deve ser mais robusta
        // e pode ser feita em um hook do Prisma ou em uma função separada.
        // Por enquanto, vamos remover a linha que causava erro de tipagem.
        // status: {
        //   // This logic might be better handled in a trigger or a separate check
        //   // but for simplicity, we can do it here.
        //   // set: Prisma.raw(`CASE WHEN "maxUses" IS NOT NULL AND "usesCount" + 1 >= "maxUses" THEN 'USED_UP' ELSE "status" END`)
        // }
      },
    });
  }
}