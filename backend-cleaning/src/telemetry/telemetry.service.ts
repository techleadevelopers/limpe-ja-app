import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryEventsService } from './telemetry.events.service';
import { TelemetryAnomalyPayload } from './telemetry.types';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly threshold = 5;
  private readonly windowSeconds = 10;
  private readonly anomalyCooldownSeconds = 60;
  private readonly forceLogoutSafeTtlSeconds = 180;
  private readonly forceLogoutPayloadTtlSeconds = 180;
  private readonly forceLogoutPayloadSuffix = ':payload';

  constructor(
    private readonly cacheService: CacheService,
    private readonly events: TelemetryEventsService,
    private readonly prisma: PrismaService,
  ) {}

  async recordRequest(
    userId: string | undefined,
    rawPath: string,
  ): Promise<void> {
    if (!userId || !rawPath) {
      return;
    }

    const path = this.normalizePath(rawPath);
    const key = this.buildCounterKey(userId, path);
    const count = await this.incrementCounter(key);

    this.logger.debug(
      `[TelemetryService] ${userId} chamou ${path} ${count} vezes em ${this.windowSeconds}s`,
    );

    if (count <= this.threshold) {
      return;
    }

    const anomalyKey = this.buildAnomalyLockKey(userId, path);
    const alreadyNotified = await this.cacheService.get<boolean>(anomalyKey);
    if (alreadyNotified) {
      this.logger.debug(
        `[TelemetryService] Anomalia ja reportada para ${userId}${path} (cooldown)`,
      );
      return;
    }

    await this.cacheService.set(anomalyKey, true, this.anomalyCooldownSeconds);

    const payload: TelemetryAnomalyPayload = {
      userId,
      path,
      count,
      windowSeconds: this.windowSeconds,
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(
      `[TelemetryService] Disparando evento AnomaliaDetectada para ${userId} (${count}x em ${this.windowSeconds}s)`,
    );
    this.events.publishAnomaly(payload);
  }

  private normalizePath(value: string): string {
    const raw = value.split('?')[0].trim();
    if (!raw) {
      return '/';
    }
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    return normalized.toLowerCase();
  }

  private buildCounterKey(userId: string, path: string): string {
    return `telemetry:request:${userId}:${path}`;
  }

  private buildAnomalyLockKey(userId: string, path: string): string {
    return `telemetry:anomaly:${userId}:${path}`;
  }

  async markForceLogout(userId: string, ttlSeconds = 300): Promise<void> {
    if (!userId) {
      return;
    }

    const key = this.buildForceLogoutKey(userId);
    const payloadKey = this.buildForceLogoutPayloadKey(userId);
    await this.cacheService.del(key);
    await this.cacheService.del(payloadKey);
    await this.cacheService.set(key, true, ttlSeconds);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    try {
      await this.prisma.telemetryForceLogout.upsert({
        where: { userId },
        update: {
          forceLogoutUntil: expiresAt,
          forcedAt: new Date(),
        },
        create: {
          userId,
          forceLogoutUntil: expiresAt,
        },
      });
    } catch (error) {
      this.logger.error(
        `[TelemetryService] markForceLogout: falha ao persistir logout forçado para ${userId}: ${
          (error as Error).message ?? error
        }`,
      );
    }
    this.logger.warn(
      `[TelemetryService] markForceLogout: usuário ${userId} bloqueado automaticamente por ${ttlSeconds}s`,
    );
  }

  private buildForceLogoutKey(userId: string): string {
    return `telemetry:force-logout:${userId}`;
  }

  buildForceLogoutPayloadKey(userId: string): string {
    return `${this.buildForceLogoutKey(userId)}${this.forceLogoutPayloadSuffix}`;
  }

  private async incrementCounter(key: string): Promise<number> {
    const redis = this.cacheService.getRedisClient();
    if (redis && redis.isOpen) {
      try {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, this.windowSeconds);
        }
        return Number(count);
      } catch (error) {
        this.logger.error(
          `[TelemetryService] Redis error incrementing ${key}: ${(error as Error).message}`,
        );
      }
    }

    const existing = await this.cacheService.get<number>(key);
    const next = (existing ?? 0) + 1;
    await this.cacheService.set(key, next, this.windowSeconds);
    return next;
  }
}
