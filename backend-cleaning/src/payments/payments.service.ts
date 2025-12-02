// src/payments/payments.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  Prisma,
  PaymentIntentStatus,
  TransactionType,
  UserRole,
} from '@prisma/client';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { createHmac, timingSafeEqual } from 'crypto';
import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { QueuesService } from '../queues/queues.service';
import {
  CreatePixChargeDto,
  PixChargeResponseDto,
} from './dto/create-pix-charge.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { CouponsService } from '../coupons/coupons.service';
import { PayoutsService } from '../payouts/payouts.service';

import { ConnectService } from '../connect/connect.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private pagseguroApiToken: string | undefined;
  private pagseguroApiBaseUrl: string;
  private appBaseUrl: string | undefined;
  private pagseguroHttpsAgent?: https.Agent; // property-injection para resolver o ciclo com BookingsService

  @Inject(forwardRef(() => BookingsService))
  private bookingsService!: BookingsService;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly couponsService: CouponsService,
    private readonly payoutsService: PayoutsService,
    private readonly queues: QueuesService,
    private readonly connectService: ConnectService,
  ) {
    this.pagseguroApiToken =
      this.configService.get<string>('PAGSEGURO_API_TOKEN') || undefined;
    this.pagseguroApiBaseUrl = this.configService.get<string>(
      'PAGSEGURO_API_BASE_URL',
      'https://sandbox.api.pagseguro.com',
    );
    this.appBaseUrl =
      this.configService.get<string>('API_BASE_URL') || undefined; // mTLS (opcional, exigido para PIX/Transfer em produção)
    try {
      const certPath = this.configService.get<string>(
        'PAGSEGURO_MTLS_CERT_PATH',
      );
      const keyPath = this.configService.get<string>('PAGSEGURO_MTLS_KEY_PATH');
      const caPath = this.configService.get<string>('PAGSEGURO_MTLS_CA_PATH');
      if (
        certPath &&
        keyPath &&
        fs.existsSync(certPath) &&
        fs.existsSync(keyPath)
      ) {
        const cert = fs.readFileSync(certPath);
        const key = fs.readFileSync(keyPath);
        const ca =
          caPath && fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined;
        this.pagseguroHttpsAgent = new https.Agent({
          cert,
          key,
          ca,
          rejectUnauthorized: true,
        });
        this.logger.log(
          'PaymentsService: mTLS habilitado para cliente HTTP do PagSeguro.',
        );
      }
    } catch (err) {
      this.logger.warn(
        `PaymentsService: falha ao iniciar mTLS agent: ${err?.message}`,
      );
    }

    if (!this.pagseguroApiToken) {
      this.logger.warn(
        'PAGSEGURO_API_TOKEN ausente. Integração real com PSP desativada (modo placeholder).',
      );
    }
    if (!this.appBaseUrl) {
      this.logger.warn(
        'API_BASE_URL ausente. Webhooks de PSP podem não funcionar externamente.',
      );
    }
  } // Admin: listar transações com filtros básicos

  async listTransactions(type?: string, status?: string) {
    const where: Prisma.TransactionWhereInput = {};
    if (type) where.type = type as any;
    if (status) where.status = status;
    const txs = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return txs.map((t) => ({
      id: t.id,
      providerId: t.providerId,
      userId: undefined,
      amount: Number(t.amount),
      type: t.type,
      status: t.status,
      description: t.description,
      createdAt: (t.createdAt as any as Date).toISOString(),
      bookingId: t.bookingId,
      gatewayTransactionId: t.gatewayTransactionId,
      qrCodeUrl: t.qrCodeUrl,
      transactionRef: t.transactionRef,
      couponId: t.couponId,
    }));
  } // Admin: listar saques (Payouts) com mapeamento simples

  async listWithdrawals(status?: string) {
    const where: Prisma.PayoutWhereInput = status
      ? { status: status as any }
      : {};
    const payouts = await this.prisma.payout.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
    });
    return payouts.map((p) => ({
      id: p.id,
      providerId: undefined,
      amount: Number(p.amount),
      status:
        p.status === 'PAID'
          ? 'APPROVED'
          : p.status === 'FAILED' || p.status === 'CANCELED'
            ? 'REJECTED'
            : 'PENDING',
      requestedAt: (p.requestedAt as any as Date).toISOString(),
      processedAt: p.processedAt
        ? (p.processedAt as any as Date).toISOString()
        : null,
    }));
  } /**
   * Registra webhook de PIX no PagBank (produção requer access_token + mTLS).
   */

  async registerPixWebhook(targetUrl?: string) {
    const accessToken = await this.connectService.getAccessToken();
    const url = `${this.pagseguroApiBaseUrl.replace(/\/$/, '')}/pix/v1/webhooks`;
    const body = {
      url:
        targetUrl ||
        `${this.configService.get<string>('API_BASE_URL') || ''}/payments/webhook/pix`,
    };
    const headers: any = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };
    try {
      const res = await axios.post(url, body, {
        headers,
        httpsAgent: this.pagseguroHttpsAgent,
        timeout: 15000,
      });
      return res.data;
    } catch (e: any) {
      this.logger.error(
        `[PaymentsService] registerPixWebhook error: ${e?.response?.status} ${JSON.stringify(e?.response?.data || e.message)}`,
      );
      throw new InternalServerErrorException(
        e?.response?.data?.message || 'Falha ao registrar webhook de PIX.',
      );
    }
  } /**
   * Registra webhook de Payouts/Transferências.
   */

  async registerPayoutsWebhook(targetUrl?: string) {
    const accessToken = await this.connectService.getAccessToken();
    const url = `${this.pagseguroApiBaseUrl.replace(/\/$/, '')}/payouts/v1/webhooks`;
    const body = {
      url:
        targetUrl ||
        `${this.configService.get<string>('API_BASE_URL') || ''}/payouts/webhook/gateway`,
    };
    const headers: any = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };
    try {
      const res = await axios.post(url, body, {
        headers,
        httpsAgent: this.pagseguroHttpsAgent,
        timeout: 15000,
      });
      return res.data;
    } catch (e: any) {
      this.logger.error(
        `[PaymentsService] registerPayoutsWebhook error: ${e?.response?.status} ${JSON.stringify(e?.response?.data || e.message)}`,
      );
      throw new InternalServerErrorException(
        e?.response?.data?.message || 'Falha ao registrar webhook de Payouts.',
      );
    }
  } /**
   * Registra ambos os webhooks (PIX e Payouts). Retorna payloads de criação.
   */

  async registerAllWebhooks(pixUrl?: string, payoutsUrl?: string) {
    const pix = await this.registerPixWebhook(pixUrl);
    const payouts = await this.registerPayoutsWebhook(payoutsUrl);
    return { pix, payouts };
  } // Admin: aprovar saque (marca como PAID)

  async approveWithdrawal(id: string) {
    const payout = await this.prisma.payout.update({
      where: { id },
      data: { status: 'PAID', processedAt: new Date() },
    });
    return {
      id: payout.id,
      providerId: undefined,
      amount: Number(payout.amount),
      status: 'APPROVED',
      requestedAt: (payout.requestedAt as any as Date).toISOString(),
      processedAt: payout.processedAt
        ? (payout.processedAt as any as Date).toISOString()
        : null,
    };
  } // Admin: rejeitar saque (marca como FAILED)

  async rejectWithdrawal(id: string, _reason?: string) {
    const payout = await this.prisma.payout.update({
      where: { id },
      data: { status: 'FAILED', processedAt: new Date() },
    });
    return {
      id: payout.id,
      providerId: undefined,
      amount: Number(payout.amount),
      status: 'REJECTED',
      requestedAt: (payout.requestedAt as any as Date).toISOString(),
      processedAt: payout.processedAt
        ? (payout.processedAt as any as Date).toISOString()
        : null,
    };
  } // Admin: iniciar reembolso de uma transação (simplificado)

  async initiateRefund(transactionId: string, amount?: number) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    const refundAmount =
      amount != null ? new Prisma.Decimal(amount) : tx.amount; // Criar transação de REFUND e marcar original como REFUNDED
    await this.prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'REFUNDED' },
    });
    const refund = await this.prisma.transaction.create({
      data: {
        providerId: tx.providerId || undefined,
        amount: refundAmount,
        type: TransactionType.REFUND,
        status: 'COMPLETED',
        description: `Refund for ${tx.id}`,
        bookingId: tx.bookingId || undefined,
      },
    });
    return {
      id: refund.id,
      providerId: refund.providerId || undefined,
      userId: undefined,
      amount: Number(refund.amount),
      type: refund.type,
      status: refund.status,
      description: refund.description,
      createdAt: (refund.createdAt as any as Date).toISOString(),
      bookingId: refund.bookingId || undefined,
      gatewayTransactionId: refund.gatewayTransactionId || undefined,
      qrCodeUrl: refund.qrCodeUrl || undefined,
      transactionRef: refund.transactionRef || undefined,
      couponId: refund.couponId || undefined,
    };
  } /**
   * Cria um PIX real usando PagBank ORDER API (fluxo oficial).
   * Substitui totalmente o fluxo legado /pix/charges.
   */

  async createPixCharge(
    clientUserId: string,
    dto: CreatePixChargeDto,
    idempotencyKey?: string,
  ): Promise<PixChargeResponseDto> {
    const { amount, description, bookingId, providerId } = dto; // === 1. VALIDAÇÕES INICIAIS ===

    if (!providerId) throw new BadRequestException('providerId é obrigatório.');
    if (!bookingId) throw new BadRequestException('bookingId é obrigatório.');

    const amountCents = Math.round(Number(amount) * 100);
    if (amountCents < 100)
      throw new BadRequestException('Valor mínimo é R$ 1,00.'); // Booking + cliente

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: { include: { user: true } }, provider: true },
    });

    if (!booking) throw new NotFoundException('Booking não encontrado.');
    if (booking.client?.userId !== clientUserId)
      throw new ForbiddenException('Você não pode pagar por este booking.');
    if (booking.providerId !== providerId)
      throw new BadRequestException('Booking não pertence a este provider.');

    const customerName =
      booking.client?.user?.fullName ??
      booking.client?.fullName ??
      'Cliente LimpeJá';
    const customerEmail = booking.client?.user?.email;
    const customerTaxId = booking.client?.cpf ?? '12345678909'; // fallback sandbox

    if (!customerEmail)
      throw new BadRequestException('Cliente sem e-mail válido.'); // === 2. CALCULAR EXPIRAÇÃO DO PIX ===

    const expiresInSeconds = 3600;
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);
    const expirationIso = expiration.toISOString().replace('.000Z', '-03:00'); // === 3. MONTAR PAYLOAD PARA POST /orders ===

    const referenceId = `booking_${bookingId}`;
    const chargeReferenceId = `charge_${bookingId}`;

    const pagseguroBase = this.pagseguroApiBaseUrl;
    const apiToken = this.pagseguroApiToken;
    const idemKey = idempotencyKey ?? `pix-${bookingId}-${Date.now()}`;

    const payload = {
      reference_id: referenceId,
      description: description ?? 'LimpeJá - PIX',
      customer: {
        name: customerName,
        email: customerEmail,
        tax_id: customerTaxId,
      },
      items: [
        {
          name: 'Limpeza Residencial',
          quantity: 1,
          unit_amount: amountCents,
        },
      ],
      charges: [
        {
          reference_id: chargeReferenceId,
          description: description ?? 'Pagamento PIX LimpeJá',
          amount: {
            value: amountCents,
            currency: 'BRL',
          },
          payment_method: {
            type: 'PIX',
            pix: {
              expires_in: expiresInSeconds,
              expiration_date: expirationIso,
            },
          },
        },
      ], // opcional: se tiver endpoint público de webhook já exposto
      // notification_urls: [`${this.appBaseUrl}/payments/webhook/pagseguro`],
    }; // === 4. CHAMAR PAGSEGURO ORDER API ===

    const url = `${pagseguroBase}/orders`;

    this.logger.log({
      msg: 'PagBank ORDER PIX REQUEST',
      url,
      payload,
      idempotencyKey: idemKey,
    });

    let respData: any;
    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'idempotency-key': idemKey,
        },
        httpsAgent: this.pagseguroHttpsAgent,
        timeout: 15000,
      });
      respData = response.data;
    } catch (err: any) {
      this.logger.error({
        msg: 'PagBank ORDER PIX ERROR',
        response: err?.response?.data,
      });
      throw new BadRequestException('Falha ao criar PIX no PagBank.');
    } // === 5. MAPEAR RESPOSTA REAL DO PAGBANK ===

    const orderId: string = respData.id;
    const charge = respData.charges?.[0];
    if (!charge)
      throw new InternalServerErrorException('Resposta PagBank sem charge.');

    const chargeId: string = charge.id;
    const status = charge.status ?? 'WAITING';

    const qrco = charge.qr_code;
    const qrCodeId = qrco?.id ?? null;
    const qrCodeText = qrco?.text ?? ''; // pegar png oficial

    let qrCodeImageUrl = '';
    if (Array.isArray(charge.links)) {
      const png = charge.links.find((l: any) => l.rel === 'QRCODE.PNG');
      if (png) qrCodeImageUrl = png.href;
    }

    const expirationDateStr = charge.payment_method?.pix?.expiration_date;
    const expiresAt = expirationDateStr
      ? new Date(expirationDateStr)
      : expiration; // === 6. PERSISTIR PAYMENTINTENT (UPsert por bookingId) ===

    await this.prisma.paymentIntent.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amountCents,
        gateway: 'PAGSEGURO_ORDER_PIX',
        externalOrderId: orderId,
        externalChargeId: chargeId,
        externalQrCodeId: qrCodeId,
        qrCodeText,
        qrCodeUrl: qrCodeImageUrl,
        expiresAt,
        status: PaymentIntentStatus.PENDING,
        idempotencyKey: idemKey,
      },
      update: {
        amountCents,
        externalOrderId: orderId,
        externalChargeId: chargeId,
        externalQrCodeId: qrCodeId,
        qrCodeText,
        qrCodeUrl: qrCodeImageUrl,
        expiresAt,
        status: PaymentIntentStatus.PENDING,
        idempotencyKey: idemKey,
      },
    }); // colocar o booking como PENDING (aguardando pagamento)

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PENDING },
    }); // === 7. RESPONDER AO APP NO NOVO FORMATO ===

    return {
      orderId,
      chargeId,
      status: 'WAITING',
      qrCodeText,
      qrCodeImageUrl,
      expiresAt: expiresAt.toISOString(),
      amount: Number(amount),
      description,
      bookingId,
      providerId,
    };
  }

  async getPaymentIntentForBooking(
    bookingId: string,
    requesterUserId: string,
  ): Promise<PaymentIntentResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterUserId },
    });
    const isOwner =
      booking.client.userId === requesterUserId ||
      booking.provider.userId === requesterUserId;
    const isAdmin = requester?.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin)
      throw new ForbiddenException('Not allowed to view this PaymentIntent');

    const intent = await this.prisma.paymentIntent.findUnique({
      where: { bookingId: booking.id },
    });
    if (!intent) throw new NotFoundException('PaymentIntent not found');
    return this.mapPaymentIntent(intent);
  }

  async handlePixWebhook(
    signature: string,
    eventId: string,
    webhookData: any,
    rawBody?: Buffer,
  ): Promise<MessageResponseDto> {
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    this.logger.log(
      `[PaymentsService] handlePixWebhook - payload: ${JSON.stringify(webhookData)}`,
    );
    if (nodeEnv !== 'production' && rawBody && Buffer.isBuffer(rawBody)) {
      this.logger.debug(
        `[PaymentsService] RAW BODY (hex, dev-only): ${rawBody.toString('hex')}`,
      );
    }

    if (!signature || !eventId) {
      throw new BadRequestException('Missing webhook headers.');
    }

    const secret = this.configService.get<string>('PIX_WEBHOOK_SECRET');
    if (!secret) {
      if (nodeEnv === 'production') {
        throw new ForbiddenException('Webhook signature secret missing.');
      }
      this.logger.warn(
        'PIX_WEBHOOK_SECRET not configured. Skipping signature validation (non-production).',
      );
    } else {
      const incoming = signature?.startsWith('sha256=')
        ? signature.slice(7)
        : signature;
      let valid = false; // 1) Tenta validar com o rawBody exato recebido

      if (rawBody && Buffer.isBuffer(rawBody)) {
        try {
          const h1 = createHmac('sha256', secret).update(rawBody).digest('hex');
          if (nodeEnv !== 'production') {
            this.logger.debug(`HMAC RAW HEX (dev-only): ${h1}`);
          }
          valid = timingSafeEqual(
            Buffer.from(incoming, 'hex'),
            Buffer.from(h1, 'hex'),
          );
        } catch {
          valid = false;
        }
      } // 2) Se falhar, tenta com JSON.stringify (corpos reconstruídos pelo body-parser)

      if (!valid) {
        const bodyStr = JSON.stringify(webhookData ?? {});
        try {
          const h2 = createHmac('sha256', secret).update(bodyStr).digest('hex');
          if (nodeEnv !== 'production') {
            this.logger.debug(`HMAC JSON HEX (dev-only): ${h2}`);
          }
          valid = timingSafeEqual(
            Buffer.from(incoming, 'hex'),
            Buffer.from(h2, 'hex'),
          );
        } catch {
          valid = false;
        }
      }

      if (!valid) {
        throw new ForbiddenException('Invalid webhook signature.');
      }
    } // replay protection

    const exists = await this.prisma.webhookReplay.findUnique({
      where: { eventId },
    });
    if (!exists) {
      await this.prisma.webhookReplay.create({
        data: { source: 'pix', eventId },
      });
    } else {
      this.logger.debug(`PIX webhook replay ${eventId} ignored.`);
      return { message: 'ok' };
    }

    const transactionId = webhookData.transactionId as string;
    const status = webhookData.status?.toString() || '';
    if (!transactionId || !status) {
      throw new BadRequestException(
        'Dados essenciais (transactionId, status) ausentes no webhook.',
      );
    }

    try {
      // Permitir tanto o gatewayTransactionId (externo) quanto o id interno da transação
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          OR: [{ gatewayTransactionId: transactionId }, { id: transactionId }],
        },
      });
      if (!transaction) {
        this.logger.warn(
          `Transaction with gatewayTransactionId ${transactionId} not found.`,
        );
        return { message: 'Transaction not found for webhook' };
      } // Mapear status

      let newTransactionStatus = 'PENDING';
      let bookingNewStatus: BookingStatus | undefined;
      let intentNewStatus: PaymentIntentStatus | undefined;
      switch (status.toLowerCase()) {
        case 'paid':
        case 'completed':
          newTransactionStatus = 'COMPLETED';
          bookingNewStatus = BookingStatus.CONFIRMED;
          intentNewStatus = PaymentIntentStatus.PAID;
          break;
        case 'canceled':
        case 'voided':
          newTransactionStatus = 'CANCELED';
          bookingNewStatus = BookingStatus.CANCELED;
          intentNewStatus = PaymentIntentStatus.REFUNDED;
          break;
        case 'processing':
        case 'pending':
          newTransactionStatus = 'PENDING';
          intentNewStatus = PaymentIntentStatus.PENDING;
          break;
        default:
          newTransactionStatus = status.toUpperCase();
      }

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: newTransactionStatus },
      }); // Atualizar PaymentIntent pelo externalRef
      // Procura o PaymentIntent usando o externalRef preferencialmente do transaction.gatewayTransactionId

      const refForIntent = transaction.gatewayTransactionId || transactionId;
      let intent = await this.prisma.paymentIntent.findFirst({
        where: { externalRef: refForIntent },
      });
      if (!intent && transaction.bookingId) {
        // Fallback: procura pelo bookingId (caso seeds usem refs diferentes entre Transaction e PaymentIntent)
        intent = await this.prisma.paymentIntent.findFirst({
          where: { bookingId: transaction.bookingId },
        });
      }
      if (intent && intentNewStatus) {
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: intentNewStatus },
        });
        await this.prisma.paymentEvent.create({
          data: {
            paymentIntentId: intent.id,
            type: `webhook:${status}`,
            payload: webhookData,
          },
        });
      }

      if (transaction.bookingId && bookingNewStatus) {
        // Use BookingsService para garantir side-effects (notificações/agenda de lembretes)
        await this.bookingsService.updateStatus(
          transaction.bookingId,
          bookingNewStatus,
          UserRole.ADMIN,
        ); // Notificação imediata ao PROVEDOR (pagamento confirmado)

        if (newTransactionStatus === 'COMPLETED') {
          try {
            const b = await this.prisma.booking.findUnique({
              where: { id: transaction.bookingId },
              include: {
                provider: { include: { user: true } },
                client: { include: { user: true } },
              },
            });
            if (b?.provider?.userId) {
              const hora = (b.scheduledTime || '').slice(0, 5);
              await this.queues.addNotificationJob('send-notification', {
                userId: b.provider.userId,
                kind: 'booking_confirmed',
                title: 'Serviço confirmado',
                body: `Limpeza com ${b.client?.user?.fullName || 'cliente'}, hoje às ${hora}.`,
                deeplink: `/(provider)/active-booking/${b.id}`,
                priority: 1,
                idempotencyKey: `evt:booking_confirmed:${b.id}:provider`,
              });
            }
          } catch (e) {
            this.logger.warn(
              `[PaymentsService] Falha ao enfileirar notificação de confirmação para booking ${transaction.bookingId}: ${e?.message || e}`,
            );
          }
        }
      }

      return {
        message: `Webhook processed for transaction ${transaction.id}.`,
      };
    } catch (e: any) {
      this.logger.error('Erro ao processar webhook PIX:', e?.message, e?.stack);
      return {
        message:
          'Erro interno ao processar webhook PIX, mas o erro foi logado.',
      };
    }
  }

  async requestWithdrawal(
    providerId: string,
    dto: RequestWithdrawalDto,
    idempotencyKey?: string,
  ) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: { userId: true },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return this.payoutsService.requestWithdrawal(
      provider.userId,
      dto as any,
      idempotencyKey,
    );
  }

  async handleWithdrawalWebhook(
    signature: string,
    eventId: string,
    payload: any,
  ) {
    return this.payoutsService.handleGatewayWebhook(
      signature,
      eventId,
      payload,
    );
  }

  private mapPaymentIntent(
    pi: Prisma.PaymentIntentUncheckedCreateInput & {
      id: string;
      createdAt?: any;
      updatedAt?: any;
    },
  ): PaymentIntentResponseDto {
    // Método auxiliar para mapear para DTO
    const anyPi: any = pi;
    return {
      id: anyPi.id,
      bookingId: anyPi.bookingId,
      amountCents: anyPi.amountCents,
      amount: anyPi.amountCents / 100,
      status: anyPi.status,
      gateway: anyPi.gateway,
      externalRef: anyPi.externalRef ?? null,
      externalOrderId: anyPi.externalOrderId ?? null,
      externalChargeId: anyPi.externalChargeId ?? null,
      externalQrCodeId: anyPi.externalQrCodeId ?? null,
      qrCodeUrl: anyPi.qrCodeUrl ?? null,
      qrCodeText: anyPi.qrCodeText ?? null,
      expiresAt: anyPi.expiresAt
        ? new Date(anyPi.expiresAt).toISOString()
        : null,
      createdAt: (anyPi.createdAt instanceof Date
        ? anyPi.createdAt
        : new Date(anyPi.createdAt)
      ).toISOString(),
      updatedAt: (anyPi.updatedAt instanceof Date
        ? anyPi.updatedAt
        : new Date(anyPi.updatedAt)
      ).toISOString(),
    };
  } // Process recurring payment for a generated booking (via subscription)

  async processRecurringPayment(
    clientUserId: string,
    subscriptionId: string,
    bookingId: string,
    amount: number,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { providerId: true },
    });
    if (!booking?.providerId) {
      throw new NotFoundException('Provider not found for booking.');
    }
    await this.createPixCharge(clientUserId, {
      amount,
      description: `Recurring payment for subscription ${subscriptionId}`,
      bookingId,
      providerId: booking.providerId,
    });
  }
}
