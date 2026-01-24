import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminObservabilityService, BUSINESS_LATENCY_CONFIGS } from './admin-observability.service';
import { ObservabilityService } from '../observability/observability.service';

describe('AdminObservabilityService', () => {
  it('aggregates business latency series and averages for the configured routes', async () => {
    const timestampA = new Date('2024-01-01T10:00:00.000Z').toISOString();
    const timestampB = new Date('2024-01-01T10:05:00.000Z').toISOString();
    const seriesMap: Record<string, Array<{ timestamp: string; latencyMs: number }>> = {
      '/auth/register/client': [
        { timestamp: timestampA, latencyMs: 100 },
        { timestamp: timestampB, latencyMs: 120 },
      ],
      '/providers/nearby': [{ timestamp: timestampA, latencyMs: 80 }],
      '/bookings': [{ timestamp: timestampB, latencyMs: 200 }],
      '/payments/webhook/pix': [],
    };
    const observabilityServiceMock = {
      getLatencySeries: jest.fn().mockImplementation((route: string) =>
        Promise.resolve(seriesMap[route] ?? []),
      ),
    };

    const service = new AdminObservabilityService(
      {} as PrismaService,
      {} as CacheService,
      observabilityServiceMock as unknown as ObservabilityService,
      {} as ConfigService,
    );

    service['checkDbLatency'] = jest.fn().mockResolvedValue(0);
    service['estimateActiveSessions'] = jest.fn().mockResolvedValue(0);
    service['computeInsuranceConversion'] = jest.fn().mockResolvedValue({
      completedBookings: 0,
      insuredBookings: 0,
      insuredRate: 0,
      breakdown: [],
    });
    service['fetchSentrySnapshot'] = jest.fn().mockResolvedValue({
      totalUnresolved: 0,
      crashFreeSessions: null,
      byPlatform: { android: 0, ios: 0, other: 0 },
      recentIssues: [],
    });

    const snapshot = await service.getSnapshot();

    expect(observabilityServiceMock.getLatencySeries).toHaveBeenCalledTimes(
      BUSINESS_LATENCY_CONFIGS.length,
    );
    BUSINESS_LATENCY_CONFIGS.forEach((config) => {
      expect(observabilityServiceMock.getLatencySeries).toHaveBeenCalledWith(
        config.route,
        { windowHours: 6, points: 12 },
      );
    });

    expect(snapshot.latencySeries).toEqual([
      {
        timestamp: timestampA,
        registerLatency: 100,
        radiusLatency: 80,
        criticalAverage: 90,
      },
      {
        timestamp: timestampB,
        registerLatency: 120,
        bookingLatency: 200,
        criticalAverage: 160,
      },
    ]);
    expect(snapshot.latencyAverages).toEqual({
      registerLatency: 110,
      radiusLatency: 80,
      bookingLatency: 200,
    });
  });
});
