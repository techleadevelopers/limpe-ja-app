// backend-cleaning/src/pricing/pricing.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculatePriceDto, DynamicPriceResult } from './dto/calculate-price.dto';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { ProviderService } from '@prisma/client'; // Assuming ProviderService model
import { GeocodingService } from '../geocoding/geocoding.service'; // Assuming GeocodingService for zone lookup
import { BookingsService } from '../bookings/bookings.service'; // To infer demand

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService, // For converting lat/long to zoneId
    private bookingsService: BookingsService, // For demand sensing
  ) {}

  async calculatePrice(calculatePriceDto: CalculatePriceDto): Promise<DynamicPriceResult> {
    const { serviceId, providerId, latitude, longitude, scheduledDate } = calculatePriceDto;

    // 1. Get base price of the service
    const service = await this.prisma.providerService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found.`);
    }

    const originalPrice = service.basePrice.toNumber();
    let finalPrice = originalPrice;
    let surgeFactor = 1.0;
    let reason = 'Preço base do serviço.';

    // 2. Determine geographical zone (if zones are implemented)
    // const zoneId = await this.geocodingService.getZoneIdFromCoordinates(latitude, longitude);

    // 3. Find applicable pricing rules
    const rules = await this.prisma.pricingRule.findMany({
      where: {
        isActive: true,
        // Apply zone filter if zoneId is determined
        // zoneId: zoneId || null, // Match specific zone or global rules
        OR: [
          { dayOfWeek: null }, // Apply to all days
          { dayOfWeek: new Date(scheduledDate).getDay() }, // Apply to specific day of week
        ],
        // Time range check (simplified, could be more complex with overlapping ranges)
        // startTime: { lte: scheduledTime },
        // endTime: { gte: scheduledTime },
      },
      orderBy: { createdAt: 'desc' }, // Apply newer rules first or define priority
    });

    // 4. Apply rules
    for (const rule of rules) {
      // Check time validity
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
          // Standard range (e.g., 09:00 - 17:00)
          isTimeValid = scheduledTotalMinutes >= ruleStartTotalMinutes && scheduledTotalMinutes <= ruleEndTotalMinutes;
        } else {
          // Overnight range (e.g., 22:00 - 06:00)
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
        // Check demand threshold (example: count bookings for this service/provider in the next hour)
        if (rule.demandThreshold) {
          const demandCount = await this.bookingsService.getDemandCountForArea(
            serviceId,
            latitude,
            longitude,
            scheduledDateTime,
            // You might need to pass a radius or time window
          );
          if (demandCount >= rule.demandThreshold) {
            surgeFactor *= rule.surgeFactor.toNumber();
            reason = 'Preço ajustado devido à alta demanda.';
          }
        } else {
          // Apply rule if no demand threshold or threshold met
          surgeFactor *= rule.surgeFactor.toNumber();
          reason = 'Preço ajustado por regra de horário/dia.';
        }
      }
    }

    finalPrice = originalPrice * surgeFactor;
    finalPrice = parseFloat(finalPrice.toFixed(2)); // Round to 2 decimal places

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
        surgeFactor: new this.prisma.Decimal(surgeFactor),
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
        surgeFactor: surgeFactor ? new this.prisma.Decimal(surgeFactor) : undefined,
      },
    });
  }
}