import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { BookingStatus } from '@prisma/client';
import { ObservabilityService } from '../observability/observability.service';
import { ConfigService } from '@nestjs/config';
import { normalizeRouteKey } from '../observability/route-normalizer';
import axios, { isAxiosError } from 'axios';
import type { RedisClientType } from '@redis/client';

interface InsuranceBucket {
  label: string;
  cents: number;
}

interface InsuranceBreakdownPoint {
  label: string;
  count: number;
  percentageOfCompleted: number;
}

interface InsuranceConversionStats {
  completedBookings: number;
  insuredBookings: number;
  insuredRate: number;
  breakdown: InsuranceBreakdownPoint[];
}

interface SentryIssueSummary {
  id: string;
  title: string;
  platform: string;
  lastSeen: string;
}

interface SentryObservabilityPayload {
  totalUnresolved: number;
  crashFreeSessions: number | null;
  byPlatform: {
    android: number;
    ios: number;
    other: number;
  };
  recentIssues: SentryIssueSummary[];
  projectHealth?: Record<string, any>;
}

interface SentryObservabilityError {
  error: {
    message: string;
    statusCode?: number;
  };
}

type SentryObservabilityResult =
  | SentryObservabilityPayload
  | SentryObservabilityError;

interface MemoryUsageSnapshot {
  rssMb: number;
  heapUsedMb: number;
  heapTotalMb: number;
}

export interface AdminHealthSnapshot {
  status: 'ok' | 'degraded';
  timestamp: string;
  db: {
    status: 'up' | 'down';
    latencyMs: number;
  };
  memory: MemoryUsageSnapshot;
  activeSessions: number;
  insuranceConversion: InsuranceConversionStats;
  latencySeries: Array<{ timestamp: string; latencyMs: number }>;
  sentry: SentryObservabilityResult;
}

