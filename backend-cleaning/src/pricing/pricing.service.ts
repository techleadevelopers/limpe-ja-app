// backend-cleaning/src/pricing/pricing.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CalculatePriceDto,
  DynamicPriceResult,
} from './dto/calculate-price.dto';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { PricingScope, PricingRule, Prisma } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { CacheService } from '../cache/cache.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  PricingAuditEvent,
  SettingsService,
} from '../settings/settings.service';

const MULTIPLIER_MIN = 0.8;
const MULTIPLIER_MAX = 1.8;
const DEMAND_CACHE_TTL = 60; // seconds

interface PricingContext {
  providerId?: string;
  cityCode?: string;
  categoryId?: string;
}

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => BookingsService))
    private bookingsService: BookingsService,
    private readonly settings: SettingsService,
  ) {}

  async calculatePrice(dto: CalculatePriceDto): Promise<DynamicPriceResult> {
    const scheduledDateTime = this.resolveDateWithTimezone(
      dto.scheduledDate,
      dto.timezone,
    );
    if (Number.isNaN(scheduledDateTime.getTime())) {
      throw new BadRequestException(
        'Invalid scheduledDate. Expecting ISO string.',
      );
    }

    const providerService = dto.providerId
      ? await this.prisma.providerService.findFirst({
          where: {
            providerId: dto.providerId,
            serviceId: dto.serviceId,
          },
          include: {
            service: true,
          },
        })
      : null;

    if (dto.providerId && !providerService) {
      throw new NotFoundException(
        `ProviderService for provider ${dto.providerId} and service ${dto.serviceId} not found.`,
      );
    }

    const service = providerService
      ? providerService.service
      : await this.prisma.service.findUnique({ where: { id: dto.serviceId } });

    if (!service) {
      throw new NotFoundException(`Service ${dto.serviceId} not found.`);
    }

    // Para serviços HOURLY, usar pricePerHour se configurado; caso contrário, cair para price
    let basePriceDecimal: Decimal | null;
    if (providerService) {
      if (providerService.pricingType === 'HOURLY') {
        basePriceDecimal =
          providerService.pricePerHour ??
          providerService.price ??
          service.price ??
          null;
      } else {
        basePriceDecimal = providerService.price ?? service.price ?? null;
      }
    } else {
      basePriceDecimal = service.price ?? null;
    }
    if (!basePriceDecimal) {
      throw new BadRequestException(
        'Base price not configured for this service/provider.',
      );
    }

    const basePrice = Number(basePriceDecimal.toFixed(2));
    let multiplier = 1;
    const appliedRules: Array<{
      id: string;
      scope: string;
      multiplier: number;
    }> = [];

    const context: PricingContext = {
      providerId: dto.providerId,
      cityCode: dto.cityCode,
      categoryId: dto.categoryId,
    };

    const rules = await this.fetchCandidateRules(context);
    const demandCount = await this.getDemandForContext(
      rules,
      providerService?.id,
      dto,
      scheduledDateTime,
    );

    for (const rule of rules) {
      if (!this.ruleMatchesContext(rule, context)) {
        continue;
      }
      if (!this.ruleMatchesDayAndTime(rule, scheduledDateTime)) {
        continue;
      }
      if (
        rule.demandThreshold != null &&
        demandCount != null &&
        demandCount < rule.demandThreshold
      ) {
        continue;
      }

      let ruleMultiplier = Number(rule.surgeFactor);
      if (rule.maxMultiplier) {
        const allowedMax = Number(rule.maxMultiplier);
        const potential = multiplier * ruleMultiplier;
        if (potential > allowedMax) {
          ruleMultiplier = allowedMax / multiplier;
        }
      }

      multiplier *= ruleMultiplier;
      appliedRules.push({
        id: rule.id,
        scope: this.resolveScope(rule),
        multiplier: Number(ruleMultiplier.toFixed(2)),
      });
    }

    multiplier = Math.min(MULTIPLIER_MAX, Math.max(MULTIPLIER_MIN, multiplier));

    const finalPrice = Number((basePrice * multiplier).toFixed(2));
    const reason = appliedRules.length
      ? 'Rules: ' +
        appliedRules
          .map((r) => r.scope + ' x' + r.multiplier.toFixed(2))
          .join(', ')
      : 'Base price';

    return {
      originalPrice: basePrice,
      surgeFactor: Number(multiplier.toFixed(2)),
      finalPrice,
      appliedRules,
      reason,
    };
  }

  async createRule(
    createPricingRuleDto: CreatePricingRuleDto,
    actorUserId?: string,
  ) {
    const { surgeFactor, maxMultiplier, ...rest } = createPricingRuleDto;
    const created = await this.prisma.pricingRule.create({
      data: {
        ...rest,
        scope: createPricingRuleDto.scope ?? PricingScope.GLOBAL,
        surgeFactor: new Decimal(surgeFactor),
        maxMultiplier: maxMultiplier ? new Decimal(maxMultiplier) : null,
      },
    });
    const audit: PricingAuditEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      actorUserId: actorUserId ?? 'unknown',
      action: 'create',
      ruleAfter: created,
    };
    await this.settings.appendPricingAudit(audit);
    return created;
  }

  async findAllRules() {
    return this.prisma.pricingRule.findMany({
      orderBy: { createdAt: 'desc' as Prisma.SortOrder },
    });
  }

  async updateRule(
    id: string,
    updatePricingRuleDto: UpdatePricingRuleDto,
    actorUserId?: string,
  ) {
    const existingRule = await this.prisma.pricingRule.findUnique({
      where: { id },
    });
    if (!existingRule) {
      throw new NotFoundException(`Pricing rule with ID ${id} not found.`);
    }

    const { surgeFactor, maxMultiplier, ...rest } = updatePricingRuleDto;

    const updated = await this.prisma.pricingRule.update({
      where: { id },
      data: {
        ...rest,
        surgeFactor:
          surgeFactor !== undefined ? new Decimal(surgeFactor) : undefined,
        maxMultiplier:
          maxMultiplier !== undefined ? new Decimal(maxMultiplier) : undefined,
      },
    });
    const audit: PricingAuditEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      actorUserId: actorUserId ?? 'unknown',
      action: 'update',
      ruleBefore: existingRule,
      ruleAfter: updated,
    };
    await this.settings.appendPricingAudit(audit);
    return updated;
  }

  async deleteRule(id: string, actorUserId?: string) {
    const existingRule = await this.prisma.pricingRule.findUnique({
      where: { id },
    });
    if (!existingRule) {
      throw new NotFoundException(`Pricing rule with ID ${id} not found.`);
    }
    const deleted = await this.prisma.pricingRule.delete({ where: { id } });
    const audit: PricingAuditEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      actorUserId: actorUserId ?? 'unknown',
      action: 'delete',
      ruleBefore: existingRule,
      ruleAfter: null,
    };
    await this.settings.appendPricingAudit(audit);
    return deleted;
  }

  // Helpers
  private validateScopePayload(
    scope: PricingScope | undefined,
    dto: { cityCode?: string; categoryId?: string; providerId?: string },
  ) {
    switch (scope) {
      case PricingScope.CITY:
        if (!dto.cityCode) {
          throw new BadRequestException(
            'cityCode is required when scope is CITY.',
          );
        }
        break;
      case PricingScope.CATEGORY:
        if (!dto.categoryId) {
          throw new BadRequestException(
            'categoryId is required when scope is CATEGORY.',
          );
        }
        break;
      case PricingScope.PROVIDER:
        if (!dto.providerId) {
          throw new BadRequestException(
            'providerId is required when scope is PROVIDER.',
          );
        }
        break;
      default:
        break;
    }
  }

  private async fetchCandidateRules(
    context: PricingContext,
  ): Promise<PricingRule[]> {
    const orFilters: any[] = [{ scope: null }, { scope: PricingScope.GLOBAL }];

    if (context.providerId) {
      orFilters.push({
        scope: PricingScope.PROVIDER,
        providerId: context.providerId,
      });
    }
    if (context.categoryId) {
      orFilters.push({
        scope: PricingScope.CATEGORY,
        categoryId: context.categoryId,
      });
    }
    if (context.cityCode) {
      orFilters.push({ scope: PricingScope.CITY, cityCode: context.cityCode });
    }

    const rawRules = await this.prisma.pricingRule.findMany({
      where: {
        isActive: true,
        OR: orFilters,
      },
      orderBy: [{ createdAt: 'desc' as Prisma.SortOrder }],
    });

    const prioritizedScopes: (PricingScope | null)[] = [
      PricingScope.PROVIDER,
      PricingScope.CATEGORY,
      PricingScope.CITY,
      PricingScope.GLOBAL,
      null,
    ];

    const results: PricingRule[] = [];
    for (const scope of prioritizedScopes) {
      const scoped = rawRules.filter(
        (rule) => this.resolveScopeValue(rule) === scope,
      );
      results.push(...scoped);
    }
    return results;
  }

  private resolveScope(rule: PricingRule): string {
    return (rule.scope ?? PricingScope.GLOBAL).toString();
  }

  private resolveScopeValue(rule: PricingRule): PricingScope | null {
    return rule.scope ?? PricingScope.GLOBAL;
  }

  private ruleMatchesContext(rule: PricingRule, ctx: PricingContext): boolean {
    const scope = this.resolveScopeValue(rule);
    switch (scope) {
      case PricingScope.PROVIDER:
        return !!ctx.providerId && rule.providerId === ctx.providerId;
      case PricingScope.CATEGORY:
        return !!ctx.categoryId && rule.categoryId === ctx.categoryId;
      case PricingScope.CITY:
        return !!ctx.cityCode && rule.cityCode === ctx.cityCode;
      case PricingScope.GLOBAL:
      default:
        return true;
    }
  }

  private ruleMatchesDayAndTime(rule: PricingRule, scheduled: Date): boolean {
    if (rule.dayOfWeek != null && rule.dayOfWeek !== scheduled.getDay()) {
      return false;
    }

    if (rule.activeFrom && scheduled < rule.activeFrom) {
      return false;
    }
    if (rule.activeTo && scheduled > rule.activeTo) {
      return false;
    }

    if (!rule.startTime && !rule.endTime) {
      return true;
    }

    const scheduledMinutes = scheduled.getHours() * 60 + scheduled.getMinutes();
    const start = rule.startTime
      ? this.timeStringToMinutes(rule.startTime)
      : null;
    const end = rule.endTime ? this.timeStringToMinutes(rule.endTime) : null;

    if (start != null && end != null) {
      if (start < end) {
        return scheduledMinutes >= start && scheduledMinutes <= end;
      }
      return scheduledMinutes >= start || scheduledMinutes <= end; // spans midnight
    }

    if (start != null) {
      return scheduledMinutes >= start;
    }

    if (end != null) {
      return scheduledMinutes <= end;
    }

    return true;
  }

  private timeStringToMinutes(value: string): number {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  }

  private resolveDateWithTimezone(iso: string, timezone?: string): Date {
    const base = new Date(iso);
    if (!timezone) {
      return base;
    }
    try {
      const localeString = base.toLocaleString('en-US', {
        timeZone: timezone,
      });
      return new Date(localeString);
    } catch {
      return base;
    }
  }

  private async getDemandForContext(
    rules: PricingRule[],
    providerServiceId: string | undefined,
    dto: CalculatePriceDto,
    scheduled: Date,
  ): Promise<number | null> {
    if (!rules.some((rule) => rule.demandThreshold != null)) {
      return null;
    }
    if (!providerServiceId) {
      return null;
    }

    const key = `pricing:demand:${providerServiceId}:${scheduled.toISOString().slice(0, 13)}`;
    const cached = await this.cacheService.get<number>(key);
    if (cached != null) {
      return cached;
    }

    const demand = await this.bookingsService.getDemandCountForArea(
      providerServiceId,
      dto.latitude,
      dto.longitude,
      scheduled,
    );
    await this.cacheService.set(key, demand, DEMAND_CACHE_TTL);
    return demand;
  }
}
