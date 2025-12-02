// src/coupons/coupons.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Prisma, CouponType, CouponTarget, CouponStatus } from '@prisma/client'; // <<-- FIXED: Import CouponType and CouponTarget from @prisma/client
import { CouponApplicationResult } from './dto/apply-coupon.dto';

function normalizeValueType(v?: string): CouponType | undefined {
  if (!v) return undefined;
  const up = v.toUpperCase();
  if (['PERCENT', 'PERCENTAGE'].includes(up)) return CouponType.PERCENT;
  if (['FIXED', 'FIXED_AMOUNT'].includes(up)) return CouponType.FIXED;
  return undefined;
}

function normalizeTarget(v?: string): CouponTarget | undefined {
  if (!v) return undefined;
  const up = v.toUpperCase();
  if (up === 'GENERAL' || up === 'ALL') return CouponTarget.GENERAL; // <<-- FIXED: Use CouponTarget.GENERAL
  if (up === 'NEW_CLIENTS') return CouponTarget.NEW_CLIENTS;
  if (up === 'SPECIFIC_SERVICE') return CouponTarget.SPECIFIC_SERVICE;
  if (up === 'SPECIFIC_PROVIDER') return CouponTarget.SPECIFIC_PROVIDER;
  if (up === 'NEW_CUSTOMER') return CouponTarget.NEW_CUSTOMER;
  if (up === 'REFERRAL_REFERRED') return CouponTarget.REFERRAL_REFERRED;
  if (up === 'REFERRAL_REFERRER') return CouponTarget.REFERRAL_REFERRER;
  if (up === 'MISSION_REWARD') return CouponTarget.MISSION_REWARD;
  if (up === 'REPEAT_CUSTOMER') return CouponTarget.REPEAT_CUSTOMER;
  return undefined;
}

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private prisma: PrismaService) {}

  // =====================================================
  // CRUD básico
  // =====================================================

  async create(
    createCouponDto: CreateCouponDto & {
      issuedToUserId?: string;
      issuedBy?: string;
      maxDiscount?: number;
    },
  ) {
    const {
      code,
      validFrom,
      validUntil,
      type,
      target,
      value,
      targetId,
      description,
      maxUses,
      isActive,
      issuedToUserId,
      issuedBy, // <<-- FIXED: Destructure issuedBy
      maxDiscount,
    } = createCouponDto;

    const existing = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(
        `Já existe um cupom com o código '${code}'.`,
      );
    }

    const valueType = normalizeValueType(type);
    const targetNorm = normalizeTarget(target) ?? CouponTarget.GENERAL; // <<-- FIXED: Use CouponTarget.GENERAL
    if (!valueType) {
      throw new BadRequestException(
        `Tipo de valor inválido. Use 'PERCENT' (ou 'PERCENTAGE') ou 'FIXED' (ou 'FIXED_AMOUNT').`,
      );
    }

    const createdCoupon = await this.prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        value: new Prisma.Decimal(value),
        valueType,
        target: targetNorm,
        targetId: targetId ?? null,
        maxUses: maxUses ?? null,
        usesCount: 0,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        status:
          isActive === false ? CouponStatus.INACTIVE : CouponStatus.ACTIVE, // <<-- FIXED: Use CouponStatus enum
        firstBookingOnly: createCouponDto.firstBookingOnly ?? false, // Use from DTO
        issuedToUserId: issuedToUserId ?? null,
        issuedBy: issuedBy ?? 'SYSTEM', // <<-- FIXED: Pass issuedBy to data
        maxDiscount: maxDiscount ? new Prisma.Decimal(maxDiscount) : null,
      },
    });

    this.logger.log(
      `[CouponsService] Cupom ${createdCoupon.code} criado. IssuedBy: ${createdCoupon.issuedBy}, IssuedTo: ${createdCoupon.issuedToUserId}`,
    );
    // Telemetria: coupon_created
    this.logger.log(
      `[TELEMETRY] coupon_created: { couponId: ${createdCoupon.id}, code: ${createdCoupon.code}, issuedBy: ${createdCoupon.issuedBy}, issuedToUserId: ${createdCoupon.issuedToUserId} }`,
    );

    return createdCoupon;
  }

  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
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

    const updatedCoupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        description: dto.description ?? undefined,
        value:
          dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
        valueType: valueType ?? undefined,
        target: target ?? undefined,
        targetId: dto.targetId ?? undefined,
        maxUses: dto.maxUses ?? undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        status: dto.status ?? undefined,
        firstBookingOnly: dto.firstBookingOnly ?? undefined,
        maxDiscount:
          dto.maxDiscount !== undefined
            ? new Prisma.Decimal(dto.maxDiscount)
            : undefined,
      },
    });

    this.logger.log(`[CouponsService] Cupom ${updatedCoupon.code} atualizado.`);
    // Telemetria: coupon_updated
    this.logger.log(
      `[TELEMETRY] coupon_updated: { couponId: ${updatedCoupon.id}, code: ${updatedCoupon.code} }`,
    );

    return updatedCoupon;
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

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      this.logger.warn(
        `[CouponsService] applyCoupon: Cupom ${code} não encontrado.`,
      );
      return {
        discountAmount: 0,
        newTotalPrice: originalPrice,
        message: 'Cupom inválido.',
      };
    }

    // Telemetria: coupon_viewed (ou attempted_apply)
    this.logger.log(
      `[TELEMETRY] coupon_viewed: { couponId: ${coupon.id}, code: ${coupon.code}, userId: ${userId} }`,
    );

    const now = new Date();
    if (coupon.validFrom > now || coupon.validUntil < now) {
      this.logger.warn(
        `[CouponsService] applyCoupon: Cupom ${code} expirado ou ainda não ativo.`,
      );
      return {
        discountAmount: 0,
        newTotalPrice: originalPrice,
        message: 'Cupom expirado ou ainda não ativo.',
      };
    }

    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
      this.logger.warn(`[CouponsService] applyCoupon: Cupom ${code} esgotado.`);
      return {
        discountAmount: 0,
        newTotalPrice: originalPrice,
        message: 'Cupom esgotado.',
      };
    }

    if (coupon.status !== CouponStatus.ACTIVE) {
      // <<-- FIXED: Use CouponStatus enum
      this.logger.warn(`[CouponsService] applyCoupon: Cupom ${code} inativo.`);
      return {
        discountAmount: 0,
        newTotalPrice: originalPrice,
        message: 'Cupom inativo.',
      };
    }

    // Se o cupom foi emitido para um usuário específico, verificar se é o usuário correto
    if (coupon.issuedToUserId && coupon.issuedToUserId !== userId) {
      this.logger.warn(
        `[CouponsService] applyCoupon: Cupom ${code} não é para o usuário ${userId}. Foi emitido para ${coupon.issuedToUserId}.`,
      );
      return {
        discountAmount: 0,
        newTotalPrice: originalPrice,
        message: 'Este cupom não é seu.',
      };
    }

    // Regras de alvo/escopo
    // firstBookingOnly: true
    if (coupon.firstBookingOnly) {
      const client = await this.prisma.client.findUnique({ where: { userId } });
      if (!client) {
        this.logger.warn(
          `[CouponsService] applyCoupon: Cliente não encontrado para userId ${userId} ao aplicar cupom firstBookingOnly.`,
        );
        return {
          discountAmount: 0,
          newTotalPrice: originalPrice,
          message: 'Cliente não encontrado.',
        };
      }
      // Verifica se o cliente já tem bookings COMPLETED
      // O campo completedBookingsCount é atualizado no BookingsService
      if (client.completedBookingsCount > 0) {
        this.logger.warn(
          `[CouponsService] applyCoupon: Cupom ${code} é exclusivo para novos clientes, mas ${userId} já tem ${client.completedBookingsCount} bookings concluídos.`,
        );
        return {
          discountAmount: 0,
          newTotalPrice: originalPrice,
          message: 'Cupom exclusivo para novos clientes.',
        };
      }
    }

    // Target específico (NEW_CLIENTS, SPECIFIC_SERVICE, SPECIFIC_PROVIDER)
    if (coupon.target === CouponTarget.NEW_CLIENTS) {
      const client = await this.prisma.client.findUnique({ where: { userId } });
      if (!client)
        return {
          discountAmount: 0,
          newTotalPrice: originalPrice,
          message: 'Cliente não encontrado.',
        };

      // Se o target é NEW_CLIENTS, também verificamos completedBookingsCount
      if (client.completedBookingsCount > 0) {
        this.logger.warn(
          `[CouponsService] applyCoupon: Cupom ${code} (target NEW_CLIENTS) não aplicável a cliente existente ${userId}.`,
        );
        return {
          discountAmount: 0,
          newTotalPrice: originalPrice,
          message: 'Cupom exclusivo para novos clientes.',
        };
      }
    } else if (coupon.target === CouponTarget.SPECIFIC_SERVICE) {
      if (
        !bookingData.providerServiceId ||
        bookingData.providerServiceId !== coupon.targetId
      ) {
        this.logger.warn(
          `[CouponsService] applyCoupon: Cupom ${code} não aplicável a este serviço. Esperado: ${coupon.targetId}, Recebido: ${bookingData.providerServiceId}.`,
        );
        return {
          discountAmount: 0,
          newTotalPrice: originalPrice,
          message: 'Cupom não aplicável a este serviço.',
        };
      }
    } else if (coupon.target === CouponTarget.SPECIFIC_PROVIDER) {
      if (
        !bookingData.providerId ||
        bookingData.providerId !== coupon.targetId
      ) {
        this.logger.warn(
          `[CouponsService] applyCoupon: Cupom ${code} não aplicável a este provedor. Esperado: ${coupon.targetId}, Recebido: ${bookingData.providerId}.`,
        );
        return {
          discountAmount: 0,
          newTotalPrice: originalPrice,
          message: 'Cupom não aplicável a este provedor.',
        };
      }
    }
    // 'GENERAL' → sem restrições adicionais

    // Cálculo de desconto
    let discountAmount = 0;
    let newTotalPrice = originalPrice;

    if (coupon.valueType === CouponType.PERCENT) {
      discountAmount = originalPrice * Number(coupon.value);
    } else if (coupon.valueType === CouponType.FIXED) {
      discountAmount = Number(coupon.value);
    }

    // Aplicar cap de desconto (maxDiscount)
    if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
      this.logger.log(
        `[CouponsService] applyCoupon: Desconto de ${discountAmount.toFixed(2)} limitado pelo maxDiscount do cupom (${Number(coupon.maxDiscount).toFixed(2)}).`,
      );
      discountAmount = Number(coupon.maxDiscount);
    }

    newTotalPrice = originalPrice - discountAmount;
    newTotalPrice = Math.max(0, newTotalPrice); // Preço nunca negativo

    this.logger.log(
      `[CouponsService] applyCoupon: Cupom ${code} aplicado com sucesso. Desconto: ${discountAmount.toFixed(2)}, Novo Preço: ${newTotalPrice.toFixed(2)}.`,
    );
    // Telemetria: coupon_applied
    this.logger.log(
      `[TELEMETRY] coupon_applied: { couponId: ${coupon.id}, code: ${coupon.code}, userId: ${userId}, discountAmount: ${discountAmount.toFixed(2)}, newTotalPrice: ${newTotalPrice.toFixed(2)} }`,
    );

    return {
      discountAmount: Number(discountAmount.toFixed(2)),
      newTotalPrice: Number(newTotalPrice.toFixed(2)),
      message: 'Cupom aplicado com sucesso!',
      coupon,
    };
  }

  async markCouponAsUsed(couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) {
      this.logger.warn(
        `[CouponsService] markCouponAsUsed: Cupom ${couponId} não encontrado.`,
      );
      return;
    }

    const updatedCoupon = await this.prisma.coupon.update({
      where: { id: couponId },
      data: { usesCount: { increment: 1 } },
    });

    // Se o cupom atingiu o maxUses, mudar o status para USED_UP
    if (
      updatedCoupon.maxUses &&
      updatedCoupon.usesCount >= updatedCoupon.maxUses
    ) {
      await this.prisma.coupon.update({
        where: { id: couponId },
        data: { status: CouponStatus.USED_UP }, // <<-- FIXED: Use CouponStatus enum
      });
      this.logger.log(
        `[CouponsService] markCouponAsUsed: Cupom ${couponId} atingiu o limite de usos e foi marcado como USED_UP.`,
      );
    }

    this.logger.log(
      `[CouponsService] markCouponAsUsed: Cupom ${couponId} uso registrado. Total de usos: ${updatedCoupon.usesCount}.`,
    );
    // Telemetria: coupon_used
    this.logger.log(
      `[TELEMETRY] coupon_used: { couponId: ${coupon.id}, code: ${coupon.code} }`,
    );
  }

  // =====================================================
  // Integração com Missões
  // =====================================================

  /**
   * Gera um cupom a partir da conclusão de uma missão.
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
      throw new BadRequestException(
        'A missão não concede cupom (rewardType != COUPON).',
      );
    }

    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + validityDays);

    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `MIS-${mission.code}-${rand}`;

    const percentFraction =
      Math.max(0, Math.min(100, mission.rewardValue)) / 100;

    const created = await this.create({
      code,
      description: `Recompensa da missão "${mission.title}"`,
      value: percentFraction,
      type: CouponType.PERCENT, // <<-- FIXED: Use CouponType.PERCENT
      target: CouponTarget.GENERAL, // <<-- FIXED: Use CouponTarget.GENERAL
      maxUses: 1,
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      isActive: true,
      issuedToUserId: userId,
      issuedBy: 'MISSION',
      firstBookingOnly: false, // Cupons de missão geralmente não são firstBookingOnly
      maxDiscount: 50, // Exemplo de cap para cupons de missão
    });

    this.logger.log(
      `[CouponsService] Cupom de missão ${created.code} emitido para ${userId}.`,
    );
    // Telemetria: mission_coupon_issued
    this.logger.log(
      `[TELEMETRY] mission_coupon_issued: { couponId: ${created.id}, userId: ${userId}, missionId: ${mission.id} }`,
    );

    return created;
  }

  // =====================================================
  // Cupons de Retorno e Indicação (Novos Métodos)
  // =====================================================

  /**
   * Emite um cupom de retorno para o usuário após o primeiro agendamento.
   * Ex: cupom 7 dias pós-reserva (R$30 ou 20%).
   */
  async issueReturnCoupon(userId: string, bookingId: string): Promise<any> {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 7); // 7 dias de validade

    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `RET-${userId.substring(0, 4).toUpperCase()}-${rand}`;

    const coupon = await this.create({
      code,
      description: 'Cupom de retorno para sua próxima reserva!',
      type: CouponType.PERCENT, // <<-- FIXED: Use CouponType.PERCENT
      value: 0.2, // 20% de desconto
      maxDiscount: 30, // Máximo R$30
      target: CouponTarget.GENERAL, // <<-- FIXED: Use CouponTarget.GENERAL
      maxUses: 1,
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      isActive: true,
      issuedToUserId: userId,
      issuedBy: 'RETURN_COUPON',
      firstBookingOnly: false,
    });
    this.logger.log(
      `[CouponsService] Cupom de retorno ${coupon.code} emitido para ${userId} após booking ${bookingId}.`,
    );
    // Telemetria: return_coupon_issued
    this.logger.log(
      `[TELEMETRY] return_coupon_issued: { couponId: ${coupon.id}, userId: ${userId}, bookingId: ${bookingId} }`,
    );
    return coupon;
  }

  /**
   * Emite um cupom para o usuário indicado (REFERRAL_REFERRED).
   * Ex: R$30 ou 20%, firstBookingOnly.
   */
  async issueReferralReferredCoupon(
    userId: string,
    referralId: string,
  ): Promise<any> {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 14); // 14 dias de validade

    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `REFIND-${userId.substring(0, 4).toUpperCase()}-${rand}`;

    const coupon = await this.create({
      code,
      description: 'Cupom de boas-vindas da sua indicação!',
      type: CouponType.PERCENT, // <<-- FIXED: Use CouponType.PERCENT
      value: 0.2, // 20% de desconto
      maxDiscount: 30, // Máximo R$30
      target: CouponTarget.NEW_CLIENTS,
      maxUses: 1,
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      isActive: true,
      issuedToUserId: userId,
      issuedBy: 'REFERRAL',
      firstBookingOnly: true, // Exclusivo para o primeiro booking
    });
    this.logger.log(
      `[CouponsService] Cupom de indicação (indicado) ${coupon.code} emitido para ${userId} (referral ${referralId}).`,
    );
    // Telemetria: referral_referred_coupon_issued
    this.logger.log(
      `[TELEMETRY] referral_referred_coupon_issued: { couponId: ${coupon.id}, userId: ${userId}, referralId: ${referralId} }`,
    );
    return coupon;
  }

  /**
   * Emite um cupom para o usuário indicador (REFERRAL_REFERRER).
   * Ex: R$20, expira em 14d.
   */
  async issueReferralReferrerCoupon(
    userId: string,
    referralId: string,
  ): Promise<any> {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 14); // 14 dias de validade

    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `REFINC-${userId.substring(0, 4).toUpperCase()}-${rand}`;

    const coupon = await this.create({
      code,
      description: 'Recompensa pela sua indicação convertida!',
      type: CouponType.FIXED, // <<-- FIXED: Use CouponType.FIXED
      value: 20, // R$20 de desconto
      target: CouponTarget.GENERAL, // <<-- FIXED: Use CouponTarget.GENERAL
      maxUses: 1,
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      isActive: true,
      issuedToUserId: userId,
      issuedBy: 'REFERRAL',
      firstBookingOnly: false,
    });
    this.logger.log(
      `[CouponsService] Cupom de indicação (indicador) ${coupon.code} emitido para ${userId} (referral ${referralId}).`,
    );
    // Telemetria: referral_referrer_coupon_issued
    this.logger.log(
      `[TELEMETRY] referral_referrer_coupon_issued: { couponId: ${coupon.id}, userId: ${userId}, referralId: ${referralId} }`,
    );
    return coupon;
  }

  // =====================================================
  // Endpoint de Resolução de Cupom
  // =====================================================

  /**
   * Retorna detalhes de um cupom e sua elegibilidade para um usuário.
   * Útil para o frontend exibir informações antes da aplicação final.
   */
  async resolveCoupon(
    code: string,
    userId: string,
    bookingData: {
      originalPrice?: number;
      clientId?: string;
      providerServiceId?: string;
      providerId?: string;
      scheduledDate?: string;
    },
  ): Promise<{
    coupon: any;
    eligibility: boolean;
    message: string;
    discountPreview?: number;
  }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      this.logger.log(
        `[CouponsService] resolveCoupon: Cupom ${code} não encontrado para resolução.`,
      );
      return {
        coupon: null,
        eligibility: false,
        message: 'Cupom não encontrado.',
      };
    }

    // Telemetria: coupon_resolved
    this.logger.log(
      `[TELEMETRY] coupon_resolved: { couponId: ${coupon.id}, code: ${coupon.code}, userId: ${userId} }`,
    );

    // Simula a aplicação para obter a mensagem de elegibilidade e prévia do desconto
    const applicationResult = await this.applyCoupon(code, userId, bookingData);

    return {
      coupon: coupon,
      eligibility:
        applicationResult.discountAmount > 0 ||
        applicationResult.message === 'Cupom aplicado com sucesso!',
      message: applicationResult.message,
      discountPreview: applicationResult.discountAmount,
    };
  }

  /**
   * Lista cupons “do usuário”.
   * Modificado para listar cupons emitidos especificamente para o usuário OU cupons gerais ativos.
   */
  async getMyCoupons(userId: string) {
    await this.ensureWelcomeCoupon(userId);
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        status: {
          in: [CouponStatus.ACTIVE, CouponStatus.USED_UP, CouponStatus.EXPIRED],
        },
        OR: [
          { issuedToUserId: userId },
          { issuedToUserId: null, target: CouponTarget.GENERAL },
        ],
      },
      orderBy: { validUntil: 'asc' },
    });
    const enriched = coupons.map((c) => {
      const isExpired = c.validUntil < now || c.status === CouponStatus.EXPIRED;
      const isUsed = c.status === CouponStatus.USED_UP;
      const derivedStatus = isExpired
        ? CouponStatus.EXPIRED
        : isUsed
          ? CouponStatus.USED_UP
          : c.status;
      return { ...c, status: derivedStatus };
    });
    this.logger.log(
      `[CouponsService] getMyCoupons: ${enriched.length} cupons encontrados para userId ${userId}.`,
    );
    return enriched;
  }

  async ensureWelcomeCoupon(userId: string) {
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 30);
    const existing = await this.prisma.coupon.findFirst({
      where: { issuedToUserId: userId, issuedBy: 'WELCOME_NEW_USER' },
    });
    if (existing) return existing;
    const code = `BEMVINDO-${userId.substring(0, 6).toUpperCase()}`;
    const created = await this.create({
      code,
      description: '20% de desconto no seu primeiro agendamento',
      value: 0.2,
      type: CouponType.PERCENT,
      target: CouponTarget.NEW_CLIENTS,
      maxUses: 1,
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      isActive: true,
      issuedToUserId: userId,
      issuedBy: 'WELCOME_NEW_USER',
      firstBookingOnly: true,
      maxDiscount: 50,
    });
    this.logger.log(
      `[CouponsService] ensureWelcomeCoupon: Cupom ${created.code} emitido para ${userId}.`,
    );
    return created;
  }
}
