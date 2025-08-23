// src/coupons/coupons.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
// Compat: seu arquivo define a classe UpdateBookingStatusDto; renomeamos localmente para UpdateCouponDto
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Prisma } from '@prisma/client';
import { CouponApplicationResult } from './dto/apply-coupon.dto';

// Observação: No schema.prisma, Coupon.valueType é STRING.
// Vamos normalizar internamente para 'PERCENT' | 'FIXED', e target para
// 'GENERAL' | 'NEW_CLIENTS' | 'SPECIFIC_SERVICE' | 'SPECIFIC_PROVIDER'.

type ValueType = 'PERCENT' | 'FIXED';
type TargetType = 'GENERAL' | 'NEW_CLIENTS' | 'SPECIFIC_SERVICE' | 'SPECIFIC_PROVIDER';

function normalizeValueType(v?: string): ValueType | undefined {
  if (!v) return undefined;
  const up = v.toUpperCase();
  if (['PERCENT', 'PERCENTAGE'].includes(up)) return 'PERCENT';
  if (['FIXED', 'FIXED_AMOUNT'].includes(up)) return 'FIXED';
  return undefined;
}

function normalizeTarget(v?: string): TargetType | undefined {
  if (!v) return undefined;
  const up = v.toUpperCase();
  if (up === 'GENERAL' || up === 'ALL') return 'GENERAL';
  if (up === 'NEW_CLIENTS') return 'NEW_CLIENTS';
  if (up === 'SPECIFIC_SERVICE') return 'SPECIFIC_SERVICE';
  if (up === 'SPECIFIC_PROVIDER') return 'SPECIFIC_PROVIDER';
  return undefined;
}

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // CRUD básico
  // =====================================================

  async create(createCouponDto: CreateCouponDto) {
    const { code, validFrom, validUntil, type, target, value, targetId, description, maxUses } = createCouponDto;

    const existing = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      throw new BadRequestException(`Já existe um cupom com o código '${code}'.`);
    }

    const valueType = normalizeValueType(type);
    const targetNorm = normalizeTarget(target) ?? 'GENERAL';
    if (!valueType) {
      throw new BadRequestException(`Tipo de valor inválido. Use 'PERCENT' (ou 'PERCENTAGE') ou 'FIXED' (ou 'FIXED_AMOUNT').`);
    }

    return this.prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        value: new Prisma.Decimal(value), // Se PERCENT, espere fração (ex.: 0.20). Se FIXED, valor absoluto.
        valueType,                        // 'PERCENT' | 'FIXED'
        target: targetNorm,               // 'GENERAL' | 'NEW_CLIENTS' | ...
        targetId: targetId ?? null,
        maxUses: maxUses ?? null,
        usesCount: 0,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        status: 'ACTIVE',
      },
    });
  }

  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) throw new NotFoundException(`Cupom '${code}' não encontrado.`);
    return coupon;
  }

  async findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Cupom '${id}' não encontrado.`);

    const valueType = normalizeValueType(dto.type);
    const target = normalizeTarget(dto.target);

    return this.prisma.coupon.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        description: dto.description ?? undefined,
        value: dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
        valueType: valueType ?? undefined,
        target: target ?? undefined,
        targetId: dto.targetId ?? undefined,
        maxUses: dto.maxUses ?? undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        status: dto.status ?? undefined, // 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'USED_UP'
      },
    });
  }

  // =====================================================
  // Aplicação de cupom em agendamento
  // =====================================================

  async applyCoupon(
    code: string,
    userId: string,
    bookingData: {
      originalPrice?: number;
      clientId?: string;
      providerServiceId?: string;
      providerId?: string;
      scheduledDate?: string;
    },
  ): Promise<CouponApplicationResult> {
    const originalPrice = bookingData.originalPrice ?? 0;

    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) {
      return { discountAmount: 0, newTotalPrice: originalPrice, message: 'Cupom inválido.' };
    }

    const now = new Date();
    if (coupon.validFrom > now || coupon.validUntil < now) {
      return { discountAmount: 0, newTotalPrice: originalPrice, message: 'Cupom expirado ou ainda não ativo.' };
    }

    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
      return { discountAmount: 0, newTotalPrice: originalPrice, message: 'Cupom esgotado.' };
    }

    if (coupon.status !== 'ACTIVE') {
      return { discountAmount: 0, newTotalPrice: originalPrice, message: 'Cupom inativo.' };
    }

    // Regras de alvo/escopo
    if (coupon.target === 'NEW_CLIENTS') {
      const client = await this.prisma.client.findUnique({ where: { userId } });
      if (!client) return { discountAmount: 0, newTotalPrice: originalPrice, message: 'Cliente não encontrado.' };

      const count = await this.prisma.booking.count({ where: { clientId: client.id } });
      if (count > 0) {
        return { discountAmount: 0, newTotalPrice: originalPrice, message: 'Cupom exclusivo para novos clientes.' };
      }
    } else if (coupon.target === 'SPECIFIC_SERVICE') {
      if (!bookingData.providerServiceId || bookingData.providerServiceId !== coupon.targetId) {
        return { discountAmount: 0, newTotalPrice: originalPrice, message: 'Cupom não aplicável a este serviço.' };
      }
    } else if (coupon.target === 'SPECIFIC_PROVIDER') {
      if (!bookingData.providerId || bookingData.providerId !== coupon.targetId) {
        return { discountAmount: 0, newTotalPrice: originalPrice, message: 'Cupom não aplicável a este provedor.' };
      }
    }
    // 'GENERAL' → sem restrições adicionais

    // Cálculo de desconto
    let discountAmount = 0;
    let newTotalPrice = originalPrice;

    if (coupon.valueType === 'PERCENT') {
      // Espera-se que coupon.value seja fração (ex.: 0.20 para 20%)
      discountAmount = originalPrice * Number(coupon.value);
      newTotalPrice = originalPrice - discountAmount;
    } else if (coupon.valueType === 'FIXED') {
      discountAmount = Number(coupon.value);
      newTotalPrice = originalPrice - discountAmount;
    }

    newTotalPrice = Math.max(0, newTotalPrice);

    return {
      discountAmount: Number(discountAmount.toFixed(2)),
      newTotalPrice: Number(newTotalPrice.toFixed(2)),
      message: 'Cupom aplicado com sucesso!',
      coupon,
    };
  }

  async markCouponAsUsed(couponId: string) {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: { usesCount: { increment: 1 } },
    });
  }

  // =====================================================
  // Integração com Missões
  // =====================================================

  /**
   * Gera um cupom a partir da conclusão de uma missão.
   * Convenções:
   * - rewardType=COUPON → gera percentual com fração (ex.: 20% => 0.20).
   * - Validade padrão: 30 dias.
   * - Target padrão: 'GENERAL'. (Schema atual não amarra cupom a usuário.)
   */
  async issueCouponFromMission(params: {
    userId: string;
    mission: {
      id: string;
      code: string;
      title: string;
      rewardType: 'COUPON' | 'POINTS';
      rewardValue: number; // em %, ex.: 20 (armazenaremos 0.20)
      couponTemplateId?: string | null;
    };
    validityDays?: number; // default 30
  }) {
    const { userId, mission, validityDays = 30 } = params;

    if (mission.rewardType !== 'COUPON') {
      throw new BadRequestException('A missão não concede cupom (rewardType != COUPON).');
    }

    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Código de cupom único e legível
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `MIS-${mission.code}-${rand}`;

    // Guardamos o percentual como fração (ex.: 20% => 0.20)
    const percentFraction = Math.max(0, Math.min(100, mission.rewardValue)) / 100;

    const created = await this.prisma.coupon.create({
      data: {
        code,
        description: `Recompensa da missão "${mission.title}" (usuário: ${userId})`,
        value: new Prisma.Decimal(percentFraction),
        valueType: 'PERCENT', // padrão missão→cupom: percentual
        target: 'GENERAL',     // sem escopo por usuário no schema atual
        targetId: null,
        maxUses: 1,            // cupom individual (um uso)
        usesCount: 0,
        validFrom: now,
        validUntil,
        status: 'ACTIVE',
      },
    });

    return created;
  }

  /**
   * Lista cupons “do usuário”.
   * OBS: Como o schema não tem vínculo direto Coupon→User,
   * esta listagem retorna os cupons ATIVOS e dentro da validade.
   */
  async getMyCoupons(_userId: string) {
    const now = new Date();
    return this.prisma.coupon.findMany({
      where: {
        status: 'ACTIVE',
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { validUntil: 'asc' },
    });
  }
}
  