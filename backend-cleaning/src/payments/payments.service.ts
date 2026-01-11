import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  forwardRef,
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
  PayoutStatus,
  PaymentIntent,
} from '@prisma/client';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { createHmac, timingSafeEqual } from 'crypto';
import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { formatScheduledTime } from '../bookings/booking-time.utils';
import { QueuesService } from '../queues/queues.service';
import {
  CreatePixChargeDto,
  PixChargeResponseDto,
} from './dto/create-pix-charge.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { CouponsService } from '../coupons/coupons.service';
import { PayoutsService } from '../payouts/payouts.service';
import { logMissingConfigOnce } from '../common/logging/missing-config.logger';
import { ConnectService } from '../connect/connect.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import { PaymentIntentLocker } from './payment-intent-locker';
import { canTransition, PaymentIntentState } from './payment.state-machine';
import {
  pixWebhookFailureCounter,
  pixWebhookProcessingDuration,
  pixWebhookSuccessCounter,
} from '../metrics/prometheus';

// 1. Definição do Tipo (Recomendado para corrigir o Erro 2339)
// Este tipo é usado para garantir a tipagem correta ao incluir relações aninhadas do Prisma.
type BookingWithUsers = Prisma.BookingGetPayload<{
  include: {
    provider: { include: { user: true } };
    client: { include: { user: true } };
  };
}>;

type PagSeguroTransaction = {
  status?: string;
  reference_id?: string;
  id?: string;
};

type PagSeguroCharge = {
  id?: string;
  reference_id?: string;
  status?: string;
};

type PagSeguroOrder = {
  id?: string;
};

type PagSeguroData = {
  id?: string;
  reference_id?: string;
  transaction?: PagSeguroTransaction;
  charges?: PagSeguroCharge[];
  charge?: { id?: string };
  chargeId?: string;
  charge_id?: string;
  transaction_id?: string;
  order_id?: string;
  order?: PagSeguroOrder;
  resource_id?: string;
  status?: string;
};

type PagSeguroWebhookPayload = {
  event?: string;
  data?: PagSeguroData;
  resource_id?: string;
  transaction?: PagSeguroTransaction;
  reference_id?: string;
  charge?: { id?: string };
  chargeId?: string;
  id?: string;
  charge_id?: string;
  transaction_id?: string;
  order_id?: string;
  order?: PagSeguroOrder;
  status?: string;
};

type PixWebhookPayload = {
  event?: string;
  reference_id?: string;
  transaction?: PagSeguroTransaction;
  charges?: PagSeguroCharge[];
  status?: string;
  charge?: { id?: string };
  chargeId?: string;
  id?: string;
  charge_id?: string;
  transaction_id?: string;
  order_id?: string;
  order?: PagSeguroOrder;
  resource_id?: string;
};

type PixFinalizeInput = {
  referenceId?: string | null;
  chargeId?: string | null;
  eventReference: string;
};

type PixFinalizeResult = {
  paymentIntentId: string | null;
  bookingId: string | null;
  didUpdate: boolean;
  success: boolean;
};

const mapPaymentIntentStatusToState = (
  status?: PaymentIntentStatus | null,
): PaymentIntentState => {
  switch (status) {
    case PaymentIntentStatus.PAID:
      return 'CONFIRMED';
    case PaymentIntentStatus.EXPIRED:
      return 'EXPIRED';
    case PaymentIntentStatus.REFUNDED:
    case PaymentIntentStatus.CHARGEBACK:
      return 'CANCELLED';
    case PaymentIntentStatus.PENDING:
    default:
      return 'PENDING';
  }
};

type PagBankLink = { rel?: string; href?: string };

type PagBankQrCode = {
  id: string;
  text?: string;
  expiration_date?: string;
  links?: PagBankLink[];
};

