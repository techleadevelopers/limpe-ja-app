import { ForbiddenException } from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import {
  buildCreateBookingDto,
  createRequest,
  createServiceWithMocks,
} from './helpers/bookings-service.helper';
import { MetricsServiceTokenGuard } from '../../src/metrics/guards/service-token.guard';

describe('Ads-safe contract', () => {
  it('rejects booking creation when provider is not approved', async () => {
    const { service, prismaMock } = createServiceWithMocks({
      providerOverrides: {
        verificationStatus: VerificationStatus.PENDING_MANUAL_REVIEW,
      },
    });

    await expect(
      service.create('client-user', buildCreateBookingDto(), createRequest()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.address.create).not.toHaveBeenCalled();
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it('requires service token for metrics in production', () => {
    const guard = new MetricsServiceTokenGuard({
      get: (key: string) =>
        key === 'METRICS_SERVICE_TOKEN'
          ? 'secret'
          : key === 'NODE_ENV'
          ? 'production'
          : undefined,
    } as any);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(false);
  });
});
