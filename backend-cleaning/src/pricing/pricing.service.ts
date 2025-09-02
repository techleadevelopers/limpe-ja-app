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

    // CORREÇÃO: Buscar o ProviderService correto usando providerId e o serviceId canônico
    // O serviceId no DTO é o ID do serviço genérico (e.g., 'Limpeza Residencial'),
    // não o ID do ProviderService específico.
    const providerService = await this.prisma.providerService.findFirst({
      where: {
        serviceId: serviceId, // ID do serviço genérico (canônico)
        providerId: providerId, // ID do provedor
      },
      include: { service: true } // Incluir o serviço genérico para acesso a outros dados se necessário
    });

    if (!providerService) {
      // Mensagem de erro mais específica, indicando que a combinação provedor-serviço não foi encontrada
      throw new NotFoundException(`ProviderService para o serviço canônico ID "${serviceId}" e provedor ID "${providerId}" não encontrado.`);
    }

    // Agora, usamos o preço do ProviderService encontrado
    const originalPrice = providerService.price.toNumber();
    let finalPrice = originalPrice;
    let surgeFactor = 1.0;
    let reason = 'Preço base do serviço.';

    // Regras de precificação (surge, etc.)
    const rules = await this.prisma.pricingRule.findMany({
      where: {
        isActive: true,
        // Adicionar filtros de escopo aqui se as regras de pricing tiverem escopo (GLOBAL, CITY, SERVICE, PROVIDER)
        // Por exemplo, conforme o README:
        // OR: [
        //   { scope: 'GLOBAL' },
        //   { scope: 'SERVICE', refId: providerService.serviceId }, // serviceId canônico
        //   { scope: 'PROVIDER', refId: providerId },
        //   // Adicionar CITY/CATEGORY se aplicável e se você tiver esses IDs no DTO
        // ],
        OR: [
          { dayOfWeek: null },
          { dayOfWeek: new Date(scheduledDate).getDay() },
        ],
      },
      orderBy: { createdAt: 'desc' }, // Ou por prioridade conforme o README
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
        } else { // Regra que atravessa a meia-noite
          isTimeValid = scheduledTotalMinutes >= ruleStartTotalMinutes || scheduledTotalMinutes <= ruleEndTotalMinutes;
        }
      } else if (ruleStartTime) { // Apenas hora de início
        isTimeValid = scheduledTotalMinutes >= (ruleStartTime.hours * 60 + ruleStartTime.minutes);
      } else if (ruleEndTime) { // Apenas hora de fim
        isTimeValid = scheduledTotalMinutes <= (ruleEndTime.hours * 60 + ruleEndTime.minutes);
      }

      // Adicionar validação de activeFrom/activeTo se necessário
      if (rule.activeFrom && scheduledDateTime < rule.activeFrom) {
        isTimeValid = false;
      }
      if (rule.activeTo && scheduledDateTime > rule.activeTo) {
        isTimeValid = false;
      }


      if (isTimeValid) {
        if (rule.demandThreshold) {
          // CORREÇÃO: Passar o ID do ProviderService para getDemandCountForArea
          const demandCount = await this.bookingsService.getDemandCountForArea(
            providerService.id, // <--- Usar o ID do ProviderService encontrado
            latitude,
            longitude,
            scheduledDateTime,
          );
          if (demandCount >= rule.demandThreshold) {
            surgeFactor *= rule.surgeFactor.toNumber();
            reason = 'Preço ajustado devido à alta demanda.';
          }
        } else {
          // Aplicar o surgeFactor da regra se não houver threshold de demanda ou se não for atingido
          surgeFactor *= rule.surgeFactor.toNumber();
          reason = 'Preço ajustado por regra de horário/dia.';
        }
      }
    }

    finalPrice = originalPrice * surgeFactor;
    finalPrice = parseFloat(finalPrice.toFixed(2)); // Arredondar para 2 casas decimais

    return {
      originalPrice,
      surgeFactor: parseFloat(surgeFactor.toFixed(2)),
      finalPrice,
      reason,
    };
  }

  private parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new BadRequestException(`Formato de hora inválido: ${timeString}. Esperado HH:MM.`);
    }
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