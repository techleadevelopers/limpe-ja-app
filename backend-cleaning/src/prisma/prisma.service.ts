// src/prisma/prisma.service.ts
import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly connectionLimit: number;
  private readonly warningThreshold: number;
  private activeRequests = 0;
  private poolWarningIssued = false;

  constructor() {
    super({
      log: ['warn', 'error'], // opcional: ['query', 'info', 'warn', 'error']
    });
    this.connectionLimit = PrismaService.getConnectionLimit(
      process.env.DATABASE_URL,
    );
    const baselineThreshold = Math.max(1, Math.floor(this.connectionLimit * 0.8));
    this.warningThreshold =
      baselineThreshold >= this.connectionLimit
        ? Math.max(1, this.connectionLimit - 1)
        : baselineThreshold;
    this.attachPoolMonitor();
  }

  private attachPoolMonitor() {
    // Keep an eye on concurrent Prisma operations so we can warn before the pool maxes out.
    this.$use(async (params, next) => {
      this.activeRequests += 1;
      this.logPoolPressure();
      try {
        return await next(params);
      } finally {
        this.activeRequests -= 1;
        if (this.activeRequests < 0) {
          this.activeRequests = 0;
        }
        this.logPoolPressure(true);
      }
    });
  }

  private logPoolPressure(afterDecrement = false) {
    if (this.connectionLimit <= 0) {
      return;
    }

    const nearLimit = this.activeRequests >= this.warningThreshold;
    if (nearLimit && !this.poolWarningIssued) {
      this.logger.warn(
        `[PrismaService] pool pressure high: ${this.activeRequests}/${this.connectionLimit} concurrent requests.`,
      );
      this.poolWarningIssued = true;
    } else if (!nearLimit && this.poolWarningIssued && afterDecrement) {
      this.poolWarningIssued = false;
    }
  }

  private static getConnectionLimit(databaseUrl?: string): number {
    if (!databaseUrl) {
      return 20;
    }

    try {
      const parsed = new URL(databaseUrl);
      const limit = parsed.searchParams.get('connection_limit');
      if (limit) {
        const parsedLimit = Number(limit);
        if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
          return Math.floor(parsedLimit);
        }
      }
    } catch {
      // Caso a URL não seja válida, usamos o padrão.
    }

    return 20;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Habilita desligamento gracioso do Nest quando o Prisma emitir 'beforeExit'.
   * Inclui fallback via sinais do processo para ambientes onde o tipo do $on dá conflito.
   */
  async enableShutdownHooks(app: INestApplication) {
    // Workaround de tipagem para algumas versões do Prisma (evita TS2345 'never'):
    (this.$on as any)('beforeExit', async () => {
      await app.close();
    });

    // Fallback por segurança em ambientes diversos:
    const shutdown = async () => {
      try {
        await app.close();
      } finally {
        process.exit(0);
      }
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }
}