type PagBankOrderResponse = {
  id: string;
  qr_codes?: PagBankQrCode[];
};

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
    private readonly notificationsService: NotificationsService,
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
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ||
      process.env.NODE_ENV ||
      'development';
    const isProd = nodeEnv === 'production';

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
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `PaymentsService: falha ao iniciar mTLS agent: ${message}`,
      );
    }

    if (!this.pagseguroApiToken) {
      const msg =
        'PAGSEGURO_API_TOKEN ausente. Integração real com PSP desativada (modo placeholder).';
      if (isProd) {
        this.logger.warn(msg);
      } else {
        logMissingConfigOnce('PAGSEGURO_API_TOKEN', msg);
      }
    }
    if (!this.appBaseUrl) {
      const msg =
        'API_BASE_URL ausente. Webhooks de PSP podem nao funcionar externamente.';
      if (isProd) {
        this.logger.warn(msg);
      } else {
        logMissingConfigOnce('API_BASE_URL', msg);
      }
    }
    this.intentLocker = new PaymentIntentLocker(this.prisma);
  }

  private readonly intentLocker: PaymentIntentLocker;

  /**
   * Processa o webhook de notificação de pagamento (compra do cliente) enviado pelo PSP.
   * Este método deve validar a assinatura (HMAC) e atualizar o status do PaymentIntent/Booking.
   */
  async handlePaymentWebhook(
    signature: string,
    payload: PagSeguroWebhookPayload,
  ): Promise<void | MessageResponseDto> {
    this.logger.log(
      `[PaymentsService] Webhook recebido. Evento: ${payload?.event}`,
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
    const failedStatuses = [
      'FAILED',
      'CANCELED',
      'CANCELLED',
      'DECLINED',
      'DENIED',
      'REFUSED',
      'EXPIRED',
      'TIMEOUT',
    ];
    let shouldNotifyPaymentConfirmed = false;
    let bookingForNotification: BookingWithUsers | null = null;
    let bookingIdToConfirm: string | null = null;

    if (
      payload.event === 'charge.paid' ||
      status === 'PAID' ||
      status === 'COMPLETED' ||
      status === 'APPROVED'
    ) {
      const externalRef =
        payload?.data?.id || payload?.resource_id || payload?.transaction?.id;

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
                provider: { include: { user: true } },
                client: { include: { user: true } },
              },
            },
          },
        });

        if (intent && intent.status !== PaymentIntentStatus.PAID) {
          const currentState = mapPaymentIntentStatusToState(intent.status);
          const desiredState: PaymentIntentState = 'CONFIRMED';

          if (!canTransition(currentState, desiredState)) {
            this.logger.warn(
              `[PaymentsService] PaymentIntent ${intent.id} não pode transitar de ${currentState} para ${desiredState}; ignorando.`,
            );
            return { message: 'Webhook processado com sucesso' };
          }
          // Inicia uma transação para garantir atomicidade das atualizações
          await this.prisma.$transaction(async (tx) => {
            await tx.paymentIntent.update({
              where: { id: intent.id },
              data: { status: PaymentIntentStatus.PAID },
            });

            // O booking já está incluído no `intent`
            const booking = intent.booking;

            if (!booking) {
              this.logger.error(
                `[PaymentsService] Booking not found for PaymentIntent ${intent.id}. Cannot process ledger.`,
              );
              // Se o booking não for encontrado, loga o erro e sai da transação.
              // Dependendo da lógica de negócio, pode-se lançar uma exceção ou apenas logar.
              return;
            }

            // Agendar confirmation via BookingsService após a transação
            bookingIdToConfirm ??= booking.id;

            this.logger.log(
              `[PaymentsService] Pagamento ${externalRef} para o agendamento ${booking.id} CONFIRMADO.`,
            );

            // --- INÍCIO DA IMPLEMENTAÇÃO SEGURA (IDEMPOTENTE) DO LEDGER ---
            this.logger.log(
              `[PaymentsService] Processando ledger para booking ${booking.id}...`,
            );

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
            this.logger.log(
              `[PaymentsService] Entradas de ledger criadas para o booking ${booking.id}.`,
            );
            // --- FIM DA IMPLEMENTAÇÃO SEGURA (IDEMPOTENTE) DO LEDGER ---
          });
          shouldNotifyPaymentConfirmed = true;
          bookingForNotification = intent.booking;
        } else if (intent) {

          this.logger.log(

            `[PaymentsService] PaymentIntent ${intent.id} j? estava CONFIRMED; ignorando webhook duplicado.`,

          );

          return { message: 'Webhook processado com sucesso' };

        } else {

          this.logger.warn(

            `[PaymentsService] Webhook para ref ${externalRef} recebido, mas PaymentIntent nao encontrado.`,

          );

        }

        if (bookingIdToConfirm) {
          try {
            await this.bookingsService.systemChangeStatus(
              bookingIdToConfirm,
              BookingStatus.CONFIRMED,
            );
          } catch (err) {
            this.logger.warn(
              `[PaymentsService] Falha ao confirmar booking ${bookingIdToConfirm} via BookingsService: ${err?.message || err}`,
            );
          } finally {
            bookingIdToConfirm = null;
          }
        }
      }
    }

    // Dispara push físico após confirmação de pagamento (cliente e prestador)
    if (shouldNotifyPaymentConfirmed && bookingForNotification) {
      const b = bookingForNotification;
      const hora = formatScheduledTime(b.scheduledTime);
      const providerName = b.provider?.user?.fullName || 'Prestador';
      const clientName = b.client?.user?.fullName || 'Cliente';
      if (b.client?.userId) {
        await this.queues.addNotificationJob('send-notification', {
          userId: b.client.userId,
          kind: 'payment_confirmed',
          title: 'Pagamento confirmado',
          body: `Seu serviço com ${providerName} está confirmado para ${hora}.`,
          deeplink: `/agendamento/${b.id}`,
          priority: 1,
          idempotencyKey: `notif:payment_confirmed:client:${b.id}`,
        });
      }
      if (b.provider?.userId) {
        await this.queues.addNotificationJob('send-notification', {
          userId: b.provider.userId,
          kind: 'payment_confirmed',
          title: 'Novo atendimento confirmado',
          body: `${clientName || 'Cliente'} confirmou pagamento para ${hora}.`,
          deeplink: `/agendamento/${b.id}`,
          priority: 1,
          idempotencyKey: `notif:payment_confirmed:provider:${b.id}`,
        });
      }
      await this.persistPaymentConfirmedNotification(b);
    }

    // Falha de pagamento: marca intent como FAILED e notifica cliente
    if (failedStatuses.includes(status)) {
      const externalRef =
        payload?.data?.id || payload?.resource_id || payload?.transaction?.id;
      const intent = await this.prisma.paymentIntent.findFirst({
        where: { externalRef },
        include: {
          booking: {
            include: {
              client: { include: { user: true } },
            },
          },
        },
      });
      if (intent) {
        if (intent.status !== PaymentIntentStatus.EXPIRED) {
          await this.prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: PaymentIntentStatus.EXPIRED },
          });
          if (intent.bookingId) {
            await this.prisma.booking.update({
              where: { id: intent.bookingId },
              data: { status: BookingStatus.PENDING },
            });
          }
        }
        const b = intent.booking;
        if (b?.client?.userId) {
          const hora = formatScheduledTime(b.scheduledTime);
          await this.queues.addNotificationJob('send-notification', {
            userId: b.client.userId,
            kind: 'payment_failed',
            title: 'Pagamento não aprovado',
            body: `O pagamento do atendimento ${b.id} falhou. Refaça o pagamento para manter o agendamento às ${hora}.`,
            deeplink: `/agendamento/${b.id}`,
            priority: 1,
            idempotencyKey: `notif:payment_failed:client:${b.id}`,
          });
        }
      }
    }

    // 3. OK para o PSP
    return { message: 'Webhook processado com sucesso' };
  }

  // Função de validação HMAC
  private validateHmac(signature: string, payload: unknown): boolean {
    const secret = this.configService.get<string>('PIX_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error(
        'PIX_WEBHOOK_SECRET não configurado. Validação HMAC desativada.',
      );
      return false; // Não pode validar sem o segredo
    }
    const computedSignature = createHmac('sha256', secret)
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');

    // Usar timingSafeEqual para prevenir ataques de temporização
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(computedSignature, 'hex'),
    );
  }

  // A função handlePixWebhook corrigida e funcional com tipagem segura
  async handlePixWebhook(
    rawBody: unknown,
    parsedBody: unknown,
  ): Promise<Record<string, unknown>> {
    let data: PixWebhookPayload | null = null;

    if (parsedBody && typeof parsedBody === 'object') {
      data = parsedBody as PixWebhookPayload;
    }

    if (!data && (typeof rawBody === 'string' || rawBody instanceof Buffer)) {
      const rawString = typeof rawBody === 'string' ? rawBody : rawBody.toString();
      try {
        data = JSON.parse(rawString) as PixWebhookPayload;
        this.logger.debug('[PaymentsService] parsed PIX webhook payload as JSON');
      } catch {
        this.logger.warn('[PaymentsService] invalid PIX webhook JSON; falling back to raw string');
        data = { resource_id: rawString };
      }
    }

    if (!data) {
      throw new BadRequestException('Webhook vazio');
    }

    const referenceId =
      data?.reference_id ||
      data?.transaction?.reference_id ||
      data?.charges?.[0]?.reference_id ||
      null;
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
    const chargeStatus =
      data?.charges?.[0]?.status?.toUpperCase() ||
      data?.status?.toUpperCase() ||
      null;
    const webhookEvent = data?.event ?? data?.charges?.[0]?.id ?? 'unknown';
    const eventReference =
      referenceId ??
      data?.resource_id ??
      chargeId ??
      webhookEvent ??
      'unknown';
    const successStatuses = new Set(['PAID', 'APPROVED', 'COMPLETED']);
    if (!chargeStatus || !successStatuses.has(chargeStatus)) {
      return {
        ok: true,
        paymentIntentId: null,
        bookingId: null,
        didUpdate: false,
        webhookEvent,
        chargeStatus,
      };
    }

    this.logger.log(
      `[PaymentsService] PIX webhook received event=${webhookEvent} reference=${eventReference} status=${chargeStatus ?? 'unknown'}`,
    );

    const result = await this.finalizePixPayment({
      referenceId,
      chargeId,
      eventReference,
    });

    return {
      ok: true,
      paymentIntentId: result.paymentIntentId,
      bookingId: result.bookingId,
      didUpdate: result.didUpdate,
      webhookEvent,
    };
  }

  private async finalizePixPayment(
    input: PixFinalizeInput,
  ): Promise<PixFinalizeResult> {
    const timer = pixWebhookProcessingDuration.startTimer();
    const eventDesc = input.eventReference ?? 'unknown';
    const referenceDesc = input.referenceId ?? input.chargeId ?? 'unknown';

    try {
      const where = this.buildPixIntentWhere(
        input.referenceId,
        input.chargeId,
        input.eventReference,
      );
      if (!where) {
        this.logger.warn(
          `[PaymentsService] finalizePixPayment missing reference for event=${eventDesc}`,
        );
        pixWebhookSuccessCounter.inc({ reason: 'missing_reference' });
        timer({ outcome: 'success' });
        return {
          success: true,
          didUpdate: false,
          paymentIntentId: null,
          bookingId: null,
        };
      }

      const intent = await this.prisma.paymentIntent.findFirst({
        where,
        include: {
          booking: {
            include: {
              provider: { include: { user: true } },
              client: { include: { user: true } },
            },
          },
        },
      });
      if (!intent) {
        this.logger.warn(
          `[PaymentsService] finalizePixPayment no intent found for ${referenceDesc}`,
        );
        pixWebhookSuccessCounter.inc({ reason: 'intent_not_found' });
        timer({ outcome: 'success' });
        return {
          success: true,
          didUpdate: false,
          paymentIntentId: null,
          bookingId: null,
        };
      }

      if (intent.status === PaymentIntentStatus.PAID) {
        this.logger.log(
          `[PaymentsService] PaymentIntent ${intent.id} already PAID for ${referenceDesc}`,
        );
        pixWebhookSuccessCounter.inc({ reason: 'already_paid' });
        timer({ outcome: 'success' });
        return {
          success: true,
          didUpdate: false,
          bookingId: intent.bookingId,
          paymentIntentId: intent.id,
        };
      }

      const currentState = mapPaymentIntentStatusToState(intent.status);
      const desiredState: PaymentIntentState = 'CONFIRMED';
      if (!canTransition(currentState, desiredState)) {
        this.logger.warn(
          `[PaymentsService] cannot transition PaymentIntent ${intent.id} from ${currentState} to ${desiredState}`,
        );
        pixWebhookSuccessCounter.inc({ reason: 'invalid_transition' });
        timer({ outcome: 'success' });
        return {
          success: true,
          didUpdate: false,
          paymentIntentId: intent.id,
          bookingId: intent.bookingId ?? null,
        };
      }

      const booking = intent.booking;
      if (!booking) {
        throw new InternalServerErrorException(
          'Booking associado ao PaymentIntent nao encontrado.',
        );
      }

      const pendingStatuses = new Set<BookingStatus>([
        BookingStatus.PENDING_PAYMENT,
        BookingStatus.PENDING,
      ]);
      if (!pendingStatuses.has(booking.status)) {
        this.logger.warn(
          `[PaymentsService] Booking ${booking.id} status ${booking.status} not eligible for payment confirmation.`,
        );
        pixWebhookSuccessCounter.inc({ reason: 'invalid_booking_status' });
        timer({ outcome: 'success' });
        return {
          success: true,
          didUpdate: false,
          bookingId: booking.id,
          paymentIntentId: intent.id,
        };
      }

      if (booking.expiresAt && booking.expiresAt <= new Date()) {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.EXPIRED },
        });
        this.logger.warn(
          `[PaymentsService] Booking ${booking.id} expired before confirmation.`,
        );
        pixWebhookFailureCounter.inc({ reason: 'booking_expired_before_confirmation' });
        timer({ outcome: 'failure' });
        throw new BadRequestException('payment-expired');
      }

      const providerUserId = booking.provider?.userId;
      if (!providerUserId) {
        throw new InternalServerErrorException(
          'Provider userId ausente no booking para registrar ledger.',
        );
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.paymentIntent.update({
          where: { id: intent.id },
          data: { status: PaymentIntentStatus.PAID },
        });
        await tx.booking.update({
          where: { id: booking.id },
          data: { expiresAt: null },
        });

        const existingHold = await tx.ledgerEntry.findFirst({
          where: {
            bookingId: booking.id,
            type: LedgerEntryType.HOLD,
            amount: { gt: 0 },
          },
        });

        if (!existingHold) {
          this.logger.log(
            `[PaymentsService] creating ledger for booking ${booking.id}`,
          );
          const grossAmount = new Prisma.Decimal(booking.totalPrice);
          const feeAmount = grossAmount.mul(0.1);
          await tx.ledgerEntry.createMany({
            data: [
              {
                userId: providerUserId,
                bookingId: booking.id,
                amount: grossAmount,
                type: LedgerEntryType.HOLD,
                note: `Pagamento bruto recebido (retido)`,
              },
              {
                userId: providerUserId,
                bookingId: booking.id,
                amount: feeAmount.neg(),
                type: LedgerEntryType.FEE,
                note: `Taxa da plataforma`,
              },
            ],
          });
        } else {
          this.logger.log(
            `[PaymentsService] ledger already exists for booking ${booking.id}`,
          );
        }
      });

      if (booking.status !== BookingStatus.CONFIRMED) {
        await this.bookingsService.systemChangeStatus(
          booking.id,
          BookingStatus.CONFIRMED,
        );
      }

      pixWebhookSuccessCounter.inc({ reason: 'processed' });
      timer({ outcome: 'success' });
      return {
        success: true,
        didUpdate: true,
        bookingId: booking.id,
        paymentIntentId: intent.id,
      };
    } catch (error) {
      pixWebhookFailureCounter.inc({ reason: 'exception' });
      timer({ outcome: 'failure' });
      this.logger.error(
        `[PaymentsService] finalizePixPayment failed reference=${referenceDesc} event=${eventDesc}`,
        error,
      );
      throw new InternalServerErrorException(
        'Falha ao confirmar pagamento PIX via webhook.',
      );
    }
  }

  private buildPixIntentWhere(
    referenceId?: string | null,
    chargeId?: string | null,
    eventReference?: string | null,
  ): Prisma.PaymentIntentWhereInput | null {
    const normalize = (value?: string | null) => {
      const trimmed = value?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : undefined;
    };

    const filters: Prisma.PaymentIntentWhereInput[] = [];

    const addFilter = (predicate: Prisma.PaymentIntentWhereInput) => {
      filters.push(predicate);
    };

    const normalizedReference = normalize(referenceId);
    const normalizedCharge = normalize(chargeId);
    const normalizedEvent = normalize(eventReference);

    if (normalizedReference) {
      addFilter({ referenceId: normalizedReference });
      addFilter({ externalRef: normalizedReference });
    }

    if (normalizedCharge) {
      addFilter({ externalChargeId: normalizedCharge });
      addFilter({ externalQrCodeId: normalizedCharge });
    }

    if (normalizedEvent) {
      addFilter({ id: normalizedEvent });
      addFilter({ externalOrderId: normalizedEvent });
      addFilter({ externalChargeId: normalizedEvent });
      addFilter({ referenceId: normalizedEvent });
    }

    return filters.length > 0 ? { OR: filters } : null;
  }

  async confirmPixPayment(referenceId: string) {
    this.logger.log('>>> CONFIRMANDO PIX PARA REFERENCE:', referenceId);

    if (!referenceId) {
      this.logger.warn('confirmPixPayment chamado sem referenceId');
      return;
    }

    try {
      await this.finalizePixPayment({
        referenceId,
        eventReference: referenceId,
      });
    } catch (err) {
      this.logger.warn(
        `[PaymentsService] confirmPixPayment failed for reference ${referenceId}: ${err?.message || err}`,
      );
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
      const normalizedStatus =
        status.toUpperCase() as keyof typeof TransactionStatus;

      if (TransactionStatus[normalizedStatus]) {
        where.status = TransactionStatus[normalizedStatus];
      } else {
        throw new BadRequestException(
          `Status de transação inválido: ${status}`,
        );
      }
    }

    const txs = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    const where: Prisma.PayoutWhereInput = {};
    if (status) {
      const normalizedStatus =
        status.toUpperCase() as keyof typeof PayoutStatus;
      if (!PayoutStatus[normalizedStatus]) {
        throw new BadRequestException(`Status de saque invalido: ${status}`);
      }
      where.status = PayoutStatus[normalizedStatus];
    }
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
      requestedAt: p.requestedAt.toISOString(),
      processedAt: p.processedAt ? p.processedAt.toISOString() : null,
    }));
  }

  /**
   * Registra webhook de PIX no PagBank (produção requer access_token + mTLS).
   */
  async registerPixWebhook(
    targetUrl?: string,
  ): Promise<Record<string, unknown>> {
    const accessToken = await this.connectService.getAccessToken();
    const url = `${this.pagseguroApiBaseUrl.replace(/\/$/, '')}/pix/v1/webhooks`;
    const body = {
      url:
        targetUrl ||
        `${this.configService.get<string>('API_BASE_URL') || ''}/payments/webhook/pix`,
    };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };
    try {
      const res = await axios.post<Record<string, unknown>>(url, body, {
        headers,
        httpsAgent: this.pagseguroHttpsAgent,
        timeout: 15000,
      });
      return res.data;
    } catch (error) {
      const axiosError = axios.isAxiosError<unknown>(error) ? error : undefined;
      const status = axiosError?.response?.status ?? 'unknown';
      const data = axiosError?.response?.data;
      this.logger.error(
        `[PaymentsService] registerPixWebhook error: ${status} ${JSON.stringify(data ?? axiosError?.message ?? String(error))}`,
      );
      throw new InternalServerErrorException(
        this.extractGatewayMessage(data) ||
          'Falha ao registrar webhook de PIX.',
      );
    }
  }

  /**
   * Registra webhook de Payouts/Transferências.
   */
  async registerPayoutsWebhook(
    targetUrl?: string,
  ): Promise<Record<string, unknown>> {
    const accessToken = await this.connectService.getAccessToken();
    const url = `${this.pagseguroApiBaseUrl.replace(/\/$/, '')}/payouts/v1/webhooks`;
    const body = {
      url:
        targetUrl ||
        `${this.configService.get<string>('API_BASE_URL') || ''}/payouts/webhook/gateway`,
    };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };
    try {
      const res = await axios.post<Record<string, unknown>>(url, body, {
        headers,
        httpsAgent: this.pagseguroHttpsAgent,
        timeout: 15000,
      });
      return res.data;
    } catch (error) {
      const axiosError = axios.isAxiosError<unknown>(error) ? error : undefined;
      const status = axiosError?.response?.status ?? 'unknown';
      const data = axiosError?.response?.data;
      this.logger.error(
        `[PaymentsService] registerPayoutsWebhook error: ${status} ${JSON.stringify(data ?? axiosError?.message ?? String(error))}`,
      );
      throw new InternalServerErrorException(
        this.extractGatewayMessage(data) ||
          'Falha ao registrar webhook de Payouts.',
      );
    }
  }

  /**
   * Registra ambos os webhooks (PIX e Payouts). Retorna payloads de criação.
   */
  async registerAllWebhooks(
    pixUrl?: string,
    payoutsUrl?: string,
  ): Promise<{
    pix: Record<string, unknown>;
    payouts: Record<string, unknown>;
  }> {
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
      requestedAt: payout.requestedAt.toISOString(),
      processedAt: payout.processedAt ? payout.processedAt.toISOString() : null,
    };
  }

  // Admin: rejeitar saque (marca como FAILED)
  async rejectWithdrawal(id: string, reason?: string) {
    const payout = await this.prisma.payout.update({
      where: { id },
      data: { status: 'FAILED', processedAt: new Date() },
    });
    if (reason) {
      this.logger.warn(`Withdrawal ${id} rejected: ${reason}`);
    }
    return {
      id: payout.id,
      providerId: undefined,
      amount: Number(payout.amount),
      status: 'REJECTED',
      requestedAt: payout.requestedAt.toISOString(),
      processedAt: payout.processedAt ? payout.processedAt.toISOString() : null,
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
      createdAt: refund.createdAt.toISOString(),
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
    if (!this.pagseguroApiToken || !this.appBaseUrl) {
      throw new HttpException('PSP not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

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
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.PENDING_PAYMENT
    ) {
      throw new BadRequestException(
        'Booking não está pendente para pagamento.',
      );
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

    const claim = await this.intentLocker.claimPaymentIntent(
      bookingId,
      amountCents,
      referenceId,
      idemKey,
    );

    if (!claim.shouldCreate) {
      const readyIntent = await this.intentLocker.waitForIntentReady(
        claim.intent.id,
      );
      return this.mapIntentToPixResponse(readyIntent, description, providerId);
    }

    const intentId = claim.intent.id;

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

    let respData: PagBankOrderResponse;
    try {
      const response = await axios.post<PagBankOrderResponse>(url, payload, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'idempotency-key': idemKey,
        },
        httpsAgent: this.pagseguroHttpsAgent,
      });
      respData = response.data;
    } catch (error) {
      const axiosError = axios.isAxiosError<PagBankOrderResponse>(error)
        ? error
        : undefined;
      const status = axiosError?.response?.status ?? 'unknown';
      const data = axiosError?.response?.data;
      this.logger.error({
        msg: 'PagBank ORDER PIX ERROR',
        status,
        response: data ?? axiosError?.message ?? String(error),
      });
      throw new BadRequestException(
        this.extractGatewayMessage(data) || 'Falha ao criar PIX no PagBank.',
      );
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

    const qrCodeImageUrl = Array.isArray(qr.links)
      ? (qr.links.find((l) => l.rel === 'QRCODE.PNG')?.href ?? '')
      : '';

    // compat variable for DB column expected by Prisma
    const qrCodeUrl = qrCodeImageUrl;

    const expirationDateStr: string | undefined = qr.expiration_date;
    const expiresAt =
      expirationDateStr && expirationDateStr.length > 0
        ? new Date(expirationDateStr)
        : expiration; // fallback to requested expiration if API omits

    let paymentIntentRecord: PaymentIntent;
    try {
      paymentIntentRecord = await this.prisma.paymentIntent.update({
        where: { id: intentId },
        data: {
          bookingId,
          amountCents,
          gateway: 'PAGBANK_PIX',

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
      });
    } catch (error) {
      await this.prisma.paymentIntent.update({
        where: { id: intentId },
        data: { status: PaymentIntentStatus.EXPIRED },
      });
      throw error;
    }
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {},
    });
    // === 7. RESPONDER AO APP NO NOVO FORMATO ===

    return this.mapIntentToPixResponse(paymentIntentRecord, description, providerId);
  }

  private mapIntentToPixResponse(
    intent: PaymentIntent,
    description: string | undefined,
    providerId: string,
  ): PixChargeResponseDto {
    const expiresAt =
      intent.expiresAt?.toISOString() ?? new Date().toISOString();
    return {
      orderId: intent.externalOrderId ?? '',
      chargeId: intent.externalChargeId ?? '',
      status: intent.status,
      qrCodeText: intent.qrCodeText ?? '',
      qrCodeImageUrl: intent.qrCodeUrl ?? '',
      expiresAt,
      amount: Number(intent.amountCents) / 100,
      description,
      bookingId: intent.bookingId,
      providerId,
      id: intent.id,
      amountCents: intent.amountCents,
    } as PixChargeResponseDto;
  }

  private getScheduledAtIsoString(booking: BookingWithUsers): string | undefined {
    if (booking.scheduledStart) {
      return booking.scheduledStart.toISOString();
    }
    if (!booking.scheduledDate || !booking.scheduledTime) {
      return undefined;
    }
    const rawScheduledDate =
      booking.scheduledDate instanceof Date
        ? booking.scheduledDate.toISOString()
        : String(booking.scheduledDate);
    const scheduledDate = rawScheduledDate.includes('T')
      ? rawScheduledDate.split('T')[0]
      : rawScheduledDate;
    const timeSegment = formatScheduledTime(booking.scheduledTime);
    const normalizedTime =
      timeSegment.split(':').length === 2 ? `${timeSegment}:00` : timeSegment;
    const candidate = new Date(`${scheduledDate}T${normalizedTime}`);
    if (Number.isNaN(candidate.getTime())) {
      return undefined;
    }
    return candidate.toISOString();
  }

  private buildPaymentConfirmedNotificationPayload(
    booking: BookingWithUsers,
  ): CreateNotificationDto | null {
    const clientUserId = booking.client?.userId;
    if (!clientUserId) {
      return null;
    }
    const providerName =
      booking.provider?.user?.fullName ||
      booking.provider?.fullName ||
      'Prestador';
    const scheduledAt = this.getScheduledAtIsoString(booking);
    const amount = Number(booking.totalPrice ?? 0);

    const actionPayload = {
      bookingId: booking.id,
      providerName,
      scheduledAt,
      amount,
      paymentMethod: 'PIX',
    };

    return {
      userId: clientUserId,
      type: 'PAYMENT_CONFIRMED',
      title: 'Pagamento confirmado',
      message: `Pagamento confirmado para o seu atendimento com ${providerName}.`,
      targetUrl: `/client/bookings/${booking.id}`,
      category: 'payment',
      idempotencyKey: `payment_confirmed:client:${booking.id}`,
      scheduledAt,
      actionButtons: {
        primary: {
          text: 'Ver agendamento',
          action: 'view_booking',
          data: actionPayload,
        },
      },
    };
  }

  private async persistPaymentConfirmedNotification(
    booking: BookingWithUsers,
  ): Promise<void> {
    const dto = this.buildPaymentConfirmedNotificationPayload(booking);
    if (!dto) {
      return;
    }
    try {
      await this.notificationsService.createNotification(dto);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown error';
      this.logger.warn(
        `[PaymentsService] Falha ao persistir notificação PAYMENT_CONFIRMED: ${message}`,
      );
    }
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
      dto,
      idempotencyKey,
    );
  }

  async handleWithdrawalWebhook(
    signature: string,
    eventId: string,
    payload: Record<string, unknown>,
  ) {
    return this.payoutsService.handleGatewayWebhook(
      signature,
      eventId,
      payload,
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private extractGatewayMessage(payload: unknown): string | null {
    if (this.isRecord(payload) && typeof payload.message === 'string') {
      return payload.message;
    }
    return null;
  }

  private mapPaymentIntent(pi: PaymentIntent): PaymentIntentResponseDto {
    return {
      id: pi.id,
      bookingId: pi.bookingId,
      amountCents: pi.amountCents,
      amount: pi.amountCents / 100,
      status: pi.status,
      gateway: pi.gateway,
      externalRef: pi.externalRef ?? null,
      externalOrderId: pi.externalOrderId ?? null,
      externalChargeId: pi.externalChargeId ?? null,
      externalQrCodeId: pi.externalQrCodeId ?? null,
      qrCodeUrl: pi.qrCodeUrl ?? null,
      qrCodeText: pi.qrCodeText ?? null,
      expiresAt: pi.expiresAt ? pi.expiresAt.toISOString() : null,
      createdAt: pi.createdAt.toISOString(),
      updatedAt: pi.updatedAt.toISOString(),
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

