import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CRITICAL_ROUTE_PREFIXES } from './latency-route-config';
import { ObservabilityService } from './observability.service';
import { normalizeRouteKey } from './route-normalizer';

const MIN_SAMPLE_RATE = 0.01;

@Injectable()
export class ObservabilityLatencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ObservabilityLatencyInterceptor.name);
  private readonly enabled: boolean;
  private readonly defaultRate: number;
  private readonly criticalRate: number;

  constructor(
    private readonly observabilityService: ObservabilityService,
    private readonly configService: ConfigService,
  ) {
    this.enabled = this.parseEnabledFlag(
      this.configService.get<string>('observability.latency.enabled'),
    );
    this.defaultRate = this.clampRate(
      this.configService.get<number>('observability.latency.sampleRateDefault'),
      1,
    );
    this.criticalRate = this.clampRate(
      this.configService.get<number>('observability.latency.sampleRateCritical'),
      1,
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Record<string, any>>();
    const routeKey = this.resolveRouteKey(request);
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        const elapsedMs =
          Number(process.hrtime.bigint() - start) / 1_000_000 || 0;
        if (!this.shouldSample(routeKey)) {
          return;
        }
        try {
          this.observabilityService.recordLatency(routeKey, elapsedMs);
        } catch (error) {
          const requestId = this.getRequestId(request);
          this.logger.debug(
            `[ObservabilityLatencyInterceptor] recordLatency failure route=${routeKey} durationMs=${elapsedMs.toFixed(
              2,
            )} requestId=${requestId}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }),
    );
  }

  private shouldSample(routeKey: string): boolean {
    const rate = this.isCriticalRoute(routeKey)
      ? this.criticalRate
      : this.defaultRate;
    return Math.random() <= rate;
  }

  private isCriticalRoute(routeKey: string): boolean {
    return CRITICAL_ROUTE_PREFIXES.some((prefix) =>
      routeKey.startsWith(prefix),
    );
  }

  private resolveRouteKey(request: Record<string, any>): string {
    const routePath =
      (request.route?.path as string | undefined) ??
      (request.route?.stack?.[0]?.path as string | undefined);
    const baseUrl = (request.baseUrl as string | undefined) ?? '';
    const pathCandidate = [baseUrl, routePath].filter(Boolean).join('');

    if (pathCandidate) {
      return normalizeRouteKey(pathCandidate);
    }

    const original = (request.originalUrl as string | undefined) ??
      (request.url as string | undefined);
    return normalizeRouteKey(original);
  }

  private getRequestId(request: Record<string, any>): string | undefined {
    return (
      request.headers?.['x-client-request-id'] ??
      request.headers?.['x-request-id']
    );
  }

  private clampRate(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return Math.max(MIN_SAMPLE_RATE, Math.min(1, fallback));
    }
    return Math.max(MIN_SAMPLE_RATE, Math.min(1, value));
  }

  private parseEnabledFlag(flag?: string | boolean): boolean {
    if (flag === undefined) {
      return true;
    }
    if (typeof flag === 'boolean') {
      return flag;
    }
    const sanitized = flag.trim().toLowerCase();
    if (sanitized === 'false' || sanitized === '0' || sanitized === 'no') {
      return false;
    }
    return true;
  }
}
