import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly tracer = trace.getTracer('backend-cleaning');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const method = req?.method ?? 'UNKNOWN';
    const route =
      (req as any)?.route?.path ??
      req?.originalUrl?.split('?')[0] ??
      req?.url ??
      'unknown';

    return this.tracer.startActiveSpan(`HTTP ${method} ${route}`, (span) => {
      span.setAttribute('http.method', method);
      span.setAttribute('http.route', route);
      span.setAttribute('http.target', req?.originalUrl ?? req?.url ?? '');
      span.setAttribute('http.host', req?.hostname ?? '');

      const start = Date.now();

      return next.handle().pipe(
        tap(() => {
          span.setAttribute('http.status_code', res?.statusCode ?? 200);
          span.setAttribute('http.response_time_ms', Date.now() - start);
          span.end();
        }),
        catchError((err) => {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err?.message ?? 'unknown_error',
          });
          span.recordException(err as Error);
          span.setAttribute('http.status_code', res?.statusCode ?? 500);
          span.end();
          return throwError(() => err);
        }),
      );
    });
  }
}
