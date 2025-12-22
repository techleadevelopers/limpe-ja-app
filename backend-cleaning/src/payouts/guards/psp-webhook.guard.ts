import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CacheService } from '../../cache/cache.service';
import { verifyPspSignature } from '../utils/psp-webhook-signature.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PspWebhookGuard implements CanActivate {
  private readonly logger = new Logger(PspWebhookGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { rawBody?: string; body?: unknown }
    >();
    const eventId = this.resolveEventId(request);
    if (!eventId) {
      this.logger.warn('Missing PSP webhook event id.');
      throw new BadRequestException('Webhook event id is required.');
    }

    this.enforceTimestampWindow(request, eventId);

    const signature = this.getHeader(request, 'x-signature');
    const secret = this.configService.get<string>('psp.webhookSecret');
    if (!secret) {
      this.logger.error('PSP webhook secret not configured.');
      throw new ForbiddenException(
        'Webhook signature validation is not configured.',
      );
    }

    const payload =
      typeof request.rawBody === 'string'
        ? request.rawBody
        : JSON.stringify(request.body ?? '');

    if (!verifyPspSignature(signature, payload, secret)) {
      this.logger.warn(`Invalid PSP webhook signature for ${eventId}.`);
      throw new ForbiddenException('Invalid webhook signature.');
    }

    const source = this.resolveSource(request);
    const isPixWebhook = source === 'psp:pix';

    if (isPixWebhook) {
      const existingReplay = await this.prisma.webhookReplay.findFirst({
        where: { eventId, source },
      });
      if (existingReplay) {
        this.logger.warn(`Replay detected (DB) for PSP event ${eventId}.`);
        this.respondWithReplay(context);
        return false;
      }
    }

    const replayTtl = parseInt(
      this.configService.get<string>('PSP_WEBHOOK_REPLAY_TTL_SECONDS', '86400'),
      10,
    );
    const cacheKey = this.getCacheKey(eventId, source);
    const inserted = await this.cacheService.setIfNotExists(
      cacheKey,
      true,
      replayTtl,
    );
    if (!inserted) {
      this.logger.warn(`Replay detected for PSP event ${eventId}.`);
      this.respondWithReplay(context);
      return false;
    }

    if (isPixWebhook) {
      await this.prisma.webhookReplay.create({
        data: { source, eventId },
      });
    }

    return true;
  }

  private getCacheKey(eventId: string, source: string): string {
    return `webhook:${source}:${eventId}`;
  }

  private resolveSource(
    request: Request & { originalUrl?: string; url?: string },
  ): string {
    const url = request.originalUrl ?? request.url ?? '';
    if (url.includes('/payments/webhook/pix')) return 'psp:pix';
    if (url.includes('/payments/webhook/withdrawal')) return 'psp:withdrawal';
    if (url.includes('/payouts/webhook/gateway')) return 'psp:gateway';
    return 'psp:unknown';
  }

  private respondWithReplay(context: ExecutionContext): void {
    const response = context
      .switchToHttp()
      .getResponse<Response>() as Response | undefined;
    if (response && !response.headersSent) {
      response.status(HttpStatus.OK).json({ ok: true, replay: true });
    }
  }

  private enforceTimestampWindow(
    request: Request & { body?: unknown },
    eventId: string,
  ): void {
    const tolerance = parseInt(
      this.configService.get<string>(
        'PSP_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS',
        '300',
      ),
      10,
    );
    if (!tolerance) {
      return;
    }

    const headerTimestamp =
      this.getHeader(request, 'x-event-time') ??
      this.getHeader(request, 'x-event-timestamp') ??
      this.getHeader(request, 'x-event-date');
    const bodyTimestamp = this.extractTimestampFromPayload(request.body);
    const rawTimestamp = headerTimestamp ?? bodyTimestamp;
    if (!rawTimestamp) {
      return;
    }

    const timestamp = this.parseTimestamp(rawTimestamp);
    if (timestamp === undefined) {
      return;
    }

    const delta = Math.abs(Date.now() - timestamp);
    if (delta > tolerance * 1000) {
      this.logger.warn(
        `PSP webhook timestamp ${rawTimestamp} for ${eventId} is outside ${tolerance}s tolerance.`,
      );
      throw new BadRequestException(
        'Webhook timestamp is outside the allowed window.',
      );
    }
  }

  private resolveEventId(request: Request & { body?: unknown }): string | undefined {
    const headerId = this.getHeader(request, 'x-event-id');
    const payloadId = this.extractEventIdFromPayload(request.body);
    return this.normalizeEventId(headerId ?? payloadId);
  }

  private extractEventIdFromPayload(payload: unknown): string | number | undefined {
    const record = this.asRecord(payload);
    if (!record) {
      return undefined;
    }
    const transaction = this.asRecord(record.transaction);
    const data = this.asRecord(record.data);
    const nestedTransaction = this.asRecord(data?.transaction);
    return (
      this.asStringOrNumber(record.eventId) ??
      this.asStringOrNumber(record.event_id) ??
      this.asStringOrNumber(record.id) ??
      this.asStringOrNumber(record.reference_id) ??
      this.asStringOrNumber(transaction?.id) ??
      this.asStringOrNumber(transaction?.reference_id) ??
      this.asStringOrNumber(data?.id) ??
      this.asStringOrNumber(nestedTransaction?.id) ??
      this.asStringOrNumber(data?.resource_id)
    );
  }

  private extractTimestampFromPayload(payload: unknown): string | number | undefined {
    const record = this.asRecord(payload);
    if (!record) {
      return undefined;
    }
    const data = this.asRecord(record.data);
    return (
      this.asStringOrNumber(record.timestamp) ??
      this.asStringOrNumber(record.eventTime) ??
      this.asStringOrNumber(record.event_time) ??
      this.asStringOrNumber(record.created_at) ??
      this.asStringOrNumber(record.createdAt) ??
      this.asStringOrNumber(data?.timestamp) ??
      this.asStringOrNumber(data?.created_at)
    );
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private parseTimestamp(value: string | number | undefined): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private normalizeEventId(value: string | number | undefined): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    const raw = typeof value === 'string' ? value : String(value);
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
  }

  private getHeader(request: Request, name: string): string | undefined {
    return (
      (request.headers[name] as string | undefined) ??
      request.get(name) ??
      undefined
    );
  }

  private asStringOrNumber(
    value: unknown,
  ): string | number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    return typeof value === 'string' || typeof value === 'number'
      ? value
      : undefined;
  }
}
