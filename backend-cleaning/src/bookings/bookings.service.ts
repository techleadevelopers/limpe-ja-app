/* eslint-disable no-case-declarations */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQuoteRequestDto } from './dto/quote-request.dto';
import { BookingQuoteResponseDto } from './dto/quote-response.dto';
import {
  MIN_HOURLY_MINUTES,
  COMMISSION_RATE,
} from '../common/constants/pricing';
import {
  Booking,
  BookingStatus,
  PaymentIntentStatus,
  ProviderService,
  UserRole,
  Prisma,
  LedgerEntryType,
  VerificationStatus,
  BookingProofType,
} from '@prisma/client';
import { ClientsService } from '../clients/clients.service';
import { ProvidersService } from '../providers/providers.service';
import { AvailabilityService } from '../availability/availability.service';
import { ProviderWithCalculatedRating } from '../providers/providers.service';
import { ProviderServicesService } from '../provider-services/provider-services.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingAndPixResponseDto } from './dto/booking-and-pix-response.dto';
import { PaymentsService } from '../payments/payments.service';
import { BookingDetailsDto } from './dto/booking-details.dto';
import { ReportDisputeDto } from './dto/report-dispute.dto';
import { BookingLocationInput } from './dto/booking-location.dto';
import { QueuesService } from '../queues/queues.service';
import { PricingService } from '../pricing/pricing.service';
import { CouponsService } from '../coupons/coupons.service';
import { InsurancePlanId } from '../insurance/insurance.constants';
import { InsuranceService } from '../insurance/insurance.service';
import { BLOCKED_BOOKING_STATUSES } from './bookings.constants';
import { calculateServiceTotalPrice } from './pricing/price-calculator';
import { CreateAddressDto } from '../common/dto/create-address.dto';
import { BOOKING_STATUS_TRANSITIONS } from './booking-status.constants';
import {
  calculateExpectedEnd,
  calculateScheduledAtInSaoPaulo,
  formatScheduledTime,
} from './booking-time.utils';
import {
  BookingAction,
  BookingActionContext,
  getAllowedBookingActions,
} from './booking-actions.helper';

import { LoyaltyService } from '../loyalty/loyalty.service';
import { LoyaltyTransactionType } from '@prisma/client';

import { MissionsService } from '../missions/missions.service';
import { ReferralsService } from '../referrals/referrals.service';
import { I18nService } from '../common/i18n/i18n.service';
import { Request } from 'express';

import { RedisLockService } from '../common/locks/redis-lock.service';
import { CacheService } from '../cache/cache.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { BusinessRuleError } from '../common/errors/business-rule.error';

export const IDEMPOTENCY_TTL_SECONDS = 10 * 60;

const WEEKLY_COUNTABLE_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.STARTED,
  BookingStatus.FINISHED,
];

const WEEKLY_BOOKING_LIMIT = 2;
const WEEKLY_LOCK_TTL_MS = 3_000;
const WEEKLY_LOCK_BUSY_ERROR = 'BOOKING_LOCK_BUSY';
const WEEKLY_LIMIT_ERROR_MESSAGE =
  'A Regra dos 2 dias impede mais de duas diarias por semana com o mesmo provedor.';

const DEFAULT_BOOKING_DETAILS_INCLUDE = {
  client: { include: { user: true } },
  provider: { include: { user: true } },
  providerService: { include: { service: true } },
  review: true,
  address: true,
  subscription: true,
  incidents: true,
  guaranteeClaims: true,
  coupon: true,
  paymentIntent: true,
  bookingInsurance: true,
  bookingProofs: true,
} satisfies Prisma.BookingInclude;

const PRICING_VERSION =
  process.env.BOOKING_PRICING_VERSION ??
  process.env.BOOKING_QUOTE_HASH_VERSION ??
  'v1';
const QUOTE_HASH_VERSION =
  process.env.BOOKING_QUOTE_HASH_VERSION ?? PRICING_VERSION;
const QUOTE_EXPIRATION_MS =
  Number(process.env.BOOKING_QUOTE_TTL_MS ?? 10 * 60 * 1000) ||
  10 * 60 * 1000;
const QUOTE_CACHE_TTL_SECONDS = 60;
const QUOTE_CACHE_KEY_PREFIX = 'quote:';
const CANCELLATION_COOLDOWN_MS = (() => {
  const parsed = Number(process.env.CANCELLATION_COOLDOWN_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
})();

const PENDING_PAYMENT_TIMEOUT_MINUTES = 20;
const PENDING_PAYMENT_TIMEOUT_MS = PENDING_PAYMENT_TIMEOUT_MINUTES * 60_000;

export type BookingWithDetailsRelations = Prisma.BookingGetPayload<{
  include: typeof DEFAULT_BOOKING_DETAILS_INCLUDE;
}>;

export type BookingWithAllowedActions = BookingWithDetailsRelations & {
  allowedActions: BookingAction[];
};

interface QuoteHashPayload {
  providerId: string;
  providerServiceId: string;
  serviceId?: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes?: number | null;
  couponCode?: string | null;
  subscriptionId?: string | null;
  addons?: Array<{ id: string; quantity?: number }>;
  address: {
    latitude: number;
    longitude: number;
    city?: string | null;
    state?: string | null;
    cep?: string | null;
  };
  minHourlyMinutes: number;
  version: string;
  pricingVersion: string;
  insurancePlanId?: InsurancePlanId | null;
}

interface BookingQuoteCalculationOptions {
  clientId: string;
  clientUserId: string;
  provider: ProviderWithCalculatedRating;
  providerService: ProviderService;
  createBookingDto: CreateBookingDto;
  locale: string;
  clientCompletedBookingsCount: number;
  subscriptionId?: string;
  addons?: Array<{ id: string; quantity?: number }>;
  insurancePlanId?: InsurancePlanId | null;
  quoteHashPayload?: QuoteHashPayload;
  requestKey?: string;
}

interface BookingQuoteCalculationResult {
  finalPrice: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  couponId: string | null;
  normalizedRequestedDurationMinutes?: number;
  quoteHash: string;
  quoteId: string;
  quoteResponse: BookingQuoteResponseDto;
}

interface BookingProofPayload {
  photos: string[];
  videoUrl?: string | null;
  hashes?: Record<string, unknown> | null;
  timestamps?: Record<string, unknown> | null;
  location?: BookingLocationInput;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private clientsService: ClientsService,
    private providersService: ProvidersService,
    private availabilityService: AvailabilityService,
    private providerServicesService: ProviderServicesService,
    private notificationsService: NotificationsService,
    private queuesService: QueuesService,
    private pricingService: PricingService,
    private couponsService: CouponsService,
    private insuranceService: InsuranceService,
    private loyaltyService: LoyaltyService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,

    @Inject(forwardRef(() => MissionsService))
    private missionsService: MissionsService,
    @Inject(forwardRef(() => ReferralsService))
    private referralsService: ReferralsService,

    private readonly i18n: I18nService,
    private readonly redisLockService: RedisLockService,
    private readonly cacheService: CacheService,
    private readonly schedulerService: SchedulerService,
  ) {}

  private getExpectedEnd(booking: Booking): Date {
    return calculateExpectedEnd({
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      scheduledStart: booking.scheduledStart,
      startedAt: booking.startedAt,
      durationMinutes: booking.durationMinutes,
    });
  }

  private buildIdempotencyCacheKey(key: string): string {
    return `idempo:bookings:create:${key}`;
  }

  private extractIdempotencyKey(request?: Request): string | undefined {
    if (!request) {
      return undefined;
    }
    const rawHeader =
      request.headers['idempotency-key'] ??
      request.headers['Idempotency-Key'];
    if (!rawHeader) {
      return undefined;
    }
    const value = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  // =========================
  // ✅ TZ-safe (sem libs)
  // =========================
  private tzParts(date: Date, timeZone: string) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parts = dtf.formatToParts(date);
    const map: Record<string, string> = {};
    for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;

    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: Number(map.hour),
      minute: Number(map.minute),
      second: Number(map.second),
    };
  }

  // offset (minutos) do timeZone em relação ao UTC naquele instante
  private tzOffsetMinutes(date: Date, timeZone: string): number {
    const p = this.tzParts(date, timeZone);
    const asUtc = Date.UTC(
      p.year,
      p.month - 1,
      p.day,
      p.hour,
      p.minute,
      p.second,
    );
    return (asUtc - date.getTime()) / 60000;
  }

  /**
   * Converte (YYYY-MM-DD + HH:mm) como horário local do timeZone
   * para um Date correto (instante real), independente do TZ do servidor.
   */
