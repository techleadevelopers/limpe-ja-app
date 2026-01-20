import { InsuranceService } from './insurance.service';

describe('InsuranceService', () => {
  let service: InsuranceService;

  beforeEach(() => {
    service = new InsuranceService();
  });

  it('applies risk caps and collects eligibility reasons for restricted plans', () => {
    const plans = service.getPlans({
      clientCompleted: 0,
      estimateTotalCents: 60000,
      provider: {
        rating: 4.2,
        newProvider: true,
        completedBookings: 2,
      },
    });

    const essential = plans.find((plan) => plan.id === 'ESSENCIAL');
    expect(essential?.finalPriceCents).toBe(Math.round(2490 * 1.4));
    expect(essential?.eligible).toBe(true);

    const premium = plans.find((plan) => plan.id === 'PREMIUM');
    expect(premium?.eligible).toBe(false);
    expect(premium?.reasons).toContain(
      'Premium requires at least 2 completed client bookings.',
    );

    const total = plans.find((plan) => plan.id === 'TOTAL');
    expect(total?.eligible).toBe(false);
    expect(total?.reasons).toContain(
      'Total requires at least 5 completed client bookings.',
    );
    expect(total?.reasons).toContain(
      'Total requires a provider rating of 4.85 or higher.',
    );
  });

  it('marks premium and total eligible when requirements are met and no extra risk applies', () => {
    const plans = service.getPlans({
      clientCompleted: 5,
      estimateTotalCents: 35000,
      provider: {
        rating: 4.95,
        newProvider: false,
        completedBookings: 10,
      },
    });

    const premium = plans.find((plan) => plan.id === 'PREMIUM');
    const total = plans.find((plan) => plan.id === 'TOTAL');

    expect(premium?.eligible).toBe(true);
    expect(premium?.reasons).toHaveLength(0);
    expect(premium?.finalPriceCents).toBe(5990);

    expect(total?.eligible).toBe(true);
    expect(total?.reasons).toHaveLength(0);
    expect(total?.finalPriceCents).toBe(9990);
  });
});
