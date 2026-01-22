import { ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { ObservabilityLatencyInterceptor } from './observability-latency.interceptor';
import { ObservabilityService } from './observability.service';
import { ConfigService } from '@nestjs/config';

describe('ObservabilityLatencyInterceptor', () => {
  let interceptor: ObservabilityLatencyInterceptor;
  let observabilityService: ObservabilityService;
  let configService: ConfigService;

  const createContext = (path: string, method = 'GET'): ExecutionContext => {
    const request = {
      route: { path },
      baseUrl: '',
      originalUrl: path,
      headers: {},
      method,
    };
    const response = { statusCode: 200 };

    return ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown) as ExecutionContext;
  };

  beforeEach(() => {
    observabilityService = { recordLatency: jest.fn() } as unknown as ObservabilityService;
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'observability.latency.enabled') return 'true';
        if (key === 'observability.latency.sampleRateDefault') return 0.1;
        if (key === 'observability.latency.sampleRateCritical') return 1;
        return undefined;
      }),
    } as unknown as ConfigService;

    interceptor = new ObservabilityLatencyInterceptor(observabilityService, configService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('records latency for a critical route regardless of randomness', async () => {
    const ctx = createContext('/search');
    const handler = { handle: () => of('ok') };
    await lastValueFrom(interceptor.intercept(ctx, handler as any));

    expect(observabilityService.recordLatency).toHaveBeenCalledTimes(1);
    expect(observabilityService.recordLatency).toHaveBeenCalledWith('/search', expect.any(Number));
  });

  it('respects sampling for non-critical paths', async () => {
    const ctx = createContext('/not-critical');
    const handler = { handle: () => of('ok') };
    jest.spyOn(Math, 'random').mockReturnValue(0.05);

    await lastValueFrom(interceptor.intercept(ctx, handler as any));

    expect(observabilityService.recordLatency).toHaveBeenCalledTimes(1);
    (Math.random as jest.Mock).mockRestore();
  });
});
