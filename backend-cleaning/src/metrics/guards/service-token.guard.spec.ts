import { MetricsServiceTokenGuard } from './service-token.guard';
import { ExecutionContext } from '@nestjs/common';

const createGuard = (overrides: {
  token?: string;
  nodeEnv?: string;
  allowInsecure?: string;
}) => {
  const values: Record<string, string | undefined> = {
    METRICS_SERVICE_TOKEN: overrides.token,
    NODE_ENV: overrides.nodeEnv,
    ALLOW_INSECURE_METRICS: overrides.allowInsecure,
  };
  const configServiceMock = {
    get: jest.fn((key: string) => values[key]),
  };
  return new MetricsServiceTokenGuard(configServiceMock as any);
};

const createContextWithHeaders = (
  headers: Record<string, string> = {},
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
      getResponse: () => ({}),
      getNext: () => () => {},
    }),
    switchToRpc: () => ({
      getContext: () => null,
      getData: () => null,
    }),
    switchToWs: () => ({
      getClient: () => null,
      getData: () => null,
    }),
    getClass: () => null,
    getHandler: () => null,
    getArgs: () => [],
    getArgByIndex: () => undefined,
    getType: () => 'http',
  }) as unknown as ExecutionContext;

describe('MetricsServiceTokenGuard', () => {
  it('denies access in production when token header is missing', () => {
    const guard = createGuard({ token: 'secret', nodeEnv: 'production' });
    const context = createContextWithHeaders();

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access when token header is invalid', () => {
    const guard = createGuard({ token: 'secret', nodeEnv: 'production' });
    const context = createContextWithHeaders({ 'x-service-token': 'invalid' });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows access when token matches in production', () => {
    const guard = createGuard({ token: 'secret', nodeEnv: 'production' });
    const context = createContextWithHeaders({ 'x-service-token': 'secret' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access in non-production when insecure flag is true', () => {
    const guard = createGuard({
      token: 'secret',
      nodeEnv: 'development',
      allowInsecure: 'true',
    });
    const context = createContextWithHeaders();

    expect(guard.canActivate(context)).toBe(true);
  });
});
