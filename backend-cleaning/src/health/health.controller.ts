import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('liveness')
  liveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  async readiness() {
    try {
      // Checa conexão com o banco
      await this.prisma.$queryRaw`SELECT 1`;

      // Checa cache (set/get simples)
      const cacheKey = 'health:ping';
      await this.cacheService.set(cacheKey, 'pong', 5);
      const cacheValue = await this.cacheService.get<string>(cacheKey);

      const cacheOk = cacheValue === 'pong';

      return {
        status: 'ok',
        db: 'up',
        cache: cacheOk ? 'up' : 'degraded',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new ServiceUnavailableException({
        status: 'error',
        message: 'Readiness check failed',
        reason: error?.message ?? 'unknown',
      });
    }
  }
}
