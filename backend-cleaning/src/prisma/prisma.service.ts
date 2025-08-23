// src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['warn', 'error'], // opcional: ['query', 'info', 'warn', 'error']
    });
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
