import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminObservabilityService } from './admin-observability.service';
import { ObservabilityService } from '../observability/observability.service';
import { LATENCY_CRITICAL_ROUTES } from '../observability/latency-route-config';

describe('AdminObservabilityService', () => {
  it('builds latencySeriesByRoute for all configured routes and keeps defaults', async () => {
    const sampleTimestamp = new Date().toISOString();
    const expectedSeries = [
      { timestamp: sampleTimestamp, latencyMs: 12 },
    ];
    const observabilityServiceMock = {
      getLatencySeries: jest
        .fn()
        .mockImplementation((route: string) =>
          Promise.resolve(
            route === LATENCY_CRITICAL_ROUTES[0] ? expectedSeries : [],
          ),
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
      LATENCY_CRITICAL_ROUTES.length,
    );
    LATENCY_CRITICAL_ROUTES.forEach((route) => {
      expect(observabilityServiceMock.getLatencySeries).toHaveBeenCalledWith(
        route,
        { windowHours: 6, points: 12 },
      );
    });

    expect(snapshot.latencySeriesByRoute).toEqual(
      LATENCY_CRITICAL_ROUTES.reduce<Record<string, any>>((acc, route) => {
        acc[route] = route === LATENCY_CRITICAL_ROUTES[0] ? expectedSeries : [];
        return acc;
      }, {}),
    );
    expect(snapshot.latencySeries).toBe(snapshot.latencySeriesByRoute[LATENCY_CRITICAL_ROUTES[0]]);
  });
});
