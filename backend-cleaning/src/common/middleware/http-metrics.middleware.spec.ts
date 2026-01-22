import { HttpMetricsMiddleware } from './http-metrics.middleware';
import { ObservabilityService } from '../../observability/observability.service';
import type { Request, Response } from 'express';

describe('HttpMetricsMiddleware', () => {
  let middleware: HttpMetricsMiddleware;
  let observabilityService: ObservabilityService;
  const finishHandlers: Array<() => void> = [];

  beforeEach(() => {
    observabilityService = new ObservabilityService();
    middleware = new HttpMetricsMiddleware(observabilityService);
    finishHandlers.length = 0;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function buildResponse(): Response {
    const res = {
      statusCode: 200,
      on(event: string, handler: () => void) {
        if (event === 'finish') {
          finishHandlers.push(handler);
        }
        return res as unknown as Response;
      },
    };
    return res as unknown as Response;
  }

  it('records latency for critical routes using normalized keys', () => {
    const recordSpy = jest.spyOn(observabilityService, 'recordLatency');
    const request = {
      method: 'GET',
      route: { path: '/bookings/:id' },
      path: '/bookings/123',
      originalUrl: '/bookings/123?foo=bar',
    } as unknown as Request;
    const response = buildResponse();
    const next = jest.fn(() => {
      finishHandlers.forEach((handler) => handler());
    });

    const hrSpy = jest.spyOn(process.hrtime, 'bigint');
    hrSpy.mockReturnValueOnce(BigInt(0));
    hrSpy.mockReturnValueOnce(BigInt(1_000_000));

    middleware.use(request, response, next as any);

    expect(recordSpy).toHaveBeenCalled();
    const [routeKey, duration] = recordSpy.mock.calls[0];
    expect(routeKey).toBe('/bookings/{id}');
    expect(duration).toBeGreaterThan(0);
  });

  it('samples non-critical routes according to probability', () => {
    const recordSpy = jest.spyOn(observabilityService, 'recordLatency');
    const request = {
      method: 'GET',
      route: { path: '/providers/list' },
      path: '/providers',
      originalUrl: '/providers?limit=10',
    } as unknown as Request;
    const response = buildResponse();
    jest.spyOn(Math, 'random').mockReturnValue(0.05);
    const next = jest.fn(() => {
      finishHandlers.forEach((handler) => handler());
    });

    const hrSpy = jest.spyOn(process.hrtime, 'bigint');
    hrSpy.mockReturnValueOnce(BigInt(100));
    hrSpy.mockReturnValueOnce(BigInt(1_000_100));

    middleware.use(request, response, next as any);

    expect(recordSpy).toHaveBeenCalled();
    const [routeKey] = recordSpy.mock.calls[0];
    expect(routeKey).toBe('/providers');
  });
});