@Injectable()
export class AdminObservabilityService {
  private readonly logger = new Logger(AdminObservabilityService.name);
  private readonly insuranceBuckets: InsuranceBucket[] = [
    { label: 'R$ 59', cents: 5900 },
    { label: 'R$ 99', cents: 9900 },
    { label: 'R$ 199', cents: 19900 },
  ];
  private readonly sentryCacheKey = 'observability:sentry';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly observabilityService: ObservabilityService,
    private readonly configService: ConfigService,
  ) {}

  async getSnapshot(routeKey?: string): Promise<AdminHealthSnapshot> {
    try {
      const dbLatencyPromise = this.checkDbLatency()
        .then((value) => ({ ok: true, value }))
        .catch((reason) => {
          this.logger.warn(
            `[AdminHealth] Falha ao medir latência do DB: ${String(reason)}`,
          );
          return { ok: false, value: 0 };
        });

      const [
        dbLatencyResult,
        activeSessions,
        insuranceConversion,
        latencySeries,
      ] = await Promise.all([
        dbLatencyPromise,
        this.estimateActiveSessions().catch(() => 0),
        this.computeInsuranceConversion().catch(() => ({
          completedBookings: 0,
          insuredBookings: 0,
          insuredRate: 0,
          breakdown: [],
        })),
        Promise.resolve(
          this.observabilityService.getLatencySeries(
            normalizeRouteKey(routeKey ?? '/search'),
            {
              windowHours: 6,
              points: 12,
            },
          ),
        ).catch(() => []),
      ]);

      const memory = process.memoryUsage();
      const sentrySnapshot = await this.fetchSentrySnapshot().catch(() =>
        this.buildSentryError('Sentry Offline'),
      );

      const dbHealthy = dbLatencyResult.ok;
      const dbLatency = dbLatencyResult.value;

      return {
        status: dbHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        db: {
          status: dbHealthy ? 'up' : 'down',
          latencyMs: dbLatency,
        },
        memory: {
          heapUsedMb: memory.heapUsed / 1024 / 1024,
          heapTotalMb: memory.heapTotal / 1024 / 1024,
          rssMb: memory.rss / 1024 / 1024,
        },
        activeSessions,
        insuranceConversion,
        latencySeries,
        sentry: sentrySnapshot,
      };
    } catch (error) {
      this.logger.error('Falha crítica no Snapshot', error);
      return this.getFallbackSnapshot();
    }
  }

  private getFallbackSnapshot(): AdminHealthSnapshot {
    const memory = process.memoryUsage();
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      db: {
        status: 'down',
        latencyMs: 0,
      },
      memory: {
        heapUsedMb: memory.heapUsed / 1024 / 1024,
        heapTotalMb: memory.heapTotal / 1024 / 1024,
        rssMb: memory.rss / 1024 / 1024,
      },
      activeSessions: 0,
      insuranceConversion: {
        completedBookings: 0,
        insuredBookings: 0,
        insuredRate: 0,
        breakdown: [],
      },
      latencySeries: [],
      sentry: this.buildSentryError('Snapshot indisponível'),
    };
  }

  // Criar este método auxiliar para medir o DB isoladamente
  private async checkDbLatency(): Promise<number> {
    const dbStart = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    return Number((Date.now() - dbStart).toFixed(2));
  }

  private async computeInsuranceConversion(): Promise<InsuranceConversionStats> {
    const completedBookings = await this.prisma.booking.count({
      where: { status: BookingStatus.FINISHED },
    });

    const grouped = await this.prisma.bookingInsurance.groupBy({
      by: ['priceCents'],
      where: {
        booking: {
          status: BookingStatus.FINISHED,
        },
      },
      _count: {
        bookingId: true,
      },
    });

    const insuredBookings = grouped.reduce(
      (sum, item) => sum + item._count.bookingId,
      0,
    );

    const breakdown: InsuranceBreakdownPoint[] = this.insuranceBuckets.map(
      (bucket) => {
        const bucketItem = grouped.find(
          (entry) => entry.priceCents === bucket.cents,
        );
        const count = bucketItem ? bucketItem._count.bookingId : 0;
        const percentageOfCompleted = completedBookings
          ? Number(((count / completedBookings) * 100).toFixed(2))
          : 0;
        return {
          label: bucket.label,
          count,
          percentageOfCompleted,
        };
      },
    );

    return {
      completedBookings,
      insuredBookings,
      insuredRate: completedBookings
        ? Number(((insuredBookings / completedBookings) * 100).toFixed(2))
        : 0,
      breakdown,
    };
  }

  private async estimateActiveSessions(): Promise<number> {
    const redis = this.cacheService.getRedisClient();
    if (!redis) {
      return 0;
    }

    try {
      // Tenta primeiro contar chaves de sessão (se existirem)
      const keys = await redis.keys('sess:*'); // Ajustar o prefixo se necessário
      if (keys.length > 0) {
        return keys.length;
      }

      // Se falhar, pega o número de conexões ativas no servidor Redis
      const info = await redis.info('clients');
      const match = info.match(/connected_clients:(\d+)/);
      return match ? Number(match[1]) : 0;
    } catch (error) {
      this.logger.error('Erro ao puxar sessões do Redis', error);
      return 0;
    }
  }

  private async fetchSentrySnapshot(): Promise<SentryObservabilityResult> {
    const sentryConfig = this.configService.get<{
      apiToken?: string;
      orgSlug?: string;
      projectSlug?: string;
      apiBaseUrl?: string;
    }>('sentry');
    const token = sentryConfig?.apiToken?.trim();
    const orgSlug = sentryConfig?.orgSlug?.trim();
    const projectSlug = sentryConfig?.projectSlug?.trim();
    const baseUrl =
      sentryConfig?.apiBaseUrl?.trim() || 'https://sentry.io/api/0';

    const missing: string[] = [];
    if (!token) missing.push('SENTRY_API_TOKEN');
    if (!orgSlug) missing.push('SENTRY_API_ORG_SLUG');
    if (!projectSlug) missing.push('SENTRY_API_PROJECT_SLUG');

    if (missing.length > 0) {
      const message = `Credenciais do Sentry ausentes: ${missing.join(', ')}`;
      this.logger.warn(`[AdminHealth] ${message}`);
      return this.buildSentryError(message);
    }

    const cached = await this.cacheService.get<SentryObservabilityResult>(
      this.sentryCacheKey,
    );
    if (cached) {
      return cached;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const safeStringify = (value: unknown) => {
      try {
        if (value === null || value === undefined) {
          return String(value);
        }
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    };

    try {
      const issuesUrl = `${baseUrl}/projects/${orgSlug}/${projectSlug}/issues/`;
      const projectUrl = `${baseUrl}/projects/${orgSlug}/${projectSlug}/`;
      const [issuesResponse, projectResponse] = await Promise.all([
        axios.get(issuesUrl, {
          headers,
          params: {
            query: 'is:unresolved',
            statsPeriod: '24h',
            per_page: 5,
          },
          timeout: 5000,
        }),
        axios.get(projectUrl, {
          headers,
          timeout: 5000,
        }),
      ]);

      console.debug(
        `[AdminHealth] Sentry issues URL: ${issuesResponse.config?.url}`,
      );
      console.debug(
        `[AdminHealth] Sentry project URL: ${projectResponse.config?.url}`,
      );

      const issues = Array.isArray(issuesResponse.data)
        ? issuesResponse.data
        : [];

      console.debug(
        '[AdminHealth] Sentry issues payload:',
        safeStringify(issuesResponse.data),
      );

      const healthStats =
        projectResponse.data?.latestRelease ?? projectResponse.data;

      const crashFreeSessions =
        typeof healthStats?.stats?.crash_free_sessions === 'number'
          ? Number(healthStats.stats.crash_free_sessions)
          : typeof healthStats?.crash_free_sessions === 'number'
            ? Number(healthStats.crash_free_sessions)
            : null;

      const byPlatform = {
        android: 0,
        ios: 0,
        other: 0,
      };

      for (const issue of issues) {
        const platform = (issue?.platform ?? 'other').toLowerCase();
        if (platform.includes('android')) {
          byPlatform.android += 1;
        } else if (platform.includes('ios') || platform.includes('iphone')) {
          byPlatform.ios += 1;
        } else {
          byPlatform.other += 1;
        }
      }

      const recentIssues = issues
        .sort((a, b) => {
          const aDate = new Date(a?.lastSeen ?? a?.dateCreated ?? 0).getTime();
          const bDate = new Date(b?.lastSeen ?? b?.dateCreated ?? 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 5)
        .map((issue) => {
          if (!issue) {
            console.log('Objeto que causou erro:', safeStringify(issue));
          }
          const stackInfo =
            issue?.entries
              ?.map((entry: any) => entry?.data?.stacktrace ?? entry)
              ?.filter(Boolean) || [];
          const stackTrace = stackInfo.length ? safeStringify(stackInfo) : undefined;
          return {
            id: issue?.id ?? String(Date.now()),
            title: issue?.title ?? issue?.metadata?.value ?? 'Sem título',
            platform: issue?.platform ?? 'unknown',
            lastSeen:
              issue?.lastSeen ?? issue?.dateCreated ?? new Date().toISOString(),
            stackTrace,
          };
        });

      const payload: SentryObservabilityPayload = {
        totalUnresolved: issues.length,
        crashFreeSessions,
        byPlatform,
        recentIssues,
        projectHealth: projectResponse.data,
      };

      await this.cacheService.set(this.sentryCacheKey, payload, 60);
      return payload;
    } catch (error) {
      let statusCode: number | undefined;
      let message = 'Erro desconhecido ao consultar o Sentry';
      if (isAxiosError(error)) {
        console.error(
          '[AdminHealth] Sentry request URL (debug):',
          error.config?.url,
        );
        statusCode = error.response?.status;
        message =
          error.response?.data?.detail ??
          error.response?.data?.message ??
          error.message;
        if (error.response?.data) {
          console.error(
            '[AdminHealth] Sentry response body:',
            error.response.data,
          );
        }
      }
      this.logger.warn(
        `[AdminHealth] erro ao consumir API do Sentry: ${message}`,
      );
      console.error(
        `[AdminHealth] Sentry request failed (status=${statusCode ?? 'n/a'}): ${message}`,
      );
      console.error(
        '[AdminHealth] Sentry error full object:',
        safeStringify(error),
      );
      return this.buildSentryError(message, statusCode);
    }
  }

  private buildSentryError(
    message: string,
    statusCode?: number,
  ): SentryObservabilityError {
    return {
      error: {
        message,
        statusCode,
      },
    };
  }
}
