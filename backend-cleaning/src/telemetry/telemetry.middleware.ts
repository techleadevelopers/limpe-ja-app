import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { QueuesService } from '../queues/queues.service';
import { TelemetryService } from './telemetry.service';

@Injectable()
export class TelemetryMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TelemetryMiddleware.name);
  private readonly monitoredPath = '/update-profile';

  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly jwtService: JwtService,
    private readonly queuesService: QueuesService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const normalized = this.normalizePath(
      req.originalUrl ?? req.url ?? req.path ?? '',
    );
    if (normalized === this.monitoredPath) {
      const userId = this.extractUserId(req);
      void this.enqueueTelemetry(userId, normalized);
    }

    next();
  }

  private normalizePath(value: string): string {
    const raw = value.split('?')[0].trim();
    if (!raw) {
      return '/';
    }
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    return normalized.toLowerCase();
  }

  private extractUserId(req: Request): string | undefined {
    const payload = (req as Request & { user?: { userId?: string } }).user;
    if (payload?.userId) {
      return payload.userId;
    }

    const authHeader =
      req.headers?.authorization ??
      (req.headers?.['x-access-token'] as string | undefined);
    const token = this.parseToken(authHeader);
    if (!token) {
      return undefined;
    }

    try {
      const decoded = this.jwtService.verify<{ userId?: string }>(token);
      return decoded.userId;
    } catch (error) {
      this.logger.warn(
        `[TelemetryMiddleware] Token invalido ao coletar userId: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  private parseToken(header?: string): string | undefined {
    if (!header) {
      return undefined;
    }
    return header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : header.trim();
  }

  private async enqueueTelemetry(
    userId: string | undefined,
    normalizedPath: string,
  ): Promise<void> {
    const payload = { userId, path: normalizedPath };
    try {
      await this.queuesService.addJob('telemetry', payload);
      this.logger.debug(
        `[TelemetryMiddleware] Telemetry job enfileirado para ${userId} ${normalizedPath}`,
      );
    } catch (queueError) {
      this.logger.warn(
        `[TelemetryMiddleware] Falha ao enfileirar telemetria: ${
          (queueError as Error).message
        }, executando fallback inline.`,
      );
      try {
        await this.telemetryService.recordRequest(userId, normalizedPath);
      } catch (fallbackError) {
        this.logger.error(
          `[TelemetryMiddleware] Falha no fallback de telemetria: ${
            (fallbackError as Error).message
          }`,
        );
      }
    }
  }
}