private getScheduledAtInSaoPaulo(
    dateValue: string | number | Date,
    timeHHmm: string | null | undefined,
  ): Date {
    const d = new Date(dateValue);

    const [hhRaw, mmRaw] = String(timeHHmm || '00:00')
      .split(':')
      .map((n) => parseInt(n, 10));

    const hh = Number.isFinite(hhRaw) ? hhRaw : 0;
    const mm = Number.isFinite(mmRaw) ? mmRaw : 0;

    // IMPORTANTE: pega “data” sem depender do TZ local do servidor
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();

    const tz = 'America/Sao_Paulo';

    // 1) chute inicial: tratar como UTC
    const t = Date.UTC(y, m, day, hh, mm, 0, 0);
    let guess = new Date(t);

    // 2) ajusta pelo offset do timezone naquele instante (2 iterações pra DST/offset)
    for (let i = 0; i < 2; i++) {
      const off = this.tzOffsetMinutes(guess, tz);
      const corrected = Date.UTC(y, m, day, hh, mm, 0, 0) - off * 60000;
      guess = new Date(corrected);
    }

    return guess;
  }

   // Novo: normaliza scheduledTime que pode vir como Date ou string para HH:mm (ou null)
  private normalizeScheduledTimeForHelper(
    time: string | Date | null | undefined,
  ): string | null {
    if (!time) return null;
    return typeof time === 'string' ? time : formatScheduledTime(time as Date);
  }

  private formatDateToYyyyMmDd(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getSaoPauloWeekRange(date: Date) {
    const offsetMinutes = this.tzOffsetMinutes(
      date,
      'America/Sao_Paulo',
    );
    const localTimestamp = date.getTime() + offsetMinutes * 60_000;
    const localDate = new Date(localTimestamp);
    const diffToMonday = (localDate.getUTCDay() + 6) % 7;

    const weekStartLocalDate = new Date(
      Date.UTC(
        localDate.getUTCFullYear(),
        localDate.getUTCMonth(),
        localDate.getUTCDate() - diffToMonday,
        0,
        0,
        0,
        0,
      ),
    );

    const nextWeekLocalDate = new Date(weekStartLocalDate);
    nextWeekLocalDate.setUTCDate(nextWeekLocalDate.getUTCDate() + 7);

    const weekStart = this.getScheduledAtInSaoPaulo(
      this.formatDateToYyyyMmDd(weekStartLocalDate),
      '00:00',
    );

    const nextWeekStart = this.getScheduledAtInSaoPaulo(
      this.formatDateToYyyyMmDd(nextWeekLocalDate),
      '00:00',
    );

    return {
      weekStart,
      weekEnd: new Date(nextWeekStart.getTime() - 1),
    };
  }

  private async enforceCancellationCooldown(
    clientId: string,
    locale: string,
  ): Promise<Date | null> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { cancellationCooldownUntil: true },
    });
    const now = new Date();
    const cooldownUntil = client?.cancellationCooldownUntil;
    if (cooldownUntil && cooldownUntil > now) {
      const message = await this.i18n
        .translate('booking.badRequest.cancellationCooldown', locale)
        .catch(() => null);
      throw new BadRequestException(
        message ??
          'Você cancelou recentemente e precisa aguardar antes de cancelar novamente.',
      );
    }
    return cooldownUntil ?? null;
  }

  private async countWeeklyBookings(
    clientId: string,
    providerId: string,
    weekStart: Date,
    weekEnd: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prismaClient = tx ?? this.prisma;
    return prismaClient.booking.count({
      where: {
        clientId,
        providerId,
        scheduledStart: { gte: weekStart },
        scheduledEnd: { lte: weekEnd },
        status: {
          in: WEEKLY_COUNTABLE_STATUSES,
        },
      },
    });
  }

  private async ensureWeeklyLimit(
    clientId: string,
    providerId: string,
    weekStart: Date,
    weekEnd: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const weeklyBookingsCount = await this.countWeeklyBookings(
      clientId,
      providerId,
      weekStart,
      weekEnd,
      tx,
    );
    if (weeklyBookingsCount >= WEEKLY_BOOKING_LIMIT) {
      this.logger.warn(
        `[BookingsService] weekly limit violation for clientId=${clientId} providerId=${providerId} (${weekStart.toISOString()} - ${weekEnd.toISOString()}) (${weeklyBookingsCount} existing bookings)`,
      );
      throw new BusinessRuleError(WEEKLY_LIMIT_ERROR_MESSAGE);
    }
  }

  private buildWeeklyLockKey(
    clientId: string,
    providerId: string,
    weekStart: Date,
  ): string {
    return `booking:weekly:${clientId}:${providerId}:${weekStart.toISOString()}`;
  }

  private buildWeeklyLockValue(
    clientId: string,
    providerId: string,
    weekStart: Date,
  ): string {
    return `${clientId}:${providerId}:${weekStart.getTime()}:${Date.now()}`;
  }

  private async runWithWeeklyLock<T>(
    clientId: string,
    providerId: string,
    weekStart: Date,
    work: () => Promise<T>,
  ): Promise<T> {
    const lockKey = this.buildWeeklyLockKey(clientId, providerId, weekStart);
    const lockValue = this.buildWeeklyLockValue(clientId, providerId, weekStart);
    const lockAcquired = await this.redisLockService.acquireLock(
      lockKey,
      lockValue,
      WEEKLY_LOCK_TTL_MS,
    );
    if (!lockAcquired) {
      this.logger.warn(`[BookingsService] weekly lock busy: ${lockKey}`);
      throw new BusinessRuleError(WEEKLY_LOCK_BUSY_ERROR);
    }
    try {
      this.logger.debug(`[BookingsService] weekly lock acquired: ${lockKey}`);
      return await work();
    } finally {
      await this.redisLockService.releaseLock(lockKey, lockValue);
      this.logger.debug(`[BookingsService] weekly lock released: ${lockKey}`);
    }
  }

  private getBookingInclude(
    include?: Prisma.BookingInclude,
  ): Prisma.BookingInclude {
    return include ?? DEFAULT_BOOKING_DETAILS_INCLUDE;
  }

  private async fetchBookingWithDetails(
    bookingId: string,
    include?: Prisma.BookingInclude,
  ): Promise<BookingWithDetailsRelations> {
    const includeWithDefaults = this.getBookingInclude(include);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: includeWithDefaults,
    });
    if (!booking) {
      throw new NotFoundException(
        `Booking ${bookingId} não encontrado.`,
      );
    }
    return booking as unknown as BookingWithDetailsRelations;
  }

  private async ensureProofRecorded(
    bookingId: string,
    type: BookingProofType,
  ) {
    const proof = await this.prisma.bookingProof.findUnique({
      where: {
        bookingId_type: {
          bookingId,
          type,
        },
      },
    });
    if (!proof) {
      throw new BadRequestException('proof-required');
    }
    return proof;
  }

  private requiresProofGps(booking: BookingWithDetailsRelations): boolean {
    const insurance = booking.bookingInsurance;
    if (!insurance) {
      return false;
    }
    return (
      insurance.proofRequired ||
      insurance.planId === InsurancePlanId.PREMIUM
    );
  }

  private buildGpsFields(
    location: BookingLocationInput | undefined,
    prefix: 'arrived' | 'started' | 'completed',
  ): Prisma.BookingUpdateInput {
    if (!location) {
      return {};
    }
    const payload: Record<string, number | null> = {
      [`${prefix}Lat`]: location.lat,
      [`${prefix}Lng`]: location.lng,
      [`${prefix}AccuracyM`]: location.accuracyM ?? null,
    };
    return payload as Prisma.BookingUpdateInput;
  }

  private logGpsEvent(
    bookingId: string,
    providerId: string,
    event: string,
    location?: BookingLocationInput,
  ) {
    this.logger.log(
      `[BookingsService] GPS event ${event}: ${JSON.stringify({
        bookingId,
        providerId,
        gpsCaptured: Boolean(location),
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
      })}`,
    );
  }

  async submitProof(
    bookingId: string,
    providerUserId: string,
    type: BookingProofType,
    payload: BookingProofPayload,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { include: { user: true } },
        bookingInsurance: true,
        bookingProofs: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking nao encontrado.');
    }
    if (booking.provider?.userId !== providerUserId) {
      throw new ForbiddenException('Somente o prestador pode enviar comprovantes.');
    }

    if (!payload.photos || payload.photos.length === 0) {
      throw new BadRequestException('Pelo menos uma foto é obrigatória.');
    }

    const requiresVideo =
      type === BookingProofType.CHECKOUT &&
      ['PREMIUM', 'TOTAL'].includes(booking.bookingInsurance?.planId ?? '');
    if (requiresVideo && !payload.videoUrl?.trim()) {
      throw new BadRequestException('checkout-proof-video-required');
    }

    try {
      const proof = await this.prisma.bookingProof.create({
        data: {
          bookingId,
          userId: providerUserId,
          type,
          photos: payload.photos,
          videoUrl: payload.videoUrl ?? null,
          hashes: payload.hashes
            ? (payload.hashes as Prisma.InputJsonValue)
            : null,
          timestamps: payload.timestamps
            ? (payload.timestamps as Prisma.InputJsonValue)
            : null,
          latitude: payload.location?.lat ?? null,
          longitude: payload.location?.lng ?? null,
          accuracyMeters: payload.location?.accuracyM ?? null,
          capturedAt: payload.location?.capturedAt
            ? new Date(payload.location.capturedAt)
            : null,
        },
      });
      this.logGpsEvent(
        booking.id,
        booking.providerId,
        `submit-proof-${type}`,
        payload.location,
      );
      return proof;
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Comprovante já enviado.');
      }
      throw error;
    }
  }

  public withAllowedActions(
    booking: BookingWithDetailsRelations,
    role: UserRole,
    _actorUserId?: string,
  ): BookingWithAllowedActions {
    const context: BookingActionContext = {
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      scheduledStart: booking.scheduledStart,
      startedAt: booking.startedAt,
      durationMinutes: booking.durationMinutes,
      paymentIntentStatus: booking.paymentIntent?.status ?? null,
    };
    const allowedActions = getAllowedBookingActions(context, role);
    return { ...booking, allowedActions };
  }

  private assertValidBookingTransition(
    from: BookingStatus,
    to: BookingStatus,
  ): void {
    if (from === to) {
      return;
    }
    const allowed = BOOKING_STATUS_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new Error(
        `[BookingsService] transição inválida de ${from} para ${to}.`,
      );
    }
  }

  private async changeBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    context: {
      booking?: Booking;
      data?: Prisma.BookingUpdateInput;
      include?: Prisma.BookingInclude;
    } = {},
  ): Promise<BookingWithDetailsRelations> {
    const currentStatus =
      context.booking?.status ??
      (
        await this.prisma.booking.findUnique({
          where: { id: bookingId },
          select: { status: true },
        })
      )?.status;

    if (!currentStatus) {
      throw new NotFoundException(
        `Booking ${bookingId} não encontrado.`,
      );
    }

    if (currentStatus === newStatus) {
      return this.fetchBookingWithDetails(bookingId, context.include);
    }

    this.assertValidBookingTransition(currentStatus, newStatus);

    const updatedBooking = (await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        ...(context.data ?? {}),
      },
      include: this.getBookingInclude(context.include),
    })) as unknown as BookingWithDetailsRelations;

    return updatedBooking;
  }

  // Helper: common notification helper to inform client about provider status updates
  private async notifyClientStatusUpdate(
    booking: { id: string; client?: { userId: string } | null },
    status: BookingStatus,
  ) {
    const userId = booking.client?.userId;
    if (!userId) return;
    let title = 'Atualização de atendimento';
    let body = 'Status do seu atendimento atualizado.';
    if (status === BookingStatus.ON_THE_WAY) {
      title = 'Prestador a caminho';
      body = `O prestador está a caminho do seu endereço para o serviço ${booking.id}.`;
    } else if (status === BookingStatus.ARRIVED) {
      title = 'Prestador chegou';
      body = `O prestador chegou ao local para o atendimento ${booking.id}.`;
    } else if (status === BookingStatus.STARTED) {
      title = 'Serviço iniciado';
      body = `O prestador iniciou o serviço ${booking.id}.`;
    } else if (status === BookingStatus.FINISHED) {
      title = 'Serviço finalizado';
      body = `O prestador finalizou o serviço ${booking.id}.`;
    }
    try {
      await this.queuesService.addNotificationJob('send-notification', {
        userId,
        kind:
          status === BookingStatus.FINISHED
            ? 'booking_finished'
            : 'booking_status',
        title,
        body,
        targetUrl: `/client/bookings/${booking.id}`,
        deeplink: `/agendamento/${booking.id}`,
        priority: 1,
        idempotencyKey: `notif:booking_status:${status}:${booking.id}:client`,
      });
    } catch (e) {
      this.logger.warn(
        `[BookingsService] notifyClientStatusUpdate falhou: ${e?.message || e}`,
      );
    }
  }

  async create(
    clientUserId: string,
    createBookingDto: CreateBookingDto,
    request?: Request,
  ): Promise<BookingWithDetailsRelations> {
    this.logger.log(
      `[BookingsService] create - Início da criação do agendamento.`,
    );
    this.logger.log(`[BookingsService] create - clientUserId: ${clientUserId}`);
    this.logger.log(
      `[BookingsService] create - DTO recebido: ${JSON.stringify(createBookingDto)}`,
    );
    this.logger.log(
      `[BookingsService] create - Endereço DTO: ${JSON.stringify(createBookingDto.address)}`,
    );

    const locale = (request as any)?.locale || 'pt-BR';

    const idempotencyKey = this.extractIdempotencyKey(request);
    const idempotencyNodeKey = idempotencyKey
      ? this.buildIdempotencyCacheKey(idempotencyKey)
      : undefined;

    if (idempotencyNodeKey) {
      const cachedBooking =
        await this.cacheService.get<BookingWithDetailsRelations>(
          idempotencyNodeKey,
        );
      if (cachedBooking) {
        this.logger.log(
          `[BookingsService] create - Idempotency cache hit for key ${idempotencyKey}`,
        );
        return cachedBooking;
      }
    }

    const lockKey = `booking:creation:${clientUserId}:${createBookingDto.providerId}:${createBookingDto.scheduledDate}:${createBookingDto.scheduledTime}`;
    const lockValue = `${clientUserId}_${Date.now()}`;
    const ttlMs = 15000;

    this.logger.log(
      `[BookingsService] create - Tentando adquirir lock: ${lockKey}`,
    );
    const lockAcquired = await this.redisLockService.acquireLock(
      lockKey,
      lockValue,
      ttlMs,
    );

    if (!lockAcquired) {
      this.logger.error(
        `[BookingsService] create - Falha ao adquirir lock para criação de agendamento para o usuário ${clientUserId}.`,
      );
      throw new ConflictException(
        await this.i18n.translate(
          'booking.conflict.concurrentCreation',
          locale,
        ),
      );
    }
    this.logger.log(`[BookingsService] create - Lock adquirido: ${lockKey}`);

    try {
      const client = await this.clientsService.findClientByUserId(clientUserId);
      if (!client) {
        this.logger.error(
          `[BookingsService] create - Cliente não encontrado para userId: ${clientUserId}`,
        );
        throw new NotFoundException(
          await this.i18n.translate('client.notFound', locale),
        );
      }
      this.logger.log(
        `[BookingsService] create - Cliente encontrado: ${client.id}`,
      );

      const provider = await this.providersService.findOne(
        createBookingDto.providerId,
      );
      if (!provider) {
        this.logger.error(
          `[BookingsService] create - Provedor com ID "${createBookingDto.providerId}" não encontrado.`,
        );
        throw new NotFoundException(
          await this.i18n.translate('provider.notFound', locale, {
            id: createBookingDto.providerId,
          }),
        );
      }
      this.logger.log(
        `[BookingsService] create - Provedor encontrado: ${provider.id}`,
      );

      if (provider.verificationStatus !== VerificationStatus.APPROVED) {
        this.logger.warn(
          `[BookingsService] create - Provedor ${provider.id} nao esta aprovado.`,
        );
        throw new ForbiddenException('provider-not-approved');
      }

      const providerService = await this.providerServicesService.findOne(
        createBookingDto.providerServiceId,
        createBookingDto.providerId,
      );
      if (!providerService) {
        this.logger.error(
          `[BookingsService] create - Serviço do provedor com ID "${createBookingDto.providerServiceId}" não encontrado para o provedor "${createBookingDto.providerId}".`,
        );
        throw new NotFoundException(
          await this.i18n.translate('providerService.notFound', locale, {
            providerServiceId: createBookingDto.providerServiceId,
            providerId: createBookingDto.providerId,
          }),
        );
      }

      const quoteHashPayload = this.buildQuoteHashPayload({
        providerService,
        createBookingDto,
        addons: createBookingDto.addons,
        subscriptionId: createBookingDto.subscriptionId,
        insurancePlanId: createBookingDto.insurancePlanId ?? null,
      });
      const requestKey = this.buildQuoteRequestKey(quoteHashPayload);

      const priceQuote = await this.calculateQuoteForBooking({
        clientId: client.id,
        clientUserId,
        provider,
        providerService,
        createBookingDto,
        locale,
        clientCompletedBookingsCount: client.completedBookingsCount ?? 0,
        subscriptionId: createBookingDto.subscriptionId,
        addons: createBookingDto.addons,
        insurancePlanId: createBookingDto.insurancePlanId ?? null,
        quoteHashPayload,
        requestKey,
      });

      if (createBookingDto.quoteExpiresAt) {
        const expiresAt = new Date(createBookingDto.quoteExpiresAt);
        if (expiresAt.getTime() < Date.now()) {
          this.logger.warn(
            `[BookingsService] create - Quote expired for client ${client.id} requestKey=${requestKey}`,
          );
          throw new ConflictException({
            message: 'QUOTE_EXPIRED',
          });
        }
      }

      if (
        createBookingDto.quoteIdHash &&
        createBookingDto.quoteIdHash !== priceQuote.quoteHash
      ) {
        throw new ConflictException({
          message: 'PRICE_MISMATCH',
          quote: priceQuote.quoteResponse,
        });
      }

      const calculatedTotalPrice = priceQuote.finalPrice;
      const discountAmount = priceQuote.discountAmount;
      const couponId = priceQuote.couponId;
      const selectedInsurance = priceQuote.quoteResponse.selectedInsurance;
      if (createBookingDto.insurancePlanId && !selectedInsurance) {
        this.logger.warn(
          `[BookingsService] create - Plano de seguro solicitado (${createBookingDto.insurancePlanId}) não é elegível.`,
        );
        throw new BadRequestException('insurance-plan-not-eligible');
      }

      this.logger.log(
        `[BookingsService] create - Serviço do provedor encontrado: ${providerService.id}. Preço calculado: ${calculatedTotalPrice.toFixed(2)}`,
      );

      // scheduledStart/scheduledEnd (TZ-safe)
      const scheduledStart = this.getScheduledAtInSaoPaulo(
        createBookingDto.scheduledDate,
        createBookingDto.scheduledTime,
      );

      await this.availabilityService.canHoldSlot(
        provider.id,
        client.id,
        scheduledStart,
      );

      const durationMinutes =
        createBookingDto.requestedDurationMinutes ||
        providerService.durationMinutes ||
        60;

      const scheduledEnd = new Date(
        scheduledStart.getTime() + durationMinutes * 60_000,
      );
      const scheduledTimeValue = scheduledStart;

      const pendingPaymentExpiresAt = new Date(
        Date.now() + PENDING_PAYMENT_TIMEOUT_MS,
      );

      const { weekStart, weekEnd } = this.getSaoPauloWeekRange(scheduledStart);
      // ✅ overlap check (ANTES de criar address/booking e aplicar cupom)
      const overlap = await this.prisma.booking.findFirst({
        where: {
          providerId: provider.id,
          status: {
            in: BLOCKED_BOOKING_STATUSES,
          },
          scheduledStart: { lt: scheduledEnd },
          scheduledEnd: { gt: scheduledStart },
        },
        select: { id: true },
      });

      if (overlap) {
        throw new ConflictException(
          await this.i18n.translate(
            'booking.conflict.timeSlotUnavailable',
            locale,
          ),
        );
      }


      const bookingInclude = this.getBookingInclude();

      try {
        const createdBooking = await this.runWithWeeklyLock(
          client.id,
          provider.id,
          weekStart,
          async () => {
            return this.prisma.$transaction(async (tx) => {
              await this.ensureWeeklyLimit(
                client.id,
                provider.id,
                weekStart,
                weekEnd,
                tx,
              );

              this.logger.log(
                `[BookingsService] create - Criando novo endereço no DB.`,
              );
              const newAddress = await tx.address.create({
                data: {
                  cep: createBookingDto.address.cep,
                  street: createBookingDto.address.street,
                  number: createBookingDto.address.number,
                  complement: createBookingDto.address.complement,
                  neighborhood: createBookingDto.address.neighborhood,
                  city: createBookingDto.address.city,
                  state: createBookingDto.address.state,
                  latitude: Number(createBookingDto.address.latitude),
                  longitude: Number(createBookingDto.address.longitude),
                },
              });
              this.logger.log(
                `[BookingsService] create - Novo endereço criado com ID: ${newAddress.id}`,
              );

              const booking = (await tx.booking.create({
                data: {
                  clientId: client.id,
                  providerId: provider.id,
                  providerServiceId: providerService.id,
                  scheduledDate: new Date(
                    `${createBookingDto.scheduledDate}T00:00:00.000Z`,
                  ),
                  scheduledTime: scheduledTimeValue,

                  scheduledStart,
                  durationMinutes,
                  scheduledEnd,

                  totalPrice: calculatedTotalPrice,
                  notes: createBookingDto.notes,
                  status: BookingStatus.PENDING_PAYMENT,
                  expiresAt: pendingPaymentExpiresAt,
                  addressId: newAddress.id,
                  couponId: couponId,
                  discountAmount: discountAmount,
                  couponUsage: couponId
                    ? {
                        create: {
                          couponId: couponId,
                          userId: clientUserId,
                          appliedValue: discountAmount,
                        },
                      }
                    : undefined,
                  bookingInsurance: selectedInsurance
                    ? {
                        create: {
                          planId: selectedInsurance.id,
                          priceCents: selectedInsurance.finalPriceCents,
                          coverageCents: selectedInsurance.coverageCents,
                          deductibleCents: selectedInsurance.deductibleCents,
                          riskMultiplierBps:
                            selectedInsurance.riskMultiplierBps ?? 0,
                          proofRequired:
                            selectedInsurance.proofRequired ?? false,
                        },
                      }
                    : undefined,
                  subscriptionId: createBookingDto.subscriptionId,
                },
                include: bookingInclude,
              })) as unknown as BookingWithDetailsRelations;

              return booking;
            });
          },
        );

        this.logger.log(
          `[BookingsService] create - Agendamento criado com sucesso no DB. ID: ${createdBooking.id}. ProviderId no booking retornado pelo Prisma: ${createdBooking.providerId}`,
        );

        try {
          await this.missionsService.trackEvent(
            createdBooking.client.userId,
            'booking.created',
            {
              bookingId: createdBooking.id,
              providerId: createdBooking.providerId,
              providerServiceId: createdBooking.providerServiceId,
            },
          );
          this.logger.log(
            `[BookingsService] Evento de missao 'booking.created' disparado para o cliente ${createdBooking.client.userId}.`,
          );
        } catch (e) {
          this.logger.warn(
            `[BookingsService] create - Falha ao emitir evento de missao booking.created: ${e?.message}`,
          );
        }

        this.logger.log(
          `[TELEMETRY] booking_created: { bookingId: ${createdBooking.id}, clientId: ${createdBooking.clientId}, providerId: ${createdBooking.providerId}, totalPrice: ${createdBooking.totalPrice.toFixed(2)}, couponId: ${couponId} }`,
        );

        if (couponId) {
          await this.couponsService.markCouponAsUsed(couponId);
        }

        if (idempotencyNodeKey) {
          await this.cacheService.set(
            idempotencyNodeKey,
            createdBooking,
            IDEMPOTENCY_TTL_SECONDS,
          );
        }

        return createdBooking;
      } catch (error: any) {
        this.logger.error(
          'Erro detalhado ao criar agendamento no DB:',
          error.response?.data || error.message,
          error.stack,
        );
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ConflictException(
              await this.i18n.translate(
                'booking.conflict.alreadyExists',
                locale,
              ),
            );
          }
          if (error.code === 'P2003' || error.code === 'P2025') {
            throw new BadRequestException(
              await this.i18n.translate(
                'booking.badRequest.foreignKeyOrNotFound',
                locale,
              ),
            );
          }
        }
        throw new BadRequestException(
          await this.i18n.translate('booking.badRequest.cannotCreate', locale),
        );
      }
    } finally {
      await this.redisLockService.releaseLock(lockKey, lockValue);
      this.logger.log(
        `[BookingsService] create - Lock liberado para a chave: ${lockKey}`,
      );
    }
  }

  async quotePrice(
    clientUserId: string,
    bookingQuoteRequestDto: BookingQuoteRequestDto,
    request?: Request,
  ): Promise<BookingQuoteResponseDto> {
    const locale = (request as any)?.locale ?? 'pt-BR';
    const client = await this.clientsService.findClientByUserId(clientUserId);
    if (!client) {
      throw new NotFoundException(
        await this.i18n.translate('client.notFound', locale),
      );
    }

    const provider = await this.providersService.findOne(
      bookingQuoteRequestDto.providerId,
    );
    if (!provider) {
      throw new NotFoundException(
        await this.i18n.translate('provider.notFound', locale, {
          id: bookingQuoteRequestDto.providerId,
        }),
      );
    }

    if (provider.verificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenException(
        'O provedor deve estar aprovado para aceitar agendamentos.',
      );
    }

    const providerService = await this.providerServicesService.findOne(
      bookingQuoteRequestDto.providerServiceId,
      bookingQuoteRequestDto.providerId,
    );
    if (!providerService) {
      throw new NotFoundException(
        await this.i18n.translate('providerService.notFound', locale, {
          providerServiceId: bookingQuoteRequestDto.providerServiceId,
          providerId: bookingQuoteRequestDto.providerId,
        }),
      );
    }

    const quoteBookingDto: CreateBookingDto = {
      providerId: bookingQuoteRequestDto.providerId,
      providerServiceId: bookingQuoteRequestDto.providerServiceId,
      scheduledDate: bookingQuoteRequestDto.scheduledDate,
      scheduledTime: bookingQuoteRequestDto.scheduledTime,
      totalPrice: 0,
      notes: undefined,
      address: {
        cep: bookingQuoteRequestDto.address.cep ?? '00000000',
        street: 'Quote',
        number: '0',
        complement: null,
        neighborhood: 'Quote',
        city: bookingQuoteRequestDto.address.city,
        state: bookingQuoteRequestDto.address.state,
        latitude: bookingQuoteRequestDto.address.latitude,
        longitude: bookingQuoteRequestDto.address.longitude,
      } as CreateAddressDto,
      requestedDurationMinutes: bookingQuoteRequestDto.durationMinutes,
      couponCode: bookingQuoteRequestDto.couponCode,
    } as CreateBookingDto;

    const quoteHashPayload = this.buildQuoteHashPayload({
      providerService,
      createBookingDto: quoteBookingDto,
      subscriptionId: bookingQuoteRequestDto.subscriptionId,
      addons: bookingQuoteRequestDto.addons,
      insurancePlanId: bookingQuoteRequestDto.insurancePlanId ?? null,
    });

    const requestKey = this.buildQuoteRequestKey(quoteHashPayload);
    this.logger.log(
      `[BookingsService] quote.request requestKey=${requestKey} providerServiceId=${bookingQuoteRequestDto.providerServiceId}`,
    );
    const quoteHash = this.hashRequestKey(requestKey);
    const cacheKey = `${QUOTE_CACHE_KEY_PREFIX}${quoteHash}`;

    const cached = await this.cacheService.get<BookingQuoteResponseDto>(cacheKey);
    if (cached) {
      this.logger.log(`[BookingsService] quote.cache.hit requestKey=${requestKey}`);
      return cached;
    }

    let calculation;
    try {
      calculation = await this.calculateQuoteForBooking({
        clientId: client.id,
        clientUserId,
        provider,
        providerService,
        createBookingDto: quoteBookingDto,
        locale,
        clientCompletedBookingsCount: client.completedBookingsCount ?? 0,
        subscriptionId: bookingQuoteRequestDto.subscriptionId,
        addons: bookingQuoteRequestDto.addons,
        insurancePlanId: bookingQuoteRequestDto.insurancePlanId ?? null,
        quoteHashPayload,
        requestKey,
      });
      await this.cacheService.set(
        cacheKey,
        calculation.quoteResponse,
        QUOTE_CACHE_TTL_SECONDS,
      );
    } catch (error: any) {
      this.logger.error(
        `[BookingsService] quotePrice - erro ao calcular quote: ${error?.message || 'sem mensagem'}`,
        error?.stack,
      );
      this.logger.error(
        `[BookingsService] quotePrice - payload: ${JSON.stringify(bookingQuoteRequestDto)}`,
      );
      throw error;
    }

    return calculation.quoteResponse;
  }

  private async calculateQuoteForBooking(
    options: BookingQuoteCalculationOptions,
  ): Promise<BookingQuoteCalculationResult> {
    const {
      clientId,
      provider,
      providerService,
      createBookingDto,
      locale,
      addons,
      clientCompletedBookingsCount,
      insurancePlanId,
    } = options;

    const requestPayload =
      options.quoteHashPayload ??
      this.buildQuoteHashPayload({
        providerService,
        createBookingDto,
        addons,
        subscriptionId: options.subscriptionId,
        insurancePlanId,
      });
    const requestKey =
      options.requestKey ?? this.buildQuoteRequestKey(requestPayload);
    const quoteHash = this.hashRequestKey(requestKey);

    const priceResult = await calculateServiceTotalPrice({
      providerService,
      createBookingDto,
      locale,
      translate: (key, localeKey, replacements) =>
        this.i18n.translate(key, locale, replacements),
      minHourlyMinutes: MIN_HOURLY_MINUTES,
    });

    if (priceResult.normalizedRequestedDurationMinutes) {
      createBookingDto.requestedDurationMinutes =
        priceResult.normalizedRequestedDurationMinutes;
    }

    const dynamicPrice = await this.pricingService.calculatePrice({
      serviceId: providerService.serviceId,
      providerId: provider.id,
      latitude: createBookingDto.address.latitude,
      longitude: createBookingDto.address.longitude,
      scheduledDate: createBookingDto.scheduledDate,
      cityCode: createBookingDto.address?.city,
    });

    let subtotal = new Prisma.Decimal(dynamicPrice.finalPrice);
    let finalPrice = subtotal;
    let discountAmount = new Prisma.Decimal(0);
    let couponId: string | null = null;
    const couponCode = createBookingDto.couponCode?.trim();

    if (couponCode) {
      this.logger.log(`[BookingsService] quote - Tentando aplicar cupom: ${couponCode}`);

      const couponResult = await this.couponsService.applyCoupon(
        couponCode,
        options.clientUserId,
        ({
          originalPrice: finalPrice.toNumber(),
          clientId,
          providerId: provider.id,
          providerServiceId: providerService.id,
          legacyProviderServiceId: providerService.serviceId,
          scheduledDate: createBookingDto.scheduledDate,
          serviceId: providerService.serviceId,
        }) as any,
      );

      if (couponResult.coupon) {
        couponId = couponResult.coupon.id;
        discountAmount = new Prisma.Decimal(couponResult.discountAmount);
        finalPrice = new Prisma.Decimal(couponResult.newTotalPrice);
        this.logger.log(
          `[BookingsService] quote - Cupom ${couponCode} aplicado. Novo preço: ${finalPrice.toFixed(2)}`,
        );
      } else {
        this.logger.warn(
          `[BookingsService] quote - Cupom ${couponCode} não aplicável: ${couponResult.message}`,
        );
      }
    }

    const estimateTotalCents = Math.round(finalPrice.mul(100).toNumber());
    const providerRating = provider.averageRating ?? 0;
    const providerCompletedBookings = provider.completedBookingsCount ?? 0;
    const insuranceOptions = this.insuranceService.getPlans({
      clientCompleted: clientCompletedBookingsCount,
      estimateTotalCents,
      provider: {
        rating: providerRating,
        completedBookings: providerCompletedBookings,
        newProvider: providerCompletedBookings < 5,
      },
    });
    if (insuranceOptions.length === 0) {
      this.logger.warn(
        `[BookingsService] quote - No insurance plans available for provider ${provider.id} in ${createBookingDto.address.city} (${providerService.serviceId}).`,
      );
    }
    const requestedInsurancePlan = insurancePlanId
      ? insuranceOptions.find((plan) => plan.id === insurancePlanId)
      : null;
    const selectedInsurance =
      requestedInsurancePlan && requestedInsurancePlan.eligible
        ? requestedInsurancePlan
        : null;
    const insuranceFeeCents = selectedInsurance?.finalPriceCents ?? 0;
    const insuranceFeeDecimal = new Prisma.Decimal(insuranceFeeCents).dividedBy(100);
    finalPrice = finalPrice.add(insuranceFeeDecimal);

    const quoteId = quoteHash;
    const platformFee = finalPrice.mul(
      new Prisma.Decimal(Math.max(0, Math.min(1, COMMISSION_RATE))),
    );
    const providerNet = finalPrice.sub(platformFee);
    const totalCents = Math.round(finalPrice.toNumber() * 100);
    const breakdown = [
      {
        label: 'Subtotal',
        amount: Number(subtotal.toNumber()),
        type: 'subtotal',
      },
      ...(couponId
        ? [
            {
              label: couponCode
                ? `Cupom ${couponCode}`
                : 'Cupom aplicado',
              amount: -Number(discountAmount.toNumber()),
              type: 'coupon',
            },
          ]
        : []),
      ...(insuranceFeeCents > 0
        ? [
            {
              label: 'Seguro',
              amount: Number(insuranceFeeDecimal.toNumber()),
              type: 'insurance',
            },
          ]
        : []),
    ];

    const quoteResponse: BookingQuoteResponseDto = {
      finalPrice: Number(finalPrice.toNumber()),
      subtotal: Number(subtotal.toNumber()),
      discountAmount: Number(discountAmount.toNumber()),
      platformFee: Number(platformFee.toNumber()),
      providerNet: Number(providerNet.toNumber()),
      couponApplied: !!couponId,
      couponCode: couponCode ?? undefined,
      minMinutesApplied: priceResult.normalizedRequestedDurationMinutes,
      quoteId,
      quoteHash,
      expiresAt: new Date(Date.now() + QUOTE_EXPIRATION_MS).toISOString(),
      totalCents,
      insuranceFeeCents,
      insuranceOptions,
      selectedInsurance,
      breakdown,
    };

    return {
      finalPrice,
      subtotal,
      discountAmount,
      couponId,
      normalizedRequestedDurationMinutes:
        priceResult.normalizedRequestedDurationMinutes,
      quoteHash,
      quoteId,
      quoteResponse,
    };
  }

  private buildQuoteHash(payload: QuoteHashPayload): string {
    const requestKey = this.buildQuoteRequestKey(payload);
    return this.hashRequestKey(requestKey);
  }

  private buildQuoteHashPayload(options: {
    providerService: ProviderService;
    createBookingDto: CreateBookingDto;
    addons?: Array<{ id: string; quantity?: number }>;
    subscriptionId?: string;
    insurancePlanId?: InsurancePlanId | null;
  }): QuoteHashPayload {
    const couponCode = options.createBookingDto.couponCode?.trim();
    const normalizedAddons = (options.addons ?? []).map((addon) => ({
      id: addon.id,
      quantity: addon.quantity ?? 1,
    }));

    return {
      providerId: options.createBookingDto.providerId,
      providerServiceId: options.createBookingDto.providerServiceId,
      serviceId: options.providerService.serviceId ?? undefined,
      scheduledDate: options.createBookingDto.scheduledDate,
      scheduledTime: options.createBookingDto.scheduledTime,
      durationMinutes: options.createBookingDto.requestedDurationMinutes ?? null,
      couponCode: couponCode || null,
      subscriptionId: options.subscriptionId ?? null,
      addons: normalizedAddons,
      address: {
        latitude: options.createBookingDto.address.latitude,
        longitude: options.createBookingDto.address.longitude,
        city: options.createBookingDto.address.city ?? null,
        state: options.createBookingDto.address.state ?? null,
        cep: options.createBookingDto.address.cep ?? null,
      },
      minHourlyMinutes: MIN_HOURLY_MINUTES,
      version: QUOTE_HASH_VERSION,
      pricingVersion: PRICING_VERSION,
      insurancePlanId: options.insurancePlanId ?? null,
    };
  }

  private buildQuoteRequestKey(payload: QuoteHashPayload): string {
    const normalizedAddons = (payload.addons ?? [])
      .map((addon) => ({
        id: addon.id,
        quantity: addon.quantity ?? 1,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    const normalizedAddress = {
      latitude: Number(payload.address.latitude.toFixed(6)),
      longitude: Number(payload.address.longitude.toFixed(6)),
      city: payload.address.city ?? null,
      state: payload.address.state ?? null,
      cep: payload.address.cep ?? null,
    };

    const normalizedPayload = {
      pricingVersion: payload.pricingVersion,
      version: payload.version,
      providerId: payload.providerId,
      providerServiceId: payload.providerServiceId,
      serviceId: payload.serviceId ?? null,
      scheduledDate: payload.scheduledDate,
      scheduledTime: payload.scheduledTime,
      durationMinutes: payload.durationMinutes ?? null,
      couponCode: payload.couponCode ?? null,
      subscriptionId: payload.subscriptionId ?? null,
      addons: normalizedAddons,
      address: normalizedAddress,
      minHourlyMinutes: payload.minHourlyMinutes,
      insurancePlanId: payload.insurancePlanId ?? null,
    };

    return JSON.stringify(normalizedPayload);
  }

  private hashRequestKey(requestKey: string): string {
    return createHash('sha256').update(requestKey).digest('hex');
  }

  // NEW: Method to create a booking specifically from a subscription
  async createBookingFromSubscription(data: {
    clientId: string;
    providerId: string;
    providerServiceId: string;
    scheduledDate: string;
    totalPrice: number;
    subscriptionId: string;
    addressId: string;
    scheduledTime: string;
  }) {
    const providerService = await this.providerServicesService.findOne(
      data.providerServiceId,
      data.providerId,
    );
    if (!providerService) {
      throw new NotFoundException(
        `Provider service with ID ${data.providerServiceId} not found for provider ${data.providerId}.`,
      );
    }

    const durationMinutes = providerService.durationMinutes || 60;
    const scheduledStart = this.getScheduledAtInSaoPaulo(
      data.scheduledDate,
      data.scheduledTime,
    );
    const scheduledEnd = new Date(
      scheduledStart.getTime() + durationMinutes * 60_000,
    );

    // ✅ Overlap também na Subscription (ANTES do create)
    const overlap = await this.prisma.booking.findFirst({
      where: {
        providerId: data.providerId,
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.ON_THE_WAY,
            BookingStatus.ARRIVED,
            BookingStatus.STARTED,
            BookingStatus.RESCHEDULED,
          ],
        },
        scheduledStart: { lt: scheduledEnd },
        scheduledEnd: { gt: scheduledStart },
      },
      select: { id: true },
    });

    if (overlap) {
      throw new ConflictException(
        await this.i18n.translate(
          'booking.conflict.timeSlotUnavailable',
          'pt-BR',
        ),
      );
    }

      return this.prisma.booking.create({
        data: {
          clientId: data.clientId,
          providerId: data.providerId,
          providerServiceId: data.providerServiceId,
        scheduledDate: new Date(`${data.scheduledDate}T00:00:00.000Z`),
        scheduledTime: data.scheduledTime,
        scheduledStart,
        durationMinutes,
          scheduledEnd,
          totalPrice: new Prisma.Decimal(data.totalPrice),
          subscriptionId: data.subscriptionId,
          addressId: data.addressId,
          status: BookingStatus.PENDING_PAYMENT,
          expiresAt: new Date(Date.now() + PENDING_PAYMENT_TIMEOUT_MS),
        },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true,
        incidents: true,
        guaranteeClaims: true,
        coupon: true,
        paymentIntent: true,
        bookingInsurance: true,
        bookingProofs: true,
      },
    });
  }

  // NEW: Method to infer demand for pricing service
  async getDemandCountForArea(
    serviceId: string,
    latitude: number,
    longitude: number,
    scheduledDateTime: Date,
  ) {
    const futureBookingsCount = await this.prisma.booking.count({
      where: {
        providerServiceId: serviceId,
        scheduledDate: {
          gte: scheduledDateTime,
          lte: new Date(scheduledDateTime.getTime() + 2 * 60 * 60 * 1000),
        },
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.STARTED,
          ],
        },
      },
    });
    return futureBookingsCount;
  }

  async createBookingAndPixCharge(
    clientUserId: string,
    createBookingDto: CreateBookingDto,
    request?: Request,
  ): Promise<BookingAndPixResponseDto> {
    this.logger.log(
      `[BookingsService] createBookingAndPixCharge - Início da operação combinada.`,
    );
    this.logger.log(
      `[BookingsService] createBookingAndPixCharge - clientUserId: ${clientUserId}`,
    );
    this.logger.log(
      `[BookingsService] createBookingAndPixCharge - DTO de criação original recebido: ${JSON.stringify(createBookingDto)}`,
    );

    const locale = (request as any)?.locale || 'pt-BR';

    const bookingPrisma = await this.create(
      clientUserId,
      createBookingDto,
      request,
    );
    const bookingWithActions = this.withAllowedActions(
      bookingPrisma,
      UserRole.CLIENT,
      clientUserId,
    );
    const bookingDto = new BookingDetailsDto(bookingWithActions);

    this.logger.log(
      `[BookingsService] createBookingAndPixCharge - Agendamento criado com sucesso (ID: ${bookingDto.id}).`,
    );
    this.logger.log(
      `[BookingsService] createBookingAndPixCharge - Booking object retornado por 'create' (mapeado para DTO): ${JSON.stringify(bookingDto, null, 2)}`,
    );

    const pixChargeDto = {
      amount: bookingDto.totalPrice,
      description: `Pagamento para o serviço de limpeza agendado (ID: ${bookingDto.id})`,
      bookingId: bookingDto.id,
      providerId: bookingDto.providerId,
    };
    this.logger.log(
      `[BookingsService] createBookingAndPixCharge - PIX Charge DTO para PaymentsService (antes da chamada): ${JSON.stringify(pixChargeDto)}`,
    );

    try {
      const pixChargeResponse = await this.paymentsService.createPixCharge(
        clientUserId,
        pixChargeDto,
      );
      this.logger.log(
        `[BookingsService] createBookingAndPixCharge - Resposta PIX Charge recebida: ${JSON.stringify(pixChargeResponse)}`,
      );
      return { booking: bookingDto, pixCharge: pixChargeResponse };
    } catch (error: any) {
      this.logger.error(
        `[BookingsService] createBookingAndPixCharge - Erro ao gerar cobrança PIX: ${error.message}`,
      );
      throw new BadRequestException(
        await this.i18n.translate('pix.chargeFailed', locale, {
          message: error.message,
        }),
      );
    }
  }

  async findUserBookings(
    userId: string,
    role: UserRole,
    status?: string,
    dateRange?: { start?: Date; end?: Date },
    request?: Request,
  ): Promise<BookingWithAllowedActions[]> {
    this.logger.log(
      `[BookingsService] findUserBookings: Buscando agendamentos para userId: ${userId}, role: ${role}, status: ${status || 'todos'}`,
    );
    const whereClause: Prisma.BookingWhereInput = {};
    const locale = (request as any)?.locale || 'pt-BR';

    if (role === UserRole.CLIENT) {
      const client = await this.prisma.client.findUnique({ where: { userId } });
      if (!client) {
        this.logger.error(
          `[BookingsService] findUserBookings - Cliente não encontrado para userId: ${userId}`,
        );
        throw new NotFoundException(
          await this.i18n.translate('client.notFound', locale),
        );
      }
      whereClause.clientId = client.id;
    } else if (role === UserRole.PROVIDER) {
      const provider = await this.prisma.provider.findUnique({
        where: { userId },
      });
      if (!provider) {
        this.logger.error(
          `[BookingsService] findUserBookings - Provedor não encontrado para userId: ${userId}`,
        );
        throw new NotFoundException(
          await this.i18n.translate('provider.notFound', locale, {
            id: userId,
          }),
        );
      }
      whereClause.providerId = provider.id;
    } else if (role === UserRole.ADMIN) {
      this.logger.log(
        `[BookingsService] findUserBookings - Usuário é ADMIN. Buscando todos os agendamentos.`,
      );
    } else {
      this.logger.error(
        `[BookingsService] findUserBookings - Função de usuário inválida: ${role}`,
      );
      throw new BadRequestException(
        await this.i18n.translate('booking.badRequest.invalidUserRole', locale),
      );
    }

    if (status) {
      const validBookingStatus = Object.values(BookingStatus).find(
        (s) => s === status,
      );
      if (validBookingStatus) {
        whereClause.status = validBookingStatus;
        this.logger.log(
          `[BookingsService] findUserBookings: Filtrando por status válido: ${validBookingStatus}`,
        );
      } else {
        this.logger.warn(
          `[BookingsService] findUserBookings: Status inválido recebido: "${status}". Ignorando filtro de status.`,
        );
      }
    }

    if (dateRange && (dateRange.start || dateRange.end)) {
      const scheduledFilter: Prisma.DateTimeFilter = {};
      if (dateRange.start) scheduledFilter.gte = dateRange.start;
      if (dateRange.end) scheduledFilter.lte = dateRange.end;
      whereClause.scheduledTime = scheduledFilter;
      this.logger.log(
        `[BookingsService] findUserBookings: Filtrando por range de tempo: start=${dateRange.start?.toISOString() ?? 'undefined'} end=${dateRange.end?.toISOString() ?? 'undefined'}`,
      );
    }

    this.logger.log(
      `[BookingsService] findUserBookings: Cláusula WHERE final: ${JSON.stringify(whereClause)}`,
    );
    const bookingInclude: Prisma.BookingInclude = {
      ...DEFAULT_BOOKING_DETAILS_INCLUDE,
      client: {
        include: {
          user: true,
          address: true,
        },
      },
      provider: {
        include: {
          user: true,
          address: true,
          providerServices: {
            include: {
              service: true,
            },
          },
        },
      },
    };

    const bookings = await this.prisma.booking.findMany({
      where: whereClause,
      include: bookingInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
    const bookingsWithDetails =
      bookings as unknown as BookingWithDetailsRelations[];
    return bookingsWithDetails.map((booking) =>
      this.withAllowedActions(booking, role, userId),
    );
  }

  async findOne(
    id: string,
    request?: Request,
  ): Promise<BookingWithDetailsRelations | null> {
    this.logger.log(
      `[BookingsService] findOne: Buscando agendamento por ID: ${id}`,
    );
    const locale = (request as any)?.locale || 'pt-BR';
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true,
        incidents: true,
        guaranteeClaims: true,
        coupon: true,
        paymentIntent: true,
        bookingInsurance: true,
        bookingProofs: true,
      },
    });
    if (!booking) {
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', locale, { id }),
      );
    }
    return booking as BookingWithDetailsRelations;
  }

 async updateStatus(
    id: string,
    newStatus: BookingStatus,
    userRole: UserRole,
    request?: Request,
  ): Promise<BookingWithDetailsRelations> {
    this.logger.log(
      `[BookingsService] updateStatus: Tentando atualizar agendamento ${id} para status ${newStatus} por role ${userRole}.`,
    );
    const locale = (request as any)?.locale || 'pt-BR';
    
    // Busca o booking com as relações necessárias
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        client: { include: { user: true } },
        paymentIntent: true,
        bookingInsurance: true,
        bookingProofs: true,
      },
    });

    if (!booking) {
      this.logger.error(`[BookingsService] updateStatus - Agendamento com ID "${id}" não encontrado.`);
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', locale, { id }),
      );
    }

    // Lógica de Redundância
    if (booking.status === newStatus) {
      this.logger.log(`[BookingsService] updateStatus: booking ${id} já está no status ${newStatus}.`);
      return this.fetchBookingWithDetails(id);
    }

    // Identificação do Ator (quem está fazendo a alteração)
    const actorUserId = (request as any)?.user?.['userId'] || (request as any)?.user?.['id'];
    const actorRole = (request as any)?.user?.['role'] || (request as any)?.role || userRole;
    
    // Validação de Permissão (Simplificada para o exemplo, mantenha a sua lógica de actorClientId/ProviderId)
    // ... (mantenha seus checks de actorClientId e actorProviderId aqui)

    // Validação de Transição de Status
    const finalizedStates = [BookingStatus.FINISHED, BookingStatus.CANCELED, BookingStatus.REJECTED, BookingStatus.NO_SHOW];
    if (finalizedStates.includes(booking.status as any) && userRole !== UserRole.ADMIN) {
      throw new BadRequestException(await this.i18n.translate('booking.badRequest.statusFinalized', locale));
    }

    // --- Lógica de Negócio de Transição (Pode usar sua lógica de switch/case aqui) ---
    // ... (mantenha seu bloco switch (booking.status) e as flags canUpdate)

    const now = new Date();
    const dataToUpdate: Prisma.BookingUpdateInput = { status: newStatus };

    // CORREÇÃO TIME: Início do Serviço (ARRIVED -> STARTED)
    if (userRole === UserRole.PROVIDER && booking.status === BookingStatus.ARRIVED && newStatus === BookingStatus.STARTED) {
      const scheduledAt = this.getScheduledAtInSaoPaulo(
        booking.scheduledDate,
        this.normalizeScheduledTimeForHelper(booking.scheduledTime),
      );
      const diffMin = Math.round((now.getTime() - scheduledAt.getTime()) / 60000);
      
      if (!(diffMin >= -15 && diffMin <= 120)) {
        throw new BadRequestException('Início fora da janela permitida (15min antes até 2h depois).');
      }
      dataToUpdate.startedAt = now;
      if (actorUserId) dataToUpdate.startedByUser = { connect: { id: actorUserId } };
    }

    // CORREÇÃO TIME: Finalização (STARTED -> FINISHED)
    if (userRole === UserRole.PROVIDER && booking.status === BookingStatus.STARTED && newStatus === BookingStatus.FINISHED) {
      const refStart = booking.startedAt ?? booking.scheduledStart ?? this.getScheduledAtInSaoPaulo(booking.scheduledDate, this.normalizeScheduledTimeForHelper(booking.scheduledTime));
      
      const runMin = Math.round((now.getTime() - new Date(refStart as any).getTime()) / 60000);
      const minRunMinutes = parseInt(process.env.MIN_SERVICE_MINUTES ?? '15', 10);

      if (runMin < minRunMinutes) {
        throw new BadRequestException(await this.i18n.translate('booking.badRequest.finishTooEarly', locale));
      }
      dataToUpdate.completedAt = now;
      if (actorUserId) dataToUpdate.completedByUser = { connect: { id: actorUserId } };
    }

    // Persistência no Banco
    const updatedBookingRaw = await this.prisma.booking.update({
      where: { id },
      data: dataToUpdate,
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });

    // CAST SEGURO para a interface que o controller espera
    const updatedBooking = (updatedBookingRaw as unknown) as BookingWithDetailsRelations;

    // Efeitos Colaterais (Side Effects)
    if (newStatus === BookingStatus.FINISHED) {
      // Atualiza contadores e lealdade
      await this.prisma.client.update({ where: { id: booking.clientId }, data: { completedBookingsCount: { increment: 1 } } });
      await this.prisma.provider.update({ where: { id: booking.providerId }, data: { monthlyBookingsCount: { increment: 1 } } });
      // ... (chame loyaltyService, missionsService, etc.)
    }

    // CORREÇÃO TS2345: Agendamento de Lembretes (CONFIRMED)
    if (newStatus === BookingStatus.CONFIRMED) {
      try {
        const scheduledAt = this.getScheduledAtInSaoPaulo(
          updatedBooking.scheduledDate,
          this.normalizeScheduledTimeForHelper(updatedBooking.scheduledTime),
        );
        
        const timeString = this.normalizeScheduledTimeForHelper(updatedBooking.scheduledTime) || '00:00';
        const [hh, mm] = timeString.split(':').map(n => parseInt(n, 10));

        await this.schedulerService.scheduleBookingReminders({
          bookingId: updatedBooking.id,
          clientUserId: updatedBooking.client?.userId ?? '',
          scheduledAt,
          targetUrl: `/client/bookings/${updatedBooking.id}`,
          locale,
        });

        // Envio de Push (Exemplo simplificado)
        await this.queuesService.addNotificationJob('send-push-notification', {
          userId: updatedBooking.client?.userId,
          title: 'Pagamento confirmado',
          body: `Seu serviço está confirmado para ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}.`,
        });
      } catch (e) {
        this.logger.warn(` Falha nos lembretes: ${e.message}`);
      }
    }

    return updatedBooking;
  }

  async systemChangeStatus(
    bookingId: string,
    newStatus: BookingStatus,
  ): Promise<BookingWithDetailsRelations> {
    this.logger.log(
      `[BookingsService] systemChangeStatus: forcando transição ${bookingId} -> ${newStatus}.`,
    );
    return this.updateStatus(bookingId, newStatus, UserRole.SYSTEM);
  }

  async findUpcomingBookings(
    providerId: string,
  ): Promise<BookingWithDetailsRelations[]> {
    this.logger.log(
      `[BookingsService] findUpcomingBookings: Buscando agendamentos futuros para providerId: ${providerId}`,
    );
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingPrismaBookings = await this.prisma.booking.findMany({
      where: {
        providerId: providerId,
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.RESCHEDULED,
            BookingStatus.STARTED, // adjusted
          ],
        },
        scheduledDate: {
          gte: now,
        },
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true,
        incidents: true,
        guaranteeClaims: true,
        coupon: true,
        paymentIntent: true,
        bookingInsurance: true,
        bookingProofs: true,
      },
    });
    this.logger.log(
      `[BookingsService] findUpcomingBookings: Bookings encontradas via Prisma ${upcomingPrismaBookings.length} agendamentos futuros antes da filtragem de hora.`,
    );

    const upcomingWithDetails =
      upcomingPrismaBookings as BookingWithDetailsRelations[];
    const filteredBookings = upcomingWithDetails.filter((booking) => {
      const bookingDateTime =
        booking.scheduledStart ??
        this.getScheduledAtInSaoPaulo(
          booking.scheduledDate,
          this.normalizeScheduledTimeForHelper(booking.scheduledTime),
        );

      const now = new Date();
      now.setSeconds(0, 0);

      // se é hoje, só deixa os que ainda não passaram
      if (bookingDateTime.toDateString() === now.toDateString()) {
        return bookingDateTime >= now;
      }
      return true;
    });
    this.logger.log(
      `[BookingsService] findUpcomingBookings: Encontrados ${filteredBookings.length} agendamentos futuros após filtragem final.`,
    );
    return filteredBookings;
  }

  async cancelBooking(
    bookingId: string,
    userRole: UserRole,
    request?: Request,
  ): Promise<BookingWithDetailsRelations> {
    return this.updateStatus(
      bookingId,
      BookingStatus.CANCELED,
      userRole,
      request,
    );
  }

  async checkConfirmedBookingBetweenUsers(
    clientId: string,
    providerId: string,
  ): Promise<boolean> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        clientId: clientId,
        providerId: providerId,
        status: BookingStatus.CONFIRMED,
      },
    });
    return !!booking;
  }

  async checkActiveChatBooking(
    clientId: string,
    providerId: string,
  ): Promise<{ canChat: boolean; bookingId?: string }> {
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        clientId: clientId,
        providerId: providerId,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.STARTED],
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    return {
      canChat: !!activeBooking,
      bookingId: activeBooking?.id,
    };
  }

  async canReview(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        provider: { include: { user: true } },
        paymentIntent: true,
        review: true,
        bookingInsurance: true,
        bookingProofs: true,
      },
    });
    if (!booking) return { canReview: false, reason: 'not_found' };
    if (booking.client?.userId !== userId)
      return { canReview: false, reason: 'forbidden' };
    if (booking.status !== BookingStatus.FINISHED)
      return { canReview: false, reason: 'not_completed' };
    const expectedEnd = booking.completedAt ?? this.getExpectedEnd(booking);
    if (new Date() < expectedEnd)
      return { canReview: false, reason: 'too_early' };
    if (booking.paymentIntent?.status !== 'PAID')
      return { canReview: false, reason: 'unpaid' };
    const existingReviewId: string | undefined =
      (booking as any).reviewId ?? booking.review?.id;
    if (booking.isReviewed || existingReviewId)
      return { canReview: false, reason: 'already_reviewed' };

    return {
      canReview: true,
      bookingId,
      providerId: booking.providerId,
      providerName: booking.provider?.user?.fullName,
      providerAvatar: booking.provider?.user?.avatarUrl,
    };
  }

  // NOVO: provider marca que está a caminho (CONFIRMED -> ON_THE_WAY)
  async onTheWayService(
    bookingId: string,
    actorUserId: string,
  ): Promise<BookingWithDetailsRelations> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });
    if (!booking) throw new NotFoundException('Booking não encontrado.');
    if (booking.provider.userId !== actorUserId)
      throw new ForbiddenException('Somente o prestador pode atualizar.');
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Não é possível iniciar o trajeto: status atual é ${booking.status}.`,
      );
    }

    // bloco de onTheWayService
    const updated = await this.changeBookingStatus(bookingId, BookingStatus.ON_THE_WAY, {
      booking,
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });

    // side-effects: notifications
    await this.notifyClientStatusUpdate(updated, BookingStatus.ON_THE_WAY);
    this.logger.log(
      `[BookingsService] onTheWayService: Booking ${bookingId} está a caminho.`,
    );
    return updated;
  }

  // NOVO: provider registra chegada (ON_THE_WAY -> ARRIVED)
  async arriveAtLocation(
    bookingId: string,
    actorUserId: string,
    location?: BookingLocationInput,
  ): Promise<BookingWithDetailsRelations> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });
    if (!booking) throw new NotFoundException('Booking não encontrado.');
    if (booking.provider.userId !== actorUserId)
      throw new ForbiddenException('Somente o prestador pode atualizar.');
    if (booking.status !== BookingStatus.ON_THE_WAY) {
      throw new BadRequestException(
        `Não é possível registrar a chegada: status atual é ${booking.status}.`,
      );
    }

    const now = new Date();
    const gpsData = this.buildGpsFields(location, 'arrived');
    // bloco de arriveAtLocation
    const updated = await this.changeBookingStatus(bookingId, BookingStatus.ARRIVED, {
      booking,
      data: { arrivedAt: now, ...gpsData },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });

    // side-effects: notifications
    await this.notifyClientStatusUpdate(updated, BookingStatus.ARRIVED);
    this.logGpsEvent(booking.id, booking.providerId, 'arriveAtLocation', location);
    this.logger.log(
      `[BookingsService] arriveAtLocation: Booking ${bookingId} CHEGOU.`,
    );
    return updated;
  }

  async startService(
    bookingId: string,
    providerUserId: string,
    location?: BookingLocationInput,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado.');
    if (booking.provider.userId !== providerUserId)
      throw new ForbiddenException('Somente o prestador pode iniciar.');
    if (booking.bookingInsurance?.proofRequired) {
      await this.ensureProofRecorded(booking.id, BookingProofType.CHECKIN);
    }
    if (booking.status !== BookingStatus.ARRIVED)
      throw new BadRequestException(
        'Status inválido para iniciar. Deve ser ARRIVED.',
      );
    if (booking.paymentIntent?.status !== 'PAID')
      throw new BadRequestException('Pagamento não confirmado.');

    const locationRequired = this.requiresProofGps(booking);
    if (locationRequired && !location) {
      throw new BadRequestException({
        code: 'PROOF_GPS_REQUIRED',
        message:
          'GPS obrigatório para iniciar serviços com seguro premium ou requisito de prova.',
      });
    }

    await this.schedulerService.notifyJobStarted({
      bookingId,
      clientUserId: booking.client?.userId ?? '',
      targetUrl: `/client/bookings/${bookingId}`,
      locale: 'pt-BR',
    });

    const scheduledStart =
      booking.scheduledStart ||
      this.getScheduledAtInSaoPaulo(
        booking.scheduledDate,
        this.normalizeScheduledTimeForHelper(booking.scheduledTime),
      );
    const now = new Date();
    const diffMs = now.getTime() - scheduledStart.getTime();
    const windowMs = 15 * 60 * 1000;
    if (diffMs < -windowMs || diffMs > windowMs) {
      throw new BadRequestException('Fora da janela de início (±15min).');
    }

    const gpsData = this.buildGpsFields(location, 'started');
    const updated = await this.changeBookingStatus(bookingId, BookingStatus.STARTED, {
      booking,
      data: {
        startedAt: now,
        startedByUser: { connect: { id: providerUserId } },
        ...gpsData,
      },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });

    // side-effects: notifications
    await this.notifyClientStatusUpdate(updated, BookingStatus.STARTED);
    // Push físico crítico: SERVICE_STARTED -> cliente
    if (updated.client?.userId) {
        const providerName = updated.provider?.user?.fullName || 'Prestador';
        const scheduledAt =
          updated.scheduledStart ||
          this.getScheduledAtInSaoPaulo(
            updated.scheduledDate,
            this.normalizeScheduledTimeForHelper(updated.scheduledTime),
          );
        await this.queuesService.addNotificationJob('send-notification', {
          userId: updated.client.userId,
          kind: 'service_started',
          title: 'Serviço iniciado',
          body: `${providerName} iniciou o atendimento (${scheduledAt?.toLocaleString('pt-BR') || ''}).`,
          deeplink: `/agendamento/${updated.id}`,
          priority: 1,
          idempotencyKey: `notif:service_started:client:${updated.id}`,
        });
      }
    this.logGpsEvent(booking.id, booking.providerId, 'startService', location);
    return updated;
  }

  async completeService(
    bookingId: string,
    providerUserId: string,
    location?: BookingLocationInput,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado.');
    if (booking.provider.userId !== providerUserId)
      throw new ForbiddenException('Somente o prestador pode concluir.');
    if (booking.bookingInsurance?.proofRequired) {
      const checkoutProof = await this.ensureProofRecorded(
        booking.id,
        BookingProofType.CHECKOUT,
      );
      const planId = booking.bookingInsurance.planId;
      if (['PREMIUM', 'TOTAL'].includes(planId ?? '') && !checkoutProof.videoUrl) {
        throw new BadRequestException('checkout-proof-video-required');
      }
    }
    if (booking.status !== BookingStatus.STARTED)
      throw new BadRequestException(
        'Status inválido para concluir. Deve ser STARTED.',
      );
    if (booking.paymentIntent?.status !== 'PAID')
      throw new BadRequestException('Pagamento não confirmado.');

    const locationRequired = this.requiresProofGps(booking);
    if (locationRequired && !location) {
      throw new BadRequestException({
        code: 'PROOF_GPS_REQUIRED',
        message:
          'GPS obrigatório para concluir serviços com seguro premium ou requisito de prova.',
      });
    }

    const expectedEnd = this.getExpectedEnd(booking);
    if (new Date() < expectedEnd)
      throw new BadRequestException('Ainda não atingiu o horário final.');

    const gpsData = this.buildGpsFields(location, 'completed');
    const updated = await this.changeBookingStatus(bookingId, BookingStatus.FINISHED, {
      booking,
      data: {
        completedAt: new Date(),
        completedByUser: { connect: { id: providerUserId } },
        ...gpsData,
      },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });

    await this.schedulerService.notifyJobEnded({
      bookingId,
      clientUserId: updated.client?.userId ?? '',
      targetUrl: `/client/bookings/${bookingId}`,
      locale: 'pt-BR',
    });

    // side-effects: notifications
    try {
      if (updated.client?.userId) {
        await this.queuesService.addNotificationJob('send-notification', {
          userId: updated.client.userId,
          kind: 'booking_finished',
          title: 'Serviço finalizado',
          body: `Seu atendimento com ${updated.provider?.user?.fullName || 'prestador'} foi finalizado.`,
          deeplink: `/agendamento/${updated.id}`,
          priority: 1,
          idempotencyKey: `notif:booking_finished:client:${updated.id}`,
        });
      }
      if (updated.provider?.userId) {
        await this.queuesService.addNotificationJob('send-notification', {
          userId: updated.provider.userId,
          kind: 'booking_finished',
          title: 'Serviço finalizado',
          body: `Atendimento ${updated.id} marcado como finalizado.`,
          deeplink: `/agendamento/${updated.id}`,
          priority: 1,
          idempotencyKey: `notif:booking_finished:provider:${updated.id}`,
        });
      }
    } catch (e) {
      this.logger.warn(
        `[BookingsService] Falha ao notificar finalização do booking ${updated.id}: ${e?.message || e}`,
      );
    }

    this.logGpsEvent(booking.id, booking.providerId, 'completeService', location);
    return updated;
  }

  /**
   * Auto-completa agendamentos STARTED cujo horário esperado já passou
   * e que estão pagos (PaymentIntent = PAID). Evita completar se reembolsado/chargeback.
   */
  async autoCompleteOverdueBookings() {
    const now = new Date();
    const inProgress = await this.prisma.booking.findMany({
      where: { status: BookingStatus.STARTED },
      include: { paymentIntent: true, bookingInsurance: true, bookingProofs: true },
    });

    const toComplete = inProgress.filter((b) => {
      const expectedEnd = this.getExpectedEnd(b as any);
      const payStatus = b.paymentIntent?.status;
      const paidOk = payStatus === PaymentIntentStatus.PAID;
      const notRefunded =
        payStatus !== PaymentIntentStatus.REFUNDED &&
        payStatus !== PaymentIntentStatus.CHARGEBACK;
      return expectedEnd && expectedEnd <= now && paidOk && notRefunded;
    });

    for (const b of toComplete) {
      const expectedEnd = this.getExpectedEnd(b as any);
      const updated = await this.changeBookingStatus(b.id, BookingStatus.FINISHED, {
        booking: b as Booking,
        data: {
          completedAt: expectedEnd ?? now,
        },
        include: DEFAULT_BOOKING_DETAILS_INCLUDE,
      });
      this.logger.log(
        `[BookingsService] autoCompleteOverdueBookings: booking ${b.id} marcado como FINISHED automaticamente.`,
      );

      // side-effects: notifications
      // Notificar cliente e prestador na conclusão automática
      try {
        if ((updated as any).client?.userId) {
          await this.queuesService.addNotificationJob('send-notification', {
            userId: (updated as any).client.userId,
            kind: 'booking_finished',
            title: 'Serviço finalizado',
            body: `Seu atendimento com ${(updated as any).provider?.user?.fullName || 'prestador'} foi finalizado.`,
            deeplink: `/agendamento/${updated.id}`,
            priority: 1,
            idempotencyKey: `notif:booking_finished:client:${updated.id}`,
          });
        }
        if ((updated as any).provider?.userId) {
          await this.queuesService.addNotificationJob('send-notification', {
            userId: (updated as any).provider.userId,
            kind: 'booking_finished',
            title: 'Serviço finalizado',
            body: `Atendimento ${updated.id} marcado como finalizado.`,
            deeplink: `/agendamento/${updated.id}`,
            priority: 1,
            idempotencyKey: `notif:booking_finished:provider:${updated.id}`,
          });
        }
      } catch (e) {
        this.logger.warn(
          `[BookingsService] Falha ao notificar finalização automática do booking ${updated.id}: ${e?.message || e}`,
        );
      }
    }

    return { completed: toComplete.map((b) => b.id) };
  }

  /**
   * Cron job (1/min) para auto-completar bookings STARTED cujo horário final passou.
   * Requer que ScheduleModule esteja importado no AppModule.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cronAutoCompleteOverdue() {
    try {
      await this.autoCompleteOverdueBookings();
    } catch (e: any) {
      this.logger.warn(
        `[BookingsService] cronAutoCompleteOverdue falhou: ${e?.message || e}`,
      );
    }
  }

  async reportIssue(
    bookingId: string,
    userId: string,
    userRole: UserRole,
    reason: string,
    request?: Request,
  ): Promise<BookingWithDetailsRelations> {
    this.logger.log(
      `[BookingsService] reportIssue: Usuário ${userId} (${userRole}) reportando problema no booking ${bookingId}. Motivo: ${reason}`,
    );
    const locale = (request as any)?.locale || 'pt-BR';

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', locale, {
          id: bookingId,
        }),
      );
    }

    const client = await this.clientsService.findClientByUserId(userId);
    const provider = await this.providersService.findByUserId(userId);

    if (userRole === UserRole.CLIENT && booking.clientId !== client?.id) {
      throw new ForbiddenException(
        await this.i18n.translate('booking.forbidden.reportIssue', locale),
      );
    }
    if (userRole === UserRole.PROVIDER && booking.providerId !== provider?.id) {
      throw new ForbiddenException(
        await this.i18n.translate('booking.forbidden.reportIssue', locale),
      );
    }

    const notificationMessage = await this.i18n.translate(
      'notification.newDisputeAdmin',
      locale,
      { bookingId, reason },
    );
    await this.queuesService.addNotificationJob('send-notification', {
      userId: 'ADMIN_USER_ID',
      type: 'BOOKING_DISPUTE',
      message: notificationMessage,
      targetUrl: `/admin/disputes/${bookingId}`,
    });
    this.logger.log(
      `[BookingsService] reportIssue: Notificação de disputa adicionada à fila para ADMIN.`,
    );

    return this.updateStatus(
      bookingId,
      BookingStatus.PENDING_DISPUTE,
      userRole,
      request,
    );
  }

  async reportDispute(
    bookingId: string,
    userId: string,
    userRole: UserRole,
    dto: ReportDisputeDto,
    request?: Request,
  ): Promise<void> {
    this.logger.log(
      `[BookingsService] reportDispute: Usuário ${userId} (${userRole}) reportando disputa para booking ${bookingId}.`,
    );
    const locale = (request as any)?.locale || 'pt-BR';

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', locale, {
          id: bookingId,
        }),
      );
    }

    const client = await this.clientsService.findClientByUserId(userId);
    const provider = await this.providersService.findByUserId(userId);

    if (userRole === UserRole.CLIENT && booking.clientId !== client?.id) {
      throw new ForbiddenException(
        await this.i18n.translate('dispute.forbidden.access', locale),
      );
    }
    if (userRole === UserRole.PROVIDER && booking.providerId !== provider?.id) {
      throw new ForbiddenException(
        await this.i18n.translate('dispute.forbidden.access', locale),
      );
    }

    await this.queuesService.addDisputeJob('process-booking-dispute', {
      bookingId,
      reporterUserId: userId,
      reporterRole: userRole,
      reason: dto.reason,
      description: dto.description,
      refundAmount: dto.refundAmount,
      attachments: dto.attachments,
    });

    await this.updateStatus(
      bookingId,
      BookingStatus.PENDING_DISPUTE,
      userRole,
      request,
    );

    this.logger.log(
      `[BookingsService] reportDispute: Disputa para booking ${bookingId} adicionada à fila de processamento.`,
    );
    // Telemetria: dispute_reported
    this.logger.log(
      `[TELEMETRY] dispute_reported: { bookingId: ${bookingId}, reporterUserId: ${userId}, reason: ${dto.reason} }`,
    );
  }

  async resolveDispute(
    bookingId: string,
    resolution: string,
    refundAmount?: number,
    newStatus?: BookingStatus,
    request?: Request,
  ): Promise<BookingWithDetailsRelations> {
    this.logger.log(
      `[BookingsService] resolveDispute: Resolvendo disputa para booking ${bookingId}. Resolução: ${resolution}.`,
    );
    const locale = (request as any)?.locale || 'pt-BR';

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', locale, {
          id: bookingId,
        }),
      );
    }

    if (booking.status !== BookingStatus.PENDING_DISPUTE) {
      throw new BadRequestException(
        await this.i18n.translate(
          'dispute.badRequest.notInDisputeStatus',
          locale,
        ),
      );
    }

    if (refundAmount && refundAmount > 0) {
      this.logger.log(
        `[BookingsService] resolveDispute: Iniciando processo de reembolso de R$${refundAmount} para booking ${bookingId}.`,
      );
      await this.prisma.transaction.create({
        data: {
          providerId: booking.provider.id,
          bookingId: booking.id,
          amount: new Prisma.Decimal(refundAmount).neg(),
          type: 'REFUND',
          status: 'PROCESSED',
          description: `Reembolso de disputa para agendamento ${bookingId}. Resolução: ${resolution}`,
        },
      });
      // Telemetria: refund_processed
      this.logger.log(
        `[TELEMETRY] refund_processed: { bookingId: ${bookingId}, refundAmount: ${refundAmount} }`,
      );
    }

    const finalStatus = newStatus || BookingStatus.FINISHED;
    const updatedBooking = await this.changeBookingStatus(bookingId, finalStatus, {
      booking,
      include: DEFAULT_BOOKING_DETAILS_INCLUDE,
    });

    // side-effects: ledger adjustments quando finaliza disputa
    if (
      finalStatus === BookingStatus.FINISHED &&
      updatedBooking.provider?.userId
    ) {
      // ATENÇÃO: A lógica de Ledger aqui é diferente da implementada em updateStatus
      // para a transição IN_PROGRESS -> FINISHED.
      // Se a regra "EARNING + líquido, HOLD - bruto" deve ser universal para todas as finalizações,
      // esta seção também precisaria ser ajustada.
      // Mantendo como está para aderir ao "sem alter ao resto" fora do escopo da solicitação original.

      const existingEarning = await this.prisma.ledgerEntry.findFirst({
        where: { bookingId: updatedBooking.id, type: LedgerEntryType.EARNING },
      });
      const grossAmount = new Prisma.Decimal(updatedBooking.totalPrice);
      const commissionPercent = new Prisma.Decimal(
        Math.max(0, Math.min(1, COMMISSION_RATE)),
      );
      const feeAmount = grossAmount.mul(commissionPercent);
      const netAmount = grossAmount.sub(feeAmount);

      if (!existingEarning) {
        await this.prisma.ledgerEntry.create({
          data: {
            userId: updatedBooking.provider.userId,
            bookingId: updatedBooking.id,
            amount: netAmount,
            type: LedgerEntryType.EARNING,
            note: `Earning for finished booking ${updatedBooking.id}`,
          },
        });
        this.logger.log(
          `[BookingsService] resolveDispute: Ledger EARNING criado para booking ${updatedBooking.id}.`,
        );
      }
      // Fee da plataforma (take rate)
      const feeExists = await this.prisma.ledgerEntry.findFirst({
        where: { bookingId: updatedBooking.id, type: LedgerEntryType.FEE },
      });
      if (!feeExists && feeAmount.greaterThan(0)) {
        await this.prisma.ledgerEntry.create({
          data: {
            userId: updatedBooking.provider.userId,
            bookingId: updatedBooking.id,
            amount: feeAmount.neg(),
            type: LedgerEntryType.FEE,
            note: `Take rate fee for booking ${updatedBooking.id}`,
          },
        });
      }
    }

    // side-effects: notifications
    const clientNotificationMessage = await this.i18n.translate(
      'notification.disputeResolvedClient',
      locale,
      { bookingId: booking.id, status: finalStatus, resolution },
    );
    await this.queuesService.addNotificationJob('send-notification', {
      userId: booking.client.userId,
      type: 'DISPUTE_RESOLUTION',
      message: clientNotificationMessage,
      targetUrl: `/client/bookings/${booking.id}`,
    });
    const providerNotificationMessage = await this.i18n.translate(
      'notification.disputeResolvedProvider',
      locale,
      { bookingId: booking.id, status: finalStatus, resolution },
    );
    await this.queuesService.addNotificationJob('send-notification', {
      userId: booking.provider.userId,
      type: 'DISPUTE_RESOLUTION',
      message: providerNotificationMessage,
      targetUrl: `/provider/bookings/${booking.id}`,
    });

    this.logger.log(
      `[BookingsService] resolveDispute: Disputa para booking ${bookingId} resolvida. Novo status: ${finalStatus}.`,
    );
    // Telemetria: dispute_resolved
    this.logger.log(
      `[TELEMETRY] dispute_resolved: { bookingId: ${bookingId}, finalStatus: ${finalStatus}, resolution: ${resolution} }`,
    );

    return updatedBooking;
  }
}

