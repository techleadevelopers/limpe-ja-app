import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { MIN_HOURLY_MINUTES } from '../common/constants/pricing';

describe('PricingController', () => {
  let controller: PricingController;

  beforeEach(() => {
    const pricingServiceMock = {} as PricingService;
    controller = new PricingController(pricingServiceMock);
  });

  it('returns public pricing config with min hourly minutes', async () => {
    const result = await controller.getPublicPricingConfig();

    expect(result).toEqual({
      minHourlyMinutes: MIN_HOURLY_MINUTES,
      currency: 'BRL',
    });
  });
});
