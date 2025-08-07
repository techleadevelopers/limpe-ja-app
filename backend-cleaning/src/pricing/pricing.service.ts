// backend-cleaning/src/pricing/pricing.service.ts
import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculatePriceDto, DynamicPriceResult } from './dto/calculate-price.dto';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { ProviderService } from '@prisma/client';
import { GeocodingService } from '../geocoding/geocoding.service';
import { BookingsService } from '../bookings/bookings.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
    // CORREÇÃO: Usar @Inject(forwardRef) para injetar BookingsService
    @Inject(forwardRef(() => BookingsService)) 
    private bookingsService: BookingsService,
  ) {}

  async calculatePrice(calculatePriceDto: CalculatePriceDto): Promise<DynamicPriceResult> {
    const { serviceId, providerId, latitude, longitude, scheduledDate } = calculatePriceDto;

    const service = await this.prisma.providerService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found.`);
    }

    const originalPrice = service.price.toNumber();
    let finalPrice = originalPrice;
    let surgeFactor = 1.0;
    let reason = 'Preço base do serviço.';

    const rules = await this.prisma.pricingRule.findMany({
      where: {
        isActive: true,
        OR: [
          { dayOfWeek: null },
          { dayOfWeek: new Date(scheduledDate).getDay() },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const rule of rules) {
      const scheduledDateTime = new Date(scheduledDate);
      const ruleStartTime = rule.startTime ? this.parseTime(rule.startTime) : null;
      const ruleEndTime = rule.endTime ? this.parseTime(rule.endTime) : null;

      const scheduledHours = scheduledDateTime.getHours();
      const scheduledMinutes = scheduledDateTime.getMinutes();
      const scheduledTotalMinutes = scheduledHours * 60 + scheduledMinutes;

      let isTimeValid = true;
      if (ruleStartTime && ruleEndTime) {
        const ruleStartTotalMinutes = ruleStartTime.hours * 60 + ruleStartTime.minutes;
        const ruleEndTotalMinutes = ruleEndTime.hours * 60 + ruleEndTime.minutes;

        if (ruleStartTotalMinutes < ruleEndTotalMinutes) {
          isTimeValid = scheduledTotalMinutes >= ruleStartTotalMinutes && scheduledTotalMinutes <= ruleEndTotalMinutes;
        } else {
          isTimeValid = scheduledTotalMinutes >= ruleStartTotalMinutes || scheduledTotalMinutes <= ruleEndTotalMinutes;
        }
      } else if (ruleStartTime) {
        const ruleStartTotalMinutes = ruleStartTime.hours * 60 + ruleStartTime.minutes;
        isTimeValid = scheduledTotalMinutes >= ruleStartTotalMinutes;
      } else if (ruleEndTime) {
        const ruleEndTotalMinutes = ruleEndTime.hours * 60 + ruleEndTime.minutes;
        isTimeValid = scheduledTotalMinutes <= ruleEndTotalMinutes;
      }

      if (isTimeValid) {
        if (rule.demandThreshold) {
          const demandCount = await this.bookingsService.getDemandCountForArea(
            serviceId,
            latitude,
            longitude,
            scheduledDateTime,
          );
          if (demandCount >= rule.demandThreshold) {
            surgeFactor *= rule.surgeFactor.toNumber();
            reason = 'Preço ajustado devido à alta demanda.';
          }
        } else {
          surgeFactor *= rule.surgeFactor.toNumber();
          reason = 'Preço ajustado por regra de horário/dia.';
        }
      }
    }

    finalPrice = originalPrice * surgeFactor;
    finalPrice = parseFloat(finalPrice.toFixed(2));

    return {
      originalPrice,
      surgeFactor: parseFloat(surgeFactor.toFixed(2)),
      finalPrice,
      reason,
    };
  }

  private parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  async createRule(createPricingRuleDto: CreatePricingRuleDto) {
    const { surgeFactor, ...rest } = createPricingRuleDto;
    return this.prisma.pricingRule.create({
      data: {
        ...rest,
        surgeFactor: new Decimal(surgeFactor),
      },
    });
  }

  async findAllRules() {
    return this.prisma.pricingRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRule(id: string, updatePricingRuleDto: UpdatePricingRuleDto) {
    const existingRule = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!existingRule) {
      throw new NotFoundException(`Pricing rule with ID ${id} not found.`);
    }

    const { surgeFactor, ...rest } = updatePricingRuleDto;

    return this.prisma.pricingRule.update({
      where: { id },
      data: {
        ...rest,
        surgeFactor: surgeFactor ? new Decimal(surgeFactor) : undefined,
      },
    });
  }
}
