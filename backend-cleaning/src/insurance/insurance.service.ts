import { Injectable } from '@nestjs/common';
import { INSURANCE_PLANS, InsurancePlanDefinition, InsurancePlanId } from './insurance.constants';

const RISK_CAP = 0.4;

export interface InsuranceProviderProfile {
  rating?: number;
  completedBookings?: number;
  newProvider?: boolean;
}

interface NormalizedProviderProfile {
  rating: number;
  completedBookings: number;
  newProvider: boolean;
}

interface InsurancePlansCalculationContext {
  clientCompleted: number;
  estimateTotalCents: number;
  provider: NormalizedProviderProfile;
}

export interface InsurancePlansInput {
  clientCompleted?: number;
  estimateTotalCents?: number;
  provider?: InsuranceProviderProfile;
}

export interface InsurancePlanProposal extends InsurancePlanDefinition {
  finalPriceCents: number;
  eligible: boolean;
  reasons: string[];
  riskMultiplierBps: number;
}

@Injectable()
export class InsuranceService {
  getPlans(input: InsurancePlansInput): InsurancePlanProposal[] {
    const normalizedInput = this.normalizeInput(input);
    const { clientCompleted, estimateTotalCents, provider } = normalizedInput;
    const riskModifier = this.calculateRiskModifier(clientCompleted, estimateTotalCents, provider);
    const riskMultiplierBps = Math.round(riskModifier * 10000);

    return INSURANCE_PLANS.map((plan) => {
      const { eligible, reasons } = this.evaluateEligibility();
      return {
        ...plan,
        finalPriceCents: this.applyRisk(plan.basePriceCents, riskModifier),
        eligible,
        reasons,
        riskMultiplierBps,
      };
    });
  }

  private normalizeInput(input: InsurancePlansInput): InsurancePlansCalculationContext {
    return {
      clientCompleted: this.toNonNegativeNumber(input.clientCompleted),
      estimateTotalCents: this.toNonNegativeNumber(input.estimateTotalCents),
      provider: this.normalizeProvider(input.provider),
    };
  }

  private normalizeProvider(provider?: InsuranceProviderProfile): NormalizedProviderProfile {
    return {
      rating: this.toNonNegativeNumber(provider?.rating),
      completedBookings: this.toNonNegativeNumber(provider?.completedBookings),
      newProvider: provider?.newProvider ?? false,
    };
  }

  private evaluateEligibility(): { eligible: true; reasons: string[] } {
    return {
      eligible: true,
      reasons: [],
    };
  }

  private calculateRiskModifier(
    clientCompleted: number,
    estimateTotalCents: number,
    provider: NormalizedProviderProfile,
  ) {
    let modifier = 0;

    if (clientCompleted === 0) {
      modifier += 0.2;
    }

    if (estimateTotalCents >= 50000) {
      modifier += 0.1;
    }

    if (provider.newProvider || provider.completedBookings < 5) {
      modifier += 0.1;
    }

    return Math.min(modifier, RISK_CAP);
  }

  private applyRisk(basePriceCents: number, riskModifier: number) {
    return Math.round(basePriceCents * (1 + riskModifier));
  }

  private toNonNegativeNumber(value?: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, value);
  }
}
