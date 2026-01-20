import { Controller, Get, Query } from '@nestjs/common';
import {
  InsurancePlansInput,
  InsuranceProviderProfile,
  InsuranceService,
} from './insurance.service';

interface GetInsurancePlansQuery {
  clientCompleted?: string;
  estimateTotalCents?: string;
  providerRating?: string;
  providerCompletedBookings?: string;
  providerNewProvider?: string;
}

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get('plans')
  getPlans(@Query() query: GetInsurancePlansQuery) {
    return this.insuranceService.getPlans(this.buildInput(query));
  }

  private buildInput(query: GetInsurancePlansQuery): InsurancePlansInput {
    return {
      clientCompleted: this.toNumber(query.clientCompleted),
      estimateTotalCents: this.toNumber(query.estimateTotalCents),
      provider: this.buildProvider(query),
    };
  }

  private buildProvider(
    query: GetInsurancePlansQuery,
  ): InsuranceProviderProfile {
    return {
      rating: this.toNumber(query.providerRating),
      completedBookings: this.toNumber(query.providerCompletedBookings),
      newProvider: this.toBoolean(query.providerNewProvider),
    };
  }

  private toNumber(value?: string): number {
    if (!value) {
      return 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toBoolean(value?: string): boolean {
    if (!value) {
      return false;
    }
    const lowered = value.toLowerCase();
    return lowered === 'true' || lowered === '1';
  }
}
