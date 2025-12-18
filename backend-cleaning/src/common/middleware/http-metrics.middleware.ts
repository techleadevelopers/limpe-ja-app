import { Injectable, NestMiddleware } from '@nestjs/common';
import { Histogram, Counter, register } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

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
    });

    next();
  }
}
