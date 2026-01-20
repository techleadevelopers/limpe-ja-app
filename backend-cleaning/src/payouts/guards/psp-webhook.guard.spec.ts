import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { PspWebhookGuard } from './psp-webhook.guard';
import { generatePspSignatureVariants } from '../utils/psp-webhook-signature.util';

describe('PspWebhookGuard', () => {
  const payload = JSON.stringify({ test: 'payload' });
  const eventId = 'event-123';
  const secret = 'shh-secret';
  const signature = Array.from(
    generatePspSignatureVariants(payload, secret),
  )[0];

  const mockExecutionContext = (
    request: unknown,
    response?: unknown,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    }) as ExecutionContext;

  const buildRequest = (
    headers: Record<string, string>,
    body?: Record<string, unknown>,
  ) => ({
    headers,
    rawBody: payload,
    body: body ?? JSON.parse(payload),
    get(name: string) {
      return this.headers[name];
    },
  });

  const timestampHeader = (overrideMs?: number) =>
    (overrideMs ?? Date.now()).toString();

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    headersSent: false,
  });

  let configService: ConfigService;
  let cacheService: CacheService;
  let guard: PspWebhookGuard;
  let prismaService: any;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'PSP_WEBHOOK_REPLAY_TTL_SECONDS') {
          return '60';
        }
        if (key === 'PSP_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS') {
          return '60';
        }
        if (key === 'psp.webhookSecret') {
          return secret;
        }
        return defaultValue;
      }),
    } as unknown as ConfigService;
    cacheService = {
      setIfNotExists: jest.fn(),
    } as unknown as CacheService;
    prismaService = {
      webhookReplay: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(null),
      },
    };
    guard = new PspWebhookGuard(configService, cacheService, prismaService);
  });

  it('rejects requests without event id', async () => {
    const request = buildRequest(
      { 'x-signature': signature },
      { eventId: undefined },
    );
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects requests when secret missing', async () => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'PSP_WEBHOOK_REPLAY_TTL_SECONDS') return '60';
      if (key === 'PSP_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS') return '300';
      return undefined;
    });
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
      'x-event-time': timestampHeader(),
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects invalid signatures', async () => {
    (cacheService.setIfNotExists as jest.Mock).mockResolvedValue(false);
    const request = buildRequest({
      'x-signature': 'wrong',
      'x-event-id': eventId,
      'x-event-time': timestampHeader(),
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects timestamp outside tolerance', async () => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'PSP_WEBHOOK_REPLAY_TTL_SECONDS') return '60';
      if (key === 'PSP_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS') return '1';
      if (key === 'psp.webhookSecret') return secret;
      return undefined;
    });
    const now = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    const past = (now - 10 * 60 * 1000).toString();
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
      'x-event-time': past,
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).rejects.toThrow(BadRequestException);
    nowSpy.mockRestore();
  });

  it('rejects requests without timestamp information', async () => {
    (cacheService.setIfNotExists as jest.Mock).mockResolvedValue(true);
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid timestamp formats', async () => {
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
      'x-event-time': 'not-a-time',
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts timestamps expressed in seconds', async () => {
    const now = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    (cacheService.setIfNotExists as jest.Mock).mockResolvedValue(true);
    const seconds = Math.floor(now / 1000).toString();
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
      'x-event-time': seconds,
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).resolves.toBe(true);
    nowSpy.mockRestore();
  });

  it('accepts ISO timestamp strings', async () => {
    const now = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    (cacheService.setIfNotExists as jest.Mock).mockResolvedValue(true);
    const iso = new Date(now).toISOString();
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
      'x-event-time': iso,
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).resolves.toBe(true);
    nowSpy.mockRestore();
  });

  it('enforces production minimum tolerance clamp', async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'PSP_WEBHOOK_REPLAY_TTL_SECONDS') return '60';
      if (key === 'PSP_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS') return '1';
      if (key === 'psp.webhookSecret') return secret;
      return undefined;
    });
    const now = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    (cacheService.setIfNotExists as jest.Mock).mockResolvedValue(true);
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
      'x-event-time': (now - 9_000).toString(),
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).resolves.toBe(true);
    nowSpy.mockRestore();
    process.env.NODE_ENV = previousEnv;
  });

  it('rejects delta outside clamped production tolerance', async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'PSP_WEBHOOK_REPLAY_TTL_SECONDS') return '60';
      if (key === 'PSP_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS') return '1';
      if (key === 'psp.webhookSecret') return secret;
      return undefined;
    });
    const now = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
      'x-event-time': (now - 11_000).toString(),
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).rejects.toThrow(BadRequestException);
    nowSpy.mockRestore();
    process.env.NODE_ENV = previousEnv;
  });

  it('limits tolerance to 300s even when config asks for more', async () => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'PSP_WEBHOOK_REPLAY_TTL_SECONDS') return '60';
      if (key === 'PSP_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS') return '9999';
      if (key === 'psp.webhookSecret') return secret;
      return undefined;
    });
    const now = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
      'x-event-time': (now - 400_000).toString(),
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).rejects.toThrow(BadRequestException);
    nowSpy.mockRestore();
  });

  it('responds 200 when replay detected', async () => {
    (cacheService.setIfNotExists as jest.Mock).mockResolvedValue(false);
    const response = mockResponse();
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': eventId,
      'x-event-time': timestampHeader(),
    });
    await expect(
      guard.canActivate(mockExecutionContext(request, response)),
    ).resolves.toBe(false);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(response.json).toHaveBeenCalledWith({ ok: true, replay: true });
  });

  it('allows valid requests and caches normalized event id', async () => {
    (cacheService.setIfNotExists as jest.Mock).mockResolvedValue(true);
    const request = buildRequest({
      'x-signature': signature,
      'x-event-id': '  EVENT-123  ',
      'x-event-time': timestampHeader(),
    });
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).resolves.toBe(true);
    expect(cacheService.setIfNotExists).toHaveBeenCalledWith(
      'webhook:psp:unknown:event-123',
      true,
      60,
    );
  });

  it('falls back to payload id', async () => {
    (cacheService.setIfNotExists as jest.Mock).mockResolvedValue(true);
    const request = buildRequest(
      {
        'x-signature': signature,
        'x-event-time': timestampHeader(),
      },
      { transaction: { id: 'payload-event-456' } },
    );
    await expect(
      guard.canActivate(mockExecutionContext(request)),
    ).resolves.toBe(true);
    expect(cacheService.setIfNotExists).toHaveBeenCalledWith(
      'webhook:psp:unknown:payload-event-456',
      true,
      60,
    );
  });
});
