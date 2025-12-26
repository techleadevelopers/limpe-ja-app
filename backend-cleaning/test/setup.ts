import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { QueuesService } from '../src/queues/queues.service';
import { RedisLockService } from '../src/common/locks/redis-lock.service';

jest.setTimeout(120_000);

const applyEnv = (variables: Record<string, string | undefined>) => {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(variables)) {
    previous[key] = process.env[key];
    const value = variables[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return () => {
    for (const key of Object.keys(variables)) {
      const prior = previous[key];
      if (prior === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prior;
      }
    }
  };
};

const noopAsync = async () => null;

const createNoopQueuesService = (): QueuesService =>
  new Proxy(
    {},
    {
      get: () => noopAsync,
    },
  ) as unknown as QueuesService;

export interface TestAppContext {
  app: INestApplication;
  request: request.SuperTest<request.Test>;
  prisma: PrismaService;
  jwtService: JwtService;
  close: () => Promise<void>;
}

export async function bootstrapTestApp(
  overrides: Record<string, string | undefined> = {},
): Promise<TestAppContext> {
  const seedEnv: Record<string, string | undefined> = {
    NODE_ENV: process.env.NODE_ENV ?? 'test',
    DATABASE_URL:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/relax_test',
    JWT_SECRET: process.env.JWT_SECRET ?? 'test-jwt-secret',
    JWT_EXPIRATION_TIME: process.env.JWT_EXPIRATION_TIME ?? '1h',
    PIX_WEBHOOK_SECRET: process.env.PIX_WEBHOOK_SECRET ?? 'pix-secret',
    PSP_WEBHOOK_SECRET: process.env.PSP_WEBHOOK_SECRET ?? 'psp-secret',
    MIN_SERVICE_MINUTES: process.env.MIN_SERVICE_MINUTES ?? '15',
    REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
    CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS ?? '600',
    API_BASE_URL: process.env.API_BASE_URL ?? 'http://localhost',
  };
  const restoreEnv = applyEnv({ ...seedEnv, ...overrides });

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(RedisLockService)
    .useValue({
      acquireLock: async () => true,
      releaseLock: async () => true,
    })
    .overrideProvider(QueuesService)
    .useValue(createNoopQueuesService())
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return {
    app,
    request: request(app.getHttpServer()),
    prisma: moduleFixture.get(PrismaService),
    jwtService: moduleFixture.get(JwtService),
    close: async () => {
      await app.close();
      restoreEnv();
    },
  };
}
