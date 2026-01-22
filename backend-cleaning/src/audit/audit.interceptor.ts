import { CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditInterceptor');

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (response.statusCode >= 400) return; // Evita duplicar se o erro já for tratado
          this.logAction(context, data);
        },
        error: (err) => this.logAction(context, err),
      }),
    );
  }

  private logAction(context: ExecutionContext, dataOrError: any) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, user, body, ip } = request;
    const userAgent = request.get('user-agent');
    
    if (!user?.userId) return; // Mantém a exigência rigorosa do token

    const isError = dataOrError instanceof Error;
    const statusCode = isError 
      ? (dataOrError instanceof HttpException ? dataOrError.getStatus() : 500)
      : (response?.statusCode ?? 200);

    const sanitizedRequest = {
      method,
      path: url,
      params: request.params ?? {},
      query: request.query ?? {},
      body: (() => {
        if (!body) return null;
        const copy = { ...body };
        delete copy.password;
        delete copy.token;
        return Object.keys(copy).length ? copy : null;
      })(),
    };

    const responsePreview = {
      statusCode,
      body: isError ? (dataOrError as any).response : (method === 'GET' ? undefined : dataOrError),
    };

    this.auditLogService
      .log(
        user.userId,
        `${method} ${url}`,
        { request: sanitizedRequest, response: responsePreview },
        { ip, userAgent },
      )
      .catch((err) => this.logger.error('Failed to save audit log', err));
  }
}
