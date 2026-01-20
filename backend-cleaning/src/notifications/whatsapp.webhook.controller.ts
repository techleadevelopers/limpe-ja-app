import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: Record<string, unknown>) {
    const messageId = this.extractMessageId(body);
    const status =
      String(
        body?.['status'] ?? body?.['messageStatus'] ?? body?.['event'] ?? '',
      ).trim() || undefined;
    const event =
      String(body?.['event'] ?? body?.['type'] ?? '').trim() || 'unknown';
    const instanceId =
      String(body?.['instanceId'] ?? body?.['instance'] ?? '').trim() ||
      'unknown';

    if (messageId && status) {
      await this.updateNotificationLog(messageId, status, body);
    }

    await this.prisma.whatsappWebhookLog.create({
      data: {
        event,
        instanceId,
        data: body as Prisma.JsonObject,
      },
    });

    this.logger.log(
      `[WhatsappWebhook] processed messageId=${messageId ?? 'unknown'} status=${status}`,
    );
    return { success: true };
  }

  private async updateNotificationLog(
    messageId: string,
    status: string,
    payload: Record<string, unknown>,
  ) {
    const log = await this.prisma.notificationLog.findFirst({
      where: { externalMessageId: messageId },
      orderBy: { createdAt: 'desc' },
    });
    if (!log) {
      this.logger.warn(
        `[WhatsappWebhook] Nenhum NotificationLog encontrado para messageId=${messageId}.`,
      );
      return;
    }

    const existingPayload = log.payload;
    const updatedPayload =
      typeof existingPayload === 'object' && !Array.isArray(existingPayload)
        ? { ...existingPayload }
        : {};
    (updatedPayload as Record<string, unknown>).whatsappWebhook = {
      status,
      receivedAt: new Date().toISOString(),
      raw: payload,
    };

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        payload: updatedPayload,
      },
    });
  }

  private extractMessageId(body: Record<string, unknown> | null | undefined) {
    if (!body) return undefined;
    return (
      String(
        body['messageId'] ??
          body['id'] ??
          body['msgId'] ??
          body['requestId'] ??
          '',
      ).trim() || undefined
    );
  }

  private extractPhone(body: Record<string, unknown> | null | undefined) {
    if (!body) return undefined;
    const raw =
      body['phone'] ??
      body['number'] ??
      body['from'] ??
      (body['contact'] && (body['contact'] as any).phone) ??
      (body['recipient'] && (body['recipient'] as any).phone);
    if (typeof raw === 'string') {
      return raw.trim();
    }
    if (typeof raw === 'object' && raw !== null) {
      return String(raw.value ?? '').trim() || undefined;
    }
    return undefined;
  }
}
