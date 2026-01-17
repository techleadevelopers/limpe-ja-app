import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type WhatsappDeliveryOptions = {
  bookingId?: string;
  status?: BookingStatus;
  guardHours?: number;
  metadata?: Prisma.JsonValue;
};

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly http: AxiosInstance | null;
  private readonly pixKey?: string;
  private readonly pixReceiverName: string;
  private readonly zapiBaseUrl?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.zapiBaseUrl = this.configService.get<string>('zapi.baseUrl');
    const token = this.configService.get<string>('zapi.token');
    this.pixKey = this.configService.get<string>('whatsapp.pixKey')?.trim();
    this.pixReceiverName =
      this.configService.get<string>('whatsapp.pixReceiverName') ??
      'BlueCoder Software e Data LTDA';

    if (!this.zapiBaseUrl) {
      this.logger.warn(
        '[WhatsappService] ZAPI_BASE_URL não configurado; pulando disparo.',
      );
      this.http = null;
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    this.http = axios.create({
      baseURL: this.zapiBaseUrl,
      timeout: 10_000,
      headers,
    });
  }

  async sendWhatsAppMessage(
    phone: string,
    message: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.http) {
      this.logger.warn(
        '[WhatsappService] Configurações incompletas (Z-API não configurado); envio ignorado.',
      );
      return { success: false };
    }
    if (!phone?.trim()) {
      this.logger.warn(
        '[WhatsappService] Número de telefone ausente; envio ignorado.',
      );
      return { success: false };
    }
    if (!message?.trim()) {
      this.logger.warn(
        '[WhatsappService] Mensagem vazia; envio de WhatsApp bloqueado.',
      );
      return { success: false };
    }

    const normalized = this.normalizePhone(phone);
    try {
      const response = await this.http.post('/send-text', {
        phone: normalized.replace(/^\+/, ''),
        message,
      });
      this.logger.log(`[WhatsappService] Mensagem enviada para ${normalized}`);
      return {
        success: true,
        messageId: this.extractMessageId(response?.data),
      };
    } catch (error: unknown) {
      this.logger.error(
        `[WhatsappService] Falha ao enviar WhatsApp para ${normalized}: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      return { success: false };
    }
  }

  async notifyNewOrder(
    clientName: string,
    pixCode: string,
    phone: string,
    options: WhatsappDeliveryOptions = {},
  ): Promise<boolean> {
    const receiver = clientName?.trim() || 'Cliente';
    const effectivePixCode =
      pixCode?.trim() || this.pixKey || 'PIX indisponível. Entre em contato.';
    const message = [
      `Olá ${receiver}, recebemos seu pedido e identificamos o recebedor como ${this.pixReceiverName}.`,
      'Copie o código abaixo para pagar via PIX no seu banco:',
      effectivePixCode,
    ].join('\n');

    return this.sendStatusMessage({
      messageKey: 'new-order-awaiting-pix',
      phone,
      message,
      bookingId: options.bookingId,
      status: options.status ?? BookingStatus.PENDING_PAYMENT,
      guardHours: options.guardHours,
      metadata: this.mergeMetadata(options.metadata, {
        pixCode: effectivePixCode,
        pixReceiverName: this.pixReceiverName,
      }),
    });
  }

  async notifyPaymentConfirmed(
    clientName: string,
    serviceDate: string,
    phone: string,
    options: WhatsappDeliveryOptions = {},
  ): Promise<boolean> {
    const receiver = clientName?.trim() || 'Cliente';
    const schedule = serviceDate?.trim() || 'data agendada';
    const message = `Pagamento aprovado! ${receiver}, seu atendimento está confirmado para ${schedule}. Qualquer dúvida estamos à disposição.`;

    return this.sendStatusMessage({
      messageKey: 'payment-confirmed',
      phone,
      message,
      bookingId: options.bookingId,
      status: options.status ?? BookingStatus.CONFIRMED,
      guardHours: options.guardHours,
      metadata: this.mergeMetadata(options.metadata, { serviceDate: schedule }),
    });
  }

  async notifyPhotoRejection(
    providerName: string,
    phone: string,
    options: WhatsappDeliveryOptions = {},
  ): Promise<boolean> {
    const recipient = providerName?.trim() || 'Prestadora';
    const message = `Olá ${recipient}, a foto enviada não seguiu o padrão (corpo inteiro, roupa de trabalho e ambiente claro). Por favor, envie novas imagens respeitando esse padrão para seguirmos com a aprovação.`;

    return this.sendStatusMessage({
      messageKey: 'photo-rejection',
      phone,
      message,
      bookingId: options.bookingId,
      status: options.status ?? BookingStatus.PENDING_PROVIDER_CONFIRMATION,
      guardHours: options.guardHours,
      metadata: this.mergeMetadata(options.metadata, {
        reason: 'photo-rejection',
      }),
    });
  }

  private async sendStatusMessage(params: {
    messageKey: string;
    phone: string;
    message: string;
    bookingId?: string;
    status?: BookingStatus;
    guardHours?: number;
    metadata?: Prisma.JsonValue;
  }): Promise<boolean> {
    const { bookingId, status, messageKey, phone, message, guardHours, metadata } =
      params;

    if (await this.hasRecentLog({ bookingId, status, messageKey, guardHours })) {
      this.logger.log(
        `[WhatsappService] Pulando ${messageKey} para booking ${bookingId} (${status}); já enviado recentemente.`,
      );
      return false;
    }

    const normalizedPhone = this.normalizePhone(phone);
    const { success, messageId } = await this.sendWhatsAppMessage(
      normalizedPhone,
      message,
    );
    if (!success) {
      return false;
    }

    await this.recordLog({
      bookingId,
      status,
      messageKey,
      recipientPhone: normalizedPhone,
      payload: metadata,
      externalMessageId: messageId,
    });
    return true;
  }

  private async hasRecentLog(options: {
    bookingId?: string;
    status?: BookingStatus;
    messageKey: string;
    guardHours?: number;
  }): Promise<boolean> {
    const { bookingId, status, messageKey, guardHours } = options;
    if (!bookingId || !status) {
      return false;
    }
    const windowMs = Math.max((guardHours ?? 24) * 60 * 60 * 1000, 1);
    const since = new Date(Date.now() - windowMs);

    const existing = await this.prisma.notificationLog.findFirst({
      where: {
        bookingId,
        status,
        messageKey,
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return !!existing;
  }

  private async recordLog(params: {
    bookingId?: string;
    status?: BookingStatus;
    messageKey: string;
    recipientPhone: string;
    payload?: Prisma.JsonValue;
    externalMessageId?: string;
  }) {
    const {
      bookingId,
      status,
      messageKey,
      recipientPhone,
      payload,
      externalMessageId,
    } = params;
    if (!bookingId) {
      return;
    }
    await this.prisma.notificationLog.create({
      data: {
        bookingId,
        status,
        messageKey,
        recipientPhone,
        payload,
        externalMessageId,
      },
    });
  }

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    if (!trimmed) return trimmed;
    let digits = trimmed.replace(/[^\d+]/g, '');
    if (!digits) return trimmed;
    if (digits.startsWith('+')) {
      digits = digits.slice(1);
    }
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    }
    if (!digits.startsWith('55')) {
      digits = `55${digits}`;
    }
    return `+${digits}`;
  }

  private extractMessageId(data: any): string | undefined {
    if (!data) return undefined;
    if (typeof data === 'string') {
      return data;
    }
    return (
      data.messageId ??
      data.id ??
      data.requestId ??
      data.teamMessageId ??
      (Array.isArray(data.messages) && data.messages[0]?.id) ??
      undefined
    );
  }

  private mergeMetadata(
    base?: Prisma.JsonValue,
    extra?: Record<string, unknown>,
  ): Prisma.JsonValue | undefined {
    const payload: Record<string, unknown> = {};
    if (base && typeof base === 'object' && !Array.isArray(base)) {
      Object.assign(payload, base as Record<string, unknown>);
    }
    if (extra) {
      Object.assign(payload, extra);
    }
    return Object.keys(payload).length
      ? (payload as Prisma.JsonValue)
      : undefined;
  }
}
