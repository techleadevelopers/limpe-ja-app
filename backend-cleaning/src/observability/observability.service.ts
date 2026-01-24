import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryEventsService } from '../telemetry/telemetry.events.service';
import { TelemetryLatencySpikePayload } from '../telemetry/telemetry.types';
import { normalizeRouteKey } from './route-normalizer';

interface LatencyEntry {
  timestamp: number;
  latencyMs: number;
}

interface LatencyPoint {
  timestamp: string;
  latencyMs: number;
}

interface LatencySeriesOptions {
  windowHours?: number;
  points?: number;
}

interface JobMetric {
  durationMs: number;
  affectedCount: number;
  recordedAt: number;
}

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);
  private readonly latencyBuffers = new Map<string, LatencyEntry[]>();
  private readonly lastAlertTimestamps = new Map<string, number>();
  private readonly maxWindowMs = 12 * 60 * 60 * 1000;
  private readonly maxStoredPoints = 240;
  private readonly summaryWindowMs = 30 * 60 * 1000;
  private readonly alertThresholdMs: number;
  private readonly alertCooldownMs: number;
  private readonly jobMetrics = new Map<string, JobMetric>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly telemetryEvents: TelemetryEventsService,
  ) {
    const latencyConfig =
      this.configService.get<Record<string, number>>('observability.latency') ??
      {};
    this.alertThresholdMs =
      latencyConfig.alertThresholdMs ?? 1500;
    this.alertCooldownMs =
      (latencyConfig.alertCooldownSeconds ?? 300) * 1000;
  }

  recordLatency(route: string, latencyMs: number) {
    const now = Date.now();
    const normalized = normalizeRouteKey(route);
    const buffer = this.latencyBuffers.get(normalized) ?? [];

    const sanitizedLatency = Number(latencyMs?.toFixed(2)) || 0;
    buffer.push({ timestamp: now, latencyMs: sanitizedLatency });

    const cutoff = now - this.maxWindowMs;
    const pruned = buffer.filter((entry) => entry.timestamp >= cutoff);
    while (pruned.length > this.maxStoredPoints) {
      pruned.shift();
    }

    this.latencyBuffers.set(normalized, pruned);
    this.maybeDetectSpike(normalized, pruned);
  }

  getLatencySeries(
    route: string,
    options: LatencySeriesOptions = {},
  ): LatencyPoint[] {
    const normalized = normalizeRouteKey(route);
    const buffer = this.latencyBuffers.get(normalized) ?? [];
    if (buffer.length === 0) {
      return [];
    }

    const windowMs = (options.windowHours ?? 6) * 3600 * 1000;
    const cutoff = Date.now() - windowMs;
    const filtered = buffer.filter((entry) => entry.timestamp >= cutoff);
    if (filtered.length === 0) {
      return [];
    }

    const requestedPoints = options.points ?? 12;
    const points = Math.max(1, Math.min(filtered.length, requestedPoints));
    const chunkSize = Math.ceil(filtered.length / points);
    const sampled: LatencyEntry[] = [];
    for (let i = 0; i < filtered.length; i += chunkSize) {
      sampled.push(filtered[i]);
    }

    return sampled.slice(-points).map((entry) => this.toPoint(entry));
  }

  recordJobExecution(jobName: string, durationMs: number, affectedCount: number) {
    const sanitizedDuration = Number(durationMs?.toFixed(2)) || 0;
    const metric: JobMetric = {
      durationMs: sanitizedDuration,
      affectedCount,
      recordedAt: Date.now(),
    };
    this.jobMetrics.set(jobName, metric);
    this.logger.log(
      `[ObservabilityService] job '${jobName}' finished in ${sanitizedDuration}ms affecting ${affectedCount} records.`,
    );
  }

  getJobMetric(jobName: string): JobMetric | null {
    return this.jobMetrics.get(jobName) ?? null;
  }

  private toPoint(entry: LatencyEntry): LatencyPoint {
    return {
      timestamp: new Date(entry.timestamp).toISOString(),
      latencyMs: entry.latencyMs,
    };
  }

  private maybeDetectSpike(route: string, buffer: LatencyEntry[]) {
    if (buffer.length < 5) {
      return;
    }
    const recent = buffer.slice(-5);
    const averageLatency =
      recent.reduce((acc, item) => acc + item.latencyMs, 0) / recent.length;

    if (averageLatency < this.alertThresholdMs) {
      return;
    }

    const now = Date.now();
    const lastAlert = this.lastAlertTimestamps.get(route) ?? 0;
    if (now - lastAlert < this.alertCooldownMs) {
      return;
    }

    this.lastAlertTimestamps.set(route, now);
    const payload: TelemetryLatencySpikePayload = {
      route,
      averageLatencyMs: Number(averageLatency.toFixed(2)),
      thresholdMs: this.alertThresholdMs,
      timestamp: new Date(now).toISOString(),
    };
    this.telemetryEvents.publishLatencySpike(payload);
    this.logger.warn(
      `[ObservabilityService] latency spike detected for ${route}: ${payload.averageLatencyMs}ms`,
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async persistLatencySummaries() {
    const now = Date.now();
    const cutoff = now - this.summaryWindowMs;
    const tasks: Array<Promise<unknown>> = [];

    for (const [route, buffer] of this.latencyBuffers.entries()) {
      const windowEntries = buffer.filter(
        (entry) => entry.timestamp >= cutoff,
      );
      if (windowEntries.length === 0) {
        continue;
      }

      const sorted = windowEntries
        .map((entry) => entry.latencyMs)
        .sort((a, b) => a - b);
      const [p50, p90, p99] = [50, 90, 99].map((percentile) =>
        this.calculatePercentile(sorted, percentile),
      );

      tasks.push(
        this.prisma.observabilityLatencySummary.create({
          data: {
            routeKey: route,
            p50,
            p90,
            p99,
            sampleCount: sorted.length,
            windowMinutes: Math.round(this.summaryWindowMs / 60000),
          },
        }),
      );
    }

    if (tasks.length === 0) {
      return;
    }

    try {
      await Promise.all(tasks);
    } catch (error) {
      this.logger.warn(
        `[ObservabilityService] failed to persist latency summaries: ${
          (error as Error).message
        }`,
      );
    }
  }

  private calculatePercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) {
      return 0;
    }
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (upper === lower) {
      return sorted[lower];
    }
    const weight = index - lower;
    return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
  }
}
