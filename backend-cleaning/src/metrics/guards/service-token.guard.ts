import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetricsServiceTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const token = this.configService.get<string>('METRICS_SERVICE_TOKEN');
    const allowInsecure =
      this.configService.get<string>('ALLOW_INSECURE_METRICS') === 'true';
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    const isProduction = nodeEnv === 'production';
    const request = context.switchToHttp().getRequest();
    const headerValue = request.headers?.['x-service-token'];
    const providedToken = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (token && providedToken === token) {
      return true;
    }
    if (!isProduction && allowInsecure) {
      return true;
    }
    return false;
  }
}
