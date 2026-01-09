export enum InsurancePlanId {
  ESSENCIAL = 'ESSENCIAL',
  PREMIUM = 'PREMIUM',
  TOTAL = 'TOTAL',
}

export interface InsurancePlanDefinition {
  id: InsurancePlanId;
  name: string;
  basePriceCents: number;
  coverageCents: number;
  deductibleCents: number;
  proofRequired: boolean;
}

export const INSURANCE_PLANS: InsurancePlanDefinition[] = [
  {
    id: InsurancePlanId.ESSENCIAL,
    name: 'Essencial',
    basePriceCents: 3290,
    coverageCents: 70000,
    deductibleCents: 20000,
    proofRequired: false,
  },
  {
    id: InsurancePlanId.PREMIUM,
    name: 'Premium',
    basePriceCents: 5990,
    coverageCents: 350000,
    deductibleCents: 30000,
    proofRequired: false,
  },
  {
    id: InsurancePlanId.TOTAL,
    name: 'Total',
    basePriceCents: 9990,
    coverageCents: 1000000,
    deductibleCents: 50000,
    proofRequired: true,
  },
];

export const INSURANCE_PLAN_IDS: InsurancePlanId[] = INSURANCE_PLANS.map(
  (plan) => plan.id,
);
