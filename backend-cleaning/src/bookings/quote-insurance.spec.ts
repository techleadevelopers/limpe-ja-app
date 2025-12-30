import { BookingQuoteRequestDto } from './dto/quote-request.dto';
import { InsurancePlanId } from '../insurance/insurance.constants';
import { createRequest, createServiceWithMocks } from '../../test/unit/helpers/bookings-service.helper';

describe('BookingsService quote insurance flow', () => {
  const baseRequest = (): BookingQuoteRequestDto => ({
    providerId: 'provider-id',
    providerServiceId: 'provider-service-id',
    scheduledDate: '2025-12-31',
    scheduledTime: '10:00',
    address: {
      cep: '01001000',
      city: 'Sao Paulo',
      state: 'SP',
      latitude: -23.55052,
      longitude: -46.633308,
    },
  });

  it('adds the insurance fee when the selected plan is eligible', async () => {
    const { service } = createServiceWithMocks({
      dynamicPrice: 100,
      clientCompletedBookingsCount: 3,
      providerCompletedBookingsCount: 10,
      providerRating: 5,
    });

    const response = await service.quotePrice(
      'client-user',
      {
        ...baseRequest(),
        insurancePlanId: InsurancePlanId.ESSENCIAL,
      },
      createRequest(),
    );

    expect(response.selectedInsurance?.id).toBe(InsurancePlanId.ESSENCIAL);
    expect(response.insuranceFeeCents).toBeGreaterThan(0);
    expect(response.insuranceOptions.length).toBeGreaterThan(0);
    expect(response.totalCents).toBe(Math.round(response.finalPrice * 100));
    expect(response.breakdown.some((item) => item.type === 'insurance')).toBe(true);
  });

  it('returns null selectedInsurance when the plan is not eligible', async () => {
    const { service } = createServiceWithMocks({
      dynamicPrice: 200,
      clientCompletedBookingsCount: 0,
      providerCompletedBookingsCount: 10,
      providerRating: 5,
    });

    const response = await service.quotePrice(
      'client-user',
      {
        ...baseRequest(),
        durationMinutes: 60,
        insurancePlanId: InsurancePlanId.PREMIUM,
      },
      createRequest(),
    );

    expect(response.selectedInsurance).toBeNull();
    const premiumPlan = response.insuranceOptions.find(
      (option) => option.id === InsurancePlanId.PREMIUM,
    );
    expect(premiumPlan?.eligible).toBe(false);
    expect(premiumPlan?.reasons).toContain(
      'Premium requires at least 2 completed client bookings.',
    );
    expect(response.insuranceFeeCents).toBe(0);
  });
});
