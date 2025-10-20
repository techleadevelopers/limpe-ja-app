// src/payments/payments.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, Prisma, PaymentIntentStatus, TransactionType, UserRole } from '@prisma/client';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { createHmac, timingSafeEqual } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { QueuesService } from '../queues/queues.service';
import { CreatePixChargeDto, PixChargeResponseDto } from './dto/create-pix-charge.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { CouponsService } from '../coupons/coupons.service';
import { PayoutsService } from '../payouts/payouts.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private pagseguroApiToken: string | undefined;
  private pagseguroApiBaseUrl: string;
  private appBaseUrl: string | undefined;

  // property-injection para resolver o ciclo com BookingsService
  @Inject(forwardRef(() => BookingsService))
  private bookingsService!: BookingsService;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly couponsService: CouponsService,
    private readonly payoutsService: PayoutsService,
    private readonly queues: QueuesService,
  ) {
    this.pagseguroApiToken = this.configService.get<string>('PAGSEGURO_API_TOKEN') || undefined;
    this.pagseguroApiBaseUrl = this.configService.get<string>('PAGSEGURO_API_BASE_URL', 'https://sandbox.api.pagseguro.com');
    this.appBaseUrl = this.configService.get<string>('API_BASE_URL') || undefined;

    if (!this.pagseguroApiToken) {
      this.logger.warn('PAGSEGURO_API_TOKEN ausente. Integração real com PSP desativada (modo placeholder).');
    }
    if (!this.appBaseUrl) {
      this.logger.warn('API_BASE_URL ausente. Webhooks de PSP podem não funcionar externamente.');
    }
  }

  // Admin: listar transações com filtros básicos
  async listTransactions(type?: string, status?: string) {
    const where: Prisma.TransactionWhereInput = {};
    if (type) where.type = type as any;
    if (status) where.status = status;
    const txs = await this.prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' } });
    return txs.map(t => ({
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
  }

  // Admin: listar saques (Payouts) com mapeamento simples
  async listWithdrawals(status?: string) {
    const where: Prisma.PayoutWhereInput = status ? { status: status as any } : {};
    const payouts = await this.prisma.payout.findMany({ where, orderBy: { requestedAt: 'desc' } });
    return payouts.map(p => ({
      id: p.id,
      providerId: undefined,
      amount: Number(p.amount),
      status: (p.status === 'PAID' ? 'APPROVED' : (p.status === 'FAILED' || p.status === 'CANCELED') ? 'REJECTED' : 'PENDING'),
      requestedAt: (p.requestedAt as any as Date).toISOString(),
      processedAt: p.processedAt ? (p.processedAt as any as Date).toISOString() : null,
    }));
  }

  // Admin: aprovar saque (marca como PAID)
  async approveWithdrawal(id: string) {
    const payout = await this.prisma.payout.update({ where: { id }, data: { status: 'PAID', processedAt: new Date() } });
    return {
      id: payout.id,
      providerId: undefined,
      amount: Number(payout.amount),
      status: 'APPROVED',
      requestedAt: (payout.requestedAt as any as Date).toISOString(),
      processedAt: payout.processedAt ? (payout.processedAt as any as Date).toISOString() : null,
    };
  }

  // Admin: rejeitar saque (marca como FAILED)
  async rejectWithdrawal(id: string, _reason?: string) {
    const payout = await this.prisma.payout.update({ where: { id }, data: { status: 'FAILED', processedAt: new Date() } });
    return {
      id: payout.id,
      providerId: undefined,
      amount: Number(payout.amount),
      status: 'REJECTED',
      requestedAt: (payout.requestedAt as any as Date).toISOString(),
      processedAt: payout.processedAt ? (payout.processedAt as any as Date).toISOString() : null,
    };
  }

  // Admin: iniciar reembolso de uma transação (simplificado)
  async initiateRefund(transactionId: string, amount?: number) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    const refundAmount = amount != null ? new Prisma.Decimal(amount) : tx.amount;
    // Criar transação de REFUND e marcar original como REFUNDED
    await this.prisma.transaction.update({ where: { id: tx.id }, data: { status: 'REFUNDED' } });
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
  }

  // Cria cobrança PIX e PaymentIntent associado (placeholder caso PSP não esteja configurado)
  async createPixCharge(clientUserId: string, dto: CreatePixChargeDto): Promise<PixChargeResponseDto> {
    const { amount, description, bookingId, providerId } = dto;

    if (!providerId) {
      throw new BadRequestException('providerId é obrigatório.');
    }
    if (!bookingId) {
      throw new BadRequestException('bookingId é obrigatório.');
    }

    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw new NotFoundException('Provider not found.');
    }

    const clientUser = await this.prisma.user.findUnique({ where: { id: clientUserId } });
    if (!clientUser?.email) {
      throw new NotFoundException('Cliente não encontrado ou sem e-mail.');
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    // 1) Cria transação local
    const transaction = await this.prisma.transaction.create({
      data: {
        provider: { connect: { id: providerId } },
        booking: { connect: { id: bookingId } },
        amount: new Prisma.Decimal(amount),
        type: TransactionType.PAYMENT,
        status: 'PENDING',
        description: description,
      },
    });

    // 2) Simula externalRef/gateway id (ou usa PSP real se disponível)
    let externalRef = `local_pix_${transaction.id}`;
    let qrCodeText = `BR_CODE_${transaction.id}`;
    let qrCodeUrl = `${this.appBaseUrl || 'https://example.com'}/qrcode/${transaction.id}.png`;
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);

    // Integração PagSeguro (se token presente)
    if (this.pagseguroApiToken) {
      try {
        const headers: any = {
          Authorization: `Bearer ${this.pagseguroApiToken}`,
          'Content-Type': 'application/json',
        };
        const url = `${this.pagseguroApiBaseUrl.replace(/\/$/, '')}/pix/charges`;
        const payload: any = {
          amount: { value: Math.round(Number(amount) * 100) },
          description: description || `Booking ${bookingId}`,
          reference_id: transaction.id,
        };
        const res = await axios.post(url, payload, { headers, timeout: 10000 });
        externalRef = res.data?.id || res.data?.charge_id || res.data?.transaction_id || externalRef;
        qrCodeText = res.data?.brcode || res.data?.qr_code_text || qrCodeText;
        qrCodeUrl = res.data?.qr_code || res.data?.qr_code_url || qrCodeUrl;
      } catch (e: any) {
        this.logger.error(`PagSeguro charge error: ${e?.response?.status} ${JSON.stringify(e?.response?.data || e.message)}`);
      }
    }

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { gatewayTransactionId: externalRef, qrCodeUrl },
    });

    // 3) Upsert do PaymentIntent por booking
    const amountCents = Math.max(0, Math.round(Number(amount) * 100));
    const paymentIntent = await this.prisma.paymentIntent.upsert({
      where: { bookingId },
      update: {
        amountCents,
        status: PaymentIntentStatus.PENDING,
        gateway: 'PAGSEGURO_PIX',
        externalRef,
        qrCodeUrl,
        qrCodeText,
        expiresAt,
      },
      create: {
        bookingId,
        amountCents,
        status: PaymentIntentStatus.PENDING,
        gateway: 'PAGSEGURO_PIX',
        externalRef,
        qrCodeUrl,
        qrCodeText,
        expiresAt,
      },
    });

    // 4) Setar booking para PENDING (aguardando pagamento)
    await this.prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.PENDING } });

    return {
      transactionId: transaction.id,
      status: 'PENDING',
      brCode: qrCodeText,
      qrCodeImage: qrCodeUrl,
      expiresAt: expiresAt.toISOString(),
      amount: Number(amount),
      description,
      bookingId,
      providerId,
      paymentIntent: this.mapPaymentIntent(paymentIntent),
    };
  }

  async getPaymentIntentForBooking(bookingId: string, requesterUserId: string): Promise<PaymentIntentResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: { include: { user: true } }, provider: { include: { user: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const requester = await this.prisma.user.findUnique({ where: { id: requesterUserId } });
    const isOwner = booking.client.userId === requesterUserId || booking.provider.userId === requesterUserId;
    const isAdmin = requester?.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Not allowed to view this PaymentIntent');

    const intent = await this.prisma.paymentIntent.findUnique({ where: { bookingId: booking.id } });
    if (!intent) throw new NotFoundException('PaymentIntent not found');
    return this.mapPaymentIntent(intent);
  }

  async handlePixWebhook(signature: string, eventId: string, webhookData: any): Promise<MessageResponseDto> {
    this.logger.log(`[PaymentsService] handlePixWebhook - payload: ${JSON.stringify(webhookData)}`);

    if (!signature || !eventId) {
      throw new BadRequestException('Missing webhook headers.');
    }

    const secret = this.configService.get<string>('PIX_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('PIX_WEBHOOK_SECRET not configured. Skipping signature validation.');
    } else {
      const bodyStr = JSON.stringify(webhookData ?? {});
      const computed = createHmac('sha256', secret).update(bodyStr).digest('hex');
      const incoming = signature.startsWith('sha256=') ? signature.slice(7) : signature;
      try {
        const ok = timingSafeEqual(Buffer.from(incoming, 'hex'), Buffer.from(computed, 'hex'));
        if (!ok) throw new ForbiddenException('Invalid webhook signature.');
      } catch {
        throw new ForbiddenException('Invalid webhook signature.');
      }
    }

    // replay protection
    const exists = await this.prisma.webhookReplay.findUnique({ where: { eventId } });
    if (!exists) {
      await this.prisma.webhookReplay.create({ data: { source: 'pix', eventId } });
    } else {
      this.logger.debug(`PIX webhook replay ${eventId} ignored.`);
      return { message: 'ok' };
    }

    const transactionId = webhookData.transactionId;
    const status = webhookData.status?.toString() || '';
    if (!transactionId || !status) {
      throw new BadRequestException('Dados essenciais (transactionId, status) ausentes no webhook.');
    }

    try {
      const transaction = await this.prisma.transaction.findFirst({ where: { gatewayTransactionId: transactionId } });
      if (!transaction) {
        this.logger.warn(`Transaction with gatewayTransactionId ${transactionId} not found.`);
        return { message: 'Transaction not found for webhook' };
      }

      // Mapear status
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

      await this.prisma.transaction.update({ where: { id: transaction.id }, data: { status: newTransactionStatus } });

      // Atualizar PaymentIntent pelo externalRef
      const intent = await this.prisma.paymentIntent.findFirst({ where: { externalRef: transactionId } });
      if (intent && intentNewStatus) {
        await this.prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: intentNewStatus } });
        await this.prisma.paymentEvent.create({
          data: { paymentIntentId: intent.id, type: `webhook:${status}`, payload: webhookData },
        });
      }

      if (transaction.bookingId && bookingNewStatus) {
        // Use BookingsService para garantir side‑effects (notificações/agenda de lembretes)
        await this.bookingsService.updateStatus(transaction.bookingId, bookingNewStatus, UserRole.ADMIN);

        // Notificação imediata ao PROVEDOR (pagamento confirmado)
        if (newTransactionStatus === 'COMPLETED') {
          try {
            const b = await this.prisma.booking.findUnique({
              where: { id: transaction.bookingId },
              include: { provider: { include: { user: true } }, client: { include: { user: true } } },
            });
            if (b?.provider?.userId) {
              const hora = (b.scheduledTime || '').slice(0,5);
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
            this.logger.warn(`[PaymentsService] Falha ao enfileirar notificação de confirmação para booking ${transaction.bookingId}: ${e?.message || e}`);
          }
        }
      }

      // Cupom usado (se houver) quando pago
      if (newTransactionStatus === 'COMPLETED' && transaction.bookingId) {
        const b = await this.prisma.booking.findUnique({ where: { id: transaction.bookingId } });
        if (b?.couponId) await this.couponsService.markCouponAsUsed(b.couponId);
      }

      return { message: `Webhook processed for transaction ${transaction.id}.` };
    } catch (e: any) {
      this.logger.error('Erro ao processar webhook PIX:', e?.message, e?.stack);
      return { message: 'Erro interno ao processar webhook PIX, mas o erro foi logado.' };
    }
  }

  async requestWithdrawal(providerId: string, dto: RequestWithdrawalDto, idempotencyKey?: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId }, select: { userId: true } });
    if (!provider) throw new NotFoundException('Provider not found');
    return this.payoutsService.requestWithdrawal(provider.userId, dto as any, idempotencyKey);
  }

  async handleWithdrawalWebhook(signature: string, eventId: string, payload: any) {
    return this.payoutsService.handleGatewayWebhook(signature, eventId, payload);
  }

  private mapPaymentIntent(pi: Prisma.PaymentIntentUncheckedCreateInput & { id: string; createdAt?: any; updatedAt?: any }): PaymentIntentResponseDto {
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
      qrCodeUrl: anyPi.qrCodeUrl ?? null,
      qrCodeText: anyPi.qrCodeText ?? null,
      expiresAt: anyPi.expiresAt ? new Date(anyPi.expiresAt).toISOString() : null,
      createdAt: (anyPi.createdAt instanceof Date ? anyPi.createdAt : new Date(anyPi.createdAt)).toISOString(),
      updatedAt: (anyPi.updatedAt instanceof Date ? anyPi.updatedAt : new Date(anyPi.updatedAt)).toISOString(),
    };
  }

  // Process recurring payment for a generated booking (via subscription)
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
