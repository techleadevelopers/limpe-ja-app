import { Injectable, Logger } from '@nestjs/common';
import { normalizeRouteKey } from './route-normalizer';

interface LatencyEntry {
  timestamp: number;
  latencyMs: number;
}

interface LatencySeriesOptions {
  windowHours?: number;
  points?: number;
}

interface LatencyPoint {
  timestamp: string;
  latencyMs: number;
}

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);
  private readonly latencyBuffers = new Map<string, LatencyEntry[]>();
  private readonly maxWindowMs = 12 * 60 * 60 * 1000; // mantém até 12h de históricos
  private readonly maxStoredPoints = 240;

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

    const points = Math.max(1, options.points ?? 12);
    if (filtered.length <= points) {
      return filtered.map((entry) => this.toPoint(entry));
    }

    const chunkSize = Math.ceil(filtered.length / points);
    const sampled: LatencyEntry[] = [];
    for (let i = 0; i < filtered.length; i += chunkSize) {
      sampled.push(filtered[i]);
    }

    return sampled.slice(-points).map((entry) => this.toPoint(entry));
  }

  private toPoint(entry: LatencyEntry): LatencyPoint {
    return {
      timestamp: new Date(entry.timestamp).toISOString(),
      latencyMs: entry.latencyMs,
    };
  }
}
