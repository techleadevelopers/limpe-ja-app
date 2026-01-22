import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Counter, Histogram, register } from 'prom-client';
import { ObservabilityService } from '../../observability/observability.service';

const HTTP_REQUEST_DURATION_NAME = 'http_request_duration_seconds';
const HTTP_REQUEST_COUNTER_NAME = 'http_requests_total';

const httpRequestDuration =
  (register.getSingleMetric(HTTP_REQUEST_DURATION_NAME) as
    | Histogram<'method' | 'route' | 'status_code'>
    | undefined) ??
  new Histogram({
    name: HTTP_REQUEST_DURATION_NAME,
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
  });

const httpRequestCounter =
  (register.getSingleMetric(HTTP_REQUEST_COUNTER_NAME) as
    | Counter<'method' | 'route' | 'status_code'>
    | undefined) ??
  new Counter({
    name: HTTP_REQUEST_COUNTER_NAME,
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly observabilityService: ObservabilityService) {}

  private isCriticalRoute(route: string): boolean {
    return ['bookings', 'payments', 'auth', 'search', 'providers', 'safety', 'chat', 'verification', 'payouts', 'subscriptions', 'webhooks', 'notifications', 'disputes', 'reviews', 'admin'].some((segment) =>
      route.startsWith(`/${segment}`),
    );
  }

  private normalizeRouteKey(route: string): string {
    const trimmed = route.split('?')[0];
    const segments = trimmed.split('/').filter(Boolean);
    const normalizedSegments = segments.map((segment) => {
      if (segment.startsWith(':')) {
        return '{id}';
      }
      if (/^[0-9]+$/.test(segment)) {
        return '{id}';
      }
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment,
        )
      ) {
        return '{id}';
      }
      if (/^\d+[A-Za-z]+$/.test(segment)) {
        return '{id}';
      }
      return segment;
    });
    return `/${normalizedSegments.join('/')}`;
  }

  private shouldSample(routeKey: string): boolean {
    const sampleRate = this.isCriticalRoute(routeKey) ? 1 : 0.1;
    return this.getRandom() < sampleRate;
  }

  private getRandom(): number {
    return Math.random();
  }

  private deriveRouteKey(req: Request): string {
    const candidate =
      (req.route?.path as string | undefined) ||
      req.path ||
      req.originalUrl?.split('?')[0];
    if (!candidate) {
      return '/unknown';
    }
    return this.normalizeRouteKey(candidate);
  }

  private recordLatency(routeKey: string, durationMs: number) {
    if (durationMs <= 0) {
      return;
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const durationSeconds = Number(end - start) / 1_000_000_000; // nanoseconds to seconds

      const method = (req.method || 'UNKNOWN').toUpperCase();
      // Remove querystring e normaliza rota
      const route =
        (req.route?.path as string) ||
        req.path ||
        req.originalUrl?.split('?')[0] ||
        'unknown';
      const statusCode = res.statusCode || 0;

      httpRequestDuration
        .labels(method, route, String(statusCode))
        .observe(durationSeconds);
      httpRequestCounter.labels(method, route, String(statusCode)).inc();

      const durationMs = durationSeconds * 1000;
      const routeKey = this.deriveRouteKey(req);
      this.recordLatency(routeKey, durationMs);
    });

    next();
  }
}
