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
  Prisma, // Importe Prisma para usar o tipo BookingGetPayload
  PaymentIntentStatus,
  TransactionType,
  UserRole,
  LedgerEntryType,
  TransactionStatus,
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

// 1. Definição do Tipo (Recomendado para corrigir o Erro 2339)
// Este tipo é usado para garantir a tipagem correta ao incluir relações aninhadas do Prisma.
type BookingWithUsers = Prisma.BookingGetPayload<{
  include: {
    provider: { include: { user: true } };
    client: { include: { user: true } };
  };
}>;

/**
 * Função auxiliar para parsear payloads que não são JSON (ex: URL-encoded).
 * @param payload O payload bruto, que pode ser string ou Buffer.
 * @returns Um objeto com os dados parseados.
 */
function parsePixTextPayload(payload: string | Buffer): Record<string, any> {
  let payloadString: string;
  if (typeof payload !== 'string') {
    payloadString = payload.toString('utf8');
  } else {
    payloadString = payload;
  }

  // Tenta parsear como URL-encoded
  try {
    const params = new URLSearchParams(payloadString);
    const result: Record<string, any> = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  } catch (e) {
    // Se falhar, retorna o payload bruto em um objeto para inspeção
    return { raw: payloadString };
  }
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private pagseguroApiToken: string | undefined;
  private pagseguroApiBaseUrl: string;
  private appBaseUrl: string | undefined;
  private pagseguroHttpsAgent?: https.Agent;

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
      'https://api.pagseguro.com',
    );
    this.appBaseUrl =
      this.configService.get<string>('API_BASE_URL') || undefined;

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
  }

  /**
   * Processa o webhook de notificação de pagamento (compra do cliente) enviado pelo PSP.
   * Este método deve validar a assinatura (HMAC) e atualizar o status do PaymentIntent/Booking.
   */
  async handlePaymentWebhook(
    signature: string,
    payload: any,
  ): Promise<void | MessageResponseDto> {
    this.logger.log(
      `[PaymentsService] Webhook recebido. Evento: ${payload.event}`,
    );

    // 1. Validação da Assinatura (HMAC)
    const secret = this.configService.get<string>('PIX_WEBHOOK_SECRET');
    if (!secret || !this.validateHmac(signature, payload)) {
      this.logger.warn(
        'Webhook com assinatura inválida recebido ou secret não configurado.',
      );
      throw new ForbiddenException('Assinatura de Webhook Inválida.');
    }
    // 2. Processamento do Evento (CORRIGIDO)
    const status = payload?.transaction?.status
      ? String(payload.transaction.status).toUpperCase()
      : '';

    if (
      payload.event === 'charge.paid' ||
      status === 'PAID' ||
      status === 'COMPLETED' ||
      status === 'APPROVED'
    ) {
      const externalRef =
        payload?.data?.id ||
        payload?.resource_id ||
        payload?.transaction?.id;

      const bookingId =
        payload?.reference_id ||
        payload?.transaction?.reference_id ||
        externalRef;

      if (bookingId) {
        const intent = await this.prisma.paymentIntent.findFirst({
          where: { externalRef },
          // MODIFICAÇÃO: Incluir o booking e o provider para acessar totalPrice e userId
          include: {
            booking: {
              include: {
                provider: {
                  select: { userId: true },
                },
              },
            },
          },
        });

        if (intent && intent.status !== PaymentIntentStatus.PAID) {
          // Inicia uma transação para garantir atomicidade das atualizações
          await this.prisma.$transaction(async (tx) => {
            await tx.paymentIntent.update({
              where: { id: intent.id },
              data: { status: PaymentIntentStatus.PAID },
            });

            // O booking já está incluído no `intent`
            const booking = intent.booking;

            if (!booking) {
              this.logger.error(`[PaymentsService] Booking not found for PaymentIntent ${intent.id}. Cannot process ledger.`);
              // Se o booking não for encontrado, loga o erro e sai da transação.
              // Dependendo da lógica de negócio, pode-se lançar uma exceção ou apenas logar.
              return;
            }

            // Garante que o status do booking seja CONFIRMED
            await tx.booking.update({
              where: { id: booking.id },
              data: { status: BookingStatus.CONFIRMED },
            });

            this.logger.log(
              `[PaymentsService] Pagamento ${externalRef} para o agendamento ${booking.id} CONFIRMADO.`,
            );

            // --- INÍCIO DA IMPLEMENTAÇÃO SEGURA (IDEMPOTENTE) DO LEDGER ---
            this.logger.log(`[PaymentsService] Processando ledger para booking ${booking.id}...`);

            // 1. Proteção contra duplicação: Verifica se já existe uma entrada HOLD para este booking
            const alreadyExists = await tx.ledgerEntry.findFirst({
              where: {
                bookingId: booking.id,
                type: LedgerEntryType.HOLD,
                amount: { gt: 0 }, // Assume que HOLD sempre tem valor positivo
              },
            });

            if (alreadyExists) {
              this.logger.warn(
                `[PaymentsService] Entrada de ledger tipo HOLD para o booking ${booking.id} já existe. Ignorando duplicação.`,
              );
              return; // Webhook duplicado ou reprocessamento, não cria novas entradas no ledger
            }

            // 2. Valores: Calcula os valores brutos e de taxa
            // booking.totalPrice é esperado ser um Prisma.Decimal ou um tipo numérico compatível
            const grossAmount = new Prisma.Decimal(booking.totalPrice);
            const feeAmount = grossAmount.mul(0.1); // Calcula 10% de taxa
            const providerId = booking.provider.userId; // Acessa o userId do provider incluído

            // 3. Ledger: Cria as entradas no ledger
            await tx.ledgerEntry.createMany({
              data: [
                {
                  userId: providerId,
                  bookingId: booking.id,
                  amount: grossAmount,
                  type: LedgerEntryType.HOLD,
                  note: `Pagamento bruto recebido (retido)`,
                },
                {
                  userId: providerId,
                  bookingId: booking.id,
                  amount: feeAmount.neg(), // A taxa é um débito, então é negativa
                  type: LedgerEntryType.FEE,
                  note: `Taxa da plataforma`,
                },
              ],
            });
            this.logger.log(`[PaymentsService] Entradas de ledger criadas para o booking ${booking.id}.`);
            // --- FIM DA IMPLEMENTAÇÃO SEGURA (IDEMPOTENTE) DO LEDGER ---
          });
        } else if (!intent) {
          this.logger.warn(
            `[PaymentsService] Webhook para ref ${externalRef} recebido, mas PaymentIntent não encontrado.`,
          );
        }
      }
    }

    // 3. OK para o PSP
    return { message: 'Webhook processado com sucesso' };
  }

  // Função de validação HMAC
  private validateHmac(signature: string, payload: any): boolean {
    const secret = this.configService.get<string>('PIX_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error(
        'PIX_WEBHOOK_SECRET não configurado. Validação HMAC desativada.',
      );
      return false; // Não pode validar sem o segredo
    }
    const computedSignature = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Usar timingSafeEqual para prevenir ataques de temporização
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(computedSignature, 'hex'),
    );
  }

  // A função handlePixWebhook corrigida e com a tipagem `BookingWithUsers`
  // A função handlePixWebhook corrigida e funcional
  async handlePixWebhook(rawBody: any, parsedBody: any) {
    try {
      let data: any = null;

      // 1. PRIORIDADE PARA O PARSED (se veio form-urlencoded)
      if (parsedBody && typeof parsedBody === 'object') {
        data = parsedBody;
      }

      // 2. SE NÃO VEIO PARSED → tenta JSON puro
      if (!data && rawBody) {
        try {
          data = JSON.parse(rawBody.toString());
          console.log("[Webhook PIX] JSON parseado com sucesso");
        } catch {
          console.warn("[Webhook PIX] JSON inválido → usando string bruta");
          data = { raw: rawBody.toString() };
        }
      }

      if (!data) return { success: false, message: "Webhook vazio" };

      console.log(">>> WEBHOOK PARSED:", data);

      // ---------------------------------------------------------
      // EXTRAI O reference_id REAL do PagBank
      // ---------------------------------------------------------

      const referenceId =
        data?.reference_id ||
        data?.transaction?.reference_id ||
        data?.charges?.[0]?.reference_id ||
        null;

      // ---------------------------------------------------------
      // AQUI ESTÁ A LÓGICA DO "PAID" CORRIGIDA
      // ---------------------------------------------------------

      const chargeStatus =
        data?.charges?.[0]?.status?.toUpperCase() ||
        data?.status?.toUpperCase() ||
        null;

      if (chargeStatus === "PAID" || chargeStatus === "APPROVED" || chargeStatus === "COMPLETED") {
        console.log("⚡ PAGAMENTO PIX CONFIRMADO ⚡");
        console.log("REFERENCE_ID:", referenceId);

        await this.confirmPixPayment(referenceId);

        return { ok: true };
      }

      // ---------------------------------------------------------
      // FIM DO BLOCO CORRIGIDO
      // ---------------------------------------------------------

      // 3. Detecta chargeId para fallback
      const chargeId =
        data?.charge?.id ||
        data?.chargeId ||
        data?.id ||
        data?.charge_id ||
        data?.transaction_id ||
        data?.order_id ||
        data?.order?.id ||
        data?.resource_id ||
        null;

      const status = data?.status || null;

      if (!chargeId) return { success: false, message: "chargeId ausente" };

      // 4. BUSCA O PAYMENTINTENT
      const intent = await this.prisma.paymentIntent.findFirst({
        where: { externalRef: String(chargeId) },
      });

      if (!intent) {
        console.warn(`Nenhum PaymentIntent encontrado para chargeId ${chargeId}`);
        return {
          success: true,
          message: "chargeId não associado a nenhum booking",
        };
      }

      // 5. CONFIRMA O BOOKING
      await this.prisma.booking.update({
        where: { id: intent.bookingId },
        data: { status: "CONFIRMED" },
      });

      return {
        success: true,
        message: "Webhook processado",
        chargeId,
        status,
      };

    } catch (err) {
      console.error("Erro no webhook PIX:", err);
      return { success: false, message: "Erro interno no webhook" };
    }
  }

  async confirmPixPayment(referenceId: string) {
    this.logger.log(">>> CONFIRMANDO PIX PARA REFERENCE:", referenceId);

    if (!referenceId) {
      this.logger.warn("confirmPixPayment chamado sem referenceId");
      return;
    }

    const intent = await this.prisma.paymentIntent.findFirst({
      where: {
        OR: [
          { externalOrderId: referenceId },
          { externalChargeId: referenceId },
        ],
      },
    });

    if (!intent) {
      this.logger.warn("Nenhum PaymentIntent encontrado para referência:", referenceId);
      return;
    }

    // A lógica de ledger foi movida para handlePaymentWebhook para generalidade.
    // Aqui, apenas confirmamos o booking, se ainda não estiver confirmado.
    const booking = await this.prisma.booking.findUnique({
      where: { id: intent.bookingId },
      select: { status: true }, // Apenas o status para verificar
    });

    if (booking && booking.status !== BookingStatus.CONFIRMED) {
      await this.prisma.booking.update({
        where: { id: intent.bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });
      this.logger.log("✓ Booking confirmado via PIX:", intent.bookingId);
    } else if (booking) {
      this.logger.log(`Booking ${intent.bookingId} já está CONFIRMED. Nenhuma ação necessária.`);
    } else {
      this.logger.warn(`Booking ${intent.bookingId} não encontrado ao tentar confirmar PIX.`);
    }
  }


  // Admin: listar transações com filtros básicos
  async listTransactions(type?: string, status?: string) {
    const where: Prisma.TransactionWhereInput = {};

    // Format TYPE (string → enum)
    if (type) {
      const normalizedType = type.toUpperCase() as keyof typeof TransactionType;

      if (TransactionType[normalizedType]) {
        where.type = TransactionType[normalizedType];
      } else {
        throw new BadRequestException(`Tipo de transação inválido: ${type}`);
      }
    }

    // Format STATUS (string → enum)
    if (status) {
      const normalizedStatus = status.toUpperCase() as keyof typeof TransactionStatus;

      if (TransactionStatus[normalizedStatus]) {
        where.status = TransactionStatus[normalizedStatus];
      } else {
        throw new BadRequestException(`Status de transação inválido: ${status}`);
      }
    }

    const txs = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return txs.map((t) => ({
      id: t.id,
      providerId: t.providerId,
      userId: undefined, // preservado exatamente como no seu código
      amount: Number(t.amount),
      type: t.type,
      status: t.status,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      bookingId: t.bookingId,
      gatewayTransactionId: t.gatewayTransactionId,
      qrCodeUrl: t.qrCodeUrl,
      transactionRef: t.transactionRef,
      couponId: t.couponId,
    }));
  }

  // Admin: listar saques (Payouts) com mapeamento simples
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
  }

  /**
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
  }

  /**
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
  }

  /**
   * Registra ambos os webhooks (PIX e Payouts). Retorna payloads de criação.
   */
  async registerAllWebhooks(pixUrl?: string, payoutsUrl?: string) {
    const pix = await this.registerPixWebhook(pixUrl);
    const payouts = await this.registerPayoutsWebhook(payoutsUrl);
    return { pix, payouts };
  }

  // Admin: aprovar saque (marca como PAID)
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
  }

  // Admin: rejeitar saque (marca como FAILED)
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
  }

  // Admin: iniciar reembolso de uma transação (simplificado)
  async initiateRefund(transactionId: string, amount?: number) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    const refundAmount =
      amount != null ? new Prisma.Decimal(amount) : tx.amount;
    // Criar transação de REFUND e marcar original como REFUNDED
    await this.prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'REFUNDED' },
    });
    const refund = await this.prisma.transaction.create({
      data: {
        providerId: tx.providerId || undefined,
        amount: refundAmount,
        type: TransactionType.REFUND,
        status: TransactionStatus.PAID,
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

  /**
   * Cria um PIX real usando PagBank ORDER API (fluxo oficial).
   * Substitui totalmente o fluxo legado /pix/charges.
   */
  async createPixCharge(
    clientUserId: string,
    dto: CreatePixChargeDto,
    idempotencyKey?: string,
  ): Promise<PixChargeResponseDto> {
    const { description, bookingId, providerId } = dto; // amount sempre derivado do booking

    if (!providerId) throw new BadRequestException('providerId é obrigatório.');
    if (!bookingId) throw new BadRequestException('bookingId é obrigatório.');

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: { include: { user: true } }, provider: true },
    });

    if (!booking) throw new NotFoundException('Booking não encontrado.');
    if (booking.client?.userId !== clientUserId)
      throw new ForbiddenException('Você não pode pagar por este booking.');
    if (booking.providerId !== providerId)
      throw new BadRequestException('Booking não pertence a este provider.');
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking não está pendente para pagamento.');
    }

    const amountCents = Math.round(Number(booking.totalPrice) * 100);
    if (amountCents < 100)
      throw new BadRequestException('Valor mínimo é R$ 1,00.');

    const customerName =
      booking.client?.user?.fullName ??
      booking.client?.fullName ??
      'Cliente LimpeJá';
    const customerEmail = booking.client?.user?.email;
    const customerTaxId = booking.client?.cpf ?? '12345678909'; // fallback sandbox

    if (!customerEmail)
      throw new BadRequestException('Cliente sem e-mail válido.'); // === 2. CALCULAR EXPIRAÇÃO DO PIX ===

    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);
    const expirationIso = expiration.toISOString().replace('.000Z', '-03:00'); // === 3. MONTAR PAYLOAD PARA POST /orders ===

    const referenceId = `booking_${bookingId}`;

    const pagseguroBase = this.pagseguroApiBaseUrl;
    const apiToken = this.pagseguroApiToken;
    const idemKey = idempotencyKey ?? `pix-${bookingId}-${Date.now()}`;

    const payload = {
      reference_id: referenceId,
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
      qr_codes: [
        {
          amount: {
            value: amountCents,
          },
          expiration_date: expirationIso,
          instructions: description ?? 'Pagamento PIX LimpeJá',
        },
      ],
      // 🛑 USE ESTA LINHA CORRIGIDA (Descomentada e corrigida para 'pix')
      notification_urls: [`${this.appBaseUrl}/payments/webhook/pix`],
    }; // === 4. CHAMAR PAGSEGURO ORDER API ===

    const url = `${pagseguroBase}/orders`;

    this.logger.log({
      msg: 'PagBank ORDER PIX REQUEST',
      url,
      payload,
      idempotencyKey: idemKey,
    });

    const fetchFn: any = (global as any).fetch;
    if (!fetchFn) {
      throw new InternalServerErrorException(
        'fetch indisponível no runtime do servidor.',
      );
    }

    let respData: any;
    try {
      const response = await fetchFn(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'idempotency-key': idemKey,
        },
        body: JSON.stringify(payload),
        // Node fetch aceita agent para mTLS/CA customizado
        agent: this.pagseguroHttpsAgent,
      });

      const text = await response.text();
      try {
        respData = JSON.parse(text);
      } catch {
        this.logger.error({
          msg: 'PagBank ORDER PIX ERROR - JSON parse',
          response: text,
        });
        throw new InternalServerErrorException('Resposta inválida do PagBank.');
      }

      if (!response.ok) {
        this.logger.error({
          msg: 'PagBank ORDER PIX ERROR',
          status: response.status,
          response: respData,
        });
        throw new BadRequestException('Falha ao criar PIX no PagBank.');
      }
    } catch (err: any) {
      this.logger.error({
        msg: 'PagBank ORDER PIX ERROR',
        response: err?.response?.data ?? err?.message,
      });
      throw new BadRequestException('Falha ao criar PIX no PagBank.');
    } // === 5. MAPEAR RESPOSTA REAL DO PAGBANK ===

    const orderId: string = respData.id;
    const qr = respData.qr_codes?.[0];
    if (!qr) {
      throw new InternalServerErrorException(
        'Resposta PagBank sem qr_codes[0].',
      );
    }

    const chargeId: string = qr.id;
    const qrCodeId: string = qr.id;
    const status: PaymentIntentStatus = PaymentIntentStatus.PENDING;
    const qrCodeText: string = qr.text ?? ''; // pegar png oficial

    let qrCodeImageUrl = '';
    if (Array.isArray(qr.links)) {
      const png = qr.links.find((l: any) => l.rel === 'QRCODE.PNG');
      if (png) qrCodeImageUrl = png.href;
    }

    // compat variable for DB column expected by Prisma
    const qrCodeUrl = qrCodeImageUrl;

    const expirationDateStr: string | undefined = qr.expiration_date;
    const expiresAt =
      expirationDateStr && expirationDateStr.length > 0
        ? new Date(expirationDateStr)
        : expiration; // fallback to requested expiration if API omits

    const paymentIntentRecord = await this.prisma.paymentIntent.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amountCents,
        gateway: "PAGBANK_PIX",

        // 🔥 IDs reais do PagBank
        externalOrderId: orderId,
        externalChargeId: chargeId,
        externalQrCodeId: qrCodeId,

        // 🔥 REFERÊNCIA DO PAGBANK (booking_xxxxx)
        referenceId: referenceId,
        externalRef: referenceId,

        qrCodeText,
        qrCodeUrl,
        expiresAt,

        status,
        idempotencyKey: idemKey,
      },
      update: {
        amountCents,

        externalOrderId: orderId,
        externalChargeId: chargeId,
        externalQrCodeId: qrCodeId,

        // 🔥 GARANTE QUE ATUALIZA TAMBÉM
        referenceId: referenceId,
        externalRef: referenceId,

        qrCodeText,
        qrCodeUrl,
        expiresAt,

        status,
        idempotencyKey: idemKey,
      },
    });
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        // ❌ remover isso caso esteja aqui:
        // paymentStatus: 'PAID'
      }
    });
    // === 7. RESPONDER AO APP NO NOVO FORMATO ===

    return {
      orderId,
      chargeId,
      status: 'PENDING',
      qrCodeText,
      qrCodeImageUrl,
      expiresAt: expiresAt.toISOString(),
      amount: Number(amountCents) / 100,
      description,
      bookingId,
      providerId,

      // === PROPRIEDADES FALTANTES CORRIGIDAS ===
      id: paymentIntentRecord.id, // Adiciona o ID interno
      amountCents: amountCents, // Adiciona o valor em centavos
      // ==========================================
    } as PixChargeResponseDto;
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