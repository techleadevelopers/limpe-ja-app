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
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import {
  MIN_HOURLY_MINUTES,
  COMMISSION_RATE,
} from '../common/constants/pricing';
import {
  Booking,
  BookingStatus,
  PaymentIntentStatus,
  UserRole,
  Prisma,
  CouponType,
  CouponTarget,
  LedgerEntryType,
} from '@prisma/client'; // Importar CouponType e CouponTarget
import { ClientsService } from '../clients/clients.service';
import {
  ProvidersService,
  ProviderWithCalculatedRating,
} from '../providers/providers.service';
import { ProviderServicesService } from '../provider-services/provider-services.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PixChargeResponseDto } from '../payments/dto/create-pix-charge.dto';
import { BookingAndPixResponseDto } from './dto/booking-and-pix-response.dto';
import { PaymentsService } from '../payments/payments.service';
import { BookingDetailsDto } from './dto/booking-details.dto';
import { ReportDisputeDto, DisputeReason } from './dto/report-dispute.dto';
import { QueuesService } from '../queues/queues.service';
import { PricingService } from '../pricing/pricing.service';
import { CouponsService } from '../coupons/coupons.service';

// Importar LoyaltyService e LoyaltyTransactionType
import { LoyaltyService } from '../loyalty/loyalty.service';
import { LoyaltyTransactionType } from '@prisma/client'; // <<-- ADICIONADO: Importar LoyaltyTransactionType

// >>> NOVO: Missões & Indicações
import { MissionsService } from '../missions/missions.service';
import { ReferralsService } from '../referrals/referrals.service';
// <<< FIM NOVO
import { I18nService } from '../common/i18n/i18n.service';
import { Request } from 'express';

// NOVO: Importar RedisLockService
import { RedisLockService } from '../common/locks/redis-lock.service';
// NOVO: Importar BookingStateMachine (se for usar para transições de status)
// import { BookingStateMachine } from './states/booking.state-machine'; // Descomente se for implementar a máquina de estados aqui

export type BookingWithDetailsRelations = Prisma.BookingGetPayload<{
  include: {
    client: { include: { user: true } }; // Ensure client is included
    provider: { include: { user: true } }; // Ensure provider is included
    providerService: { include: { service: true } }; // Ensure providerService is included
    review: true;
    address: true;
    subscription: true;
    incidents: true;
    guaranteeClaims: true;
    coupon: true;
    paymentIntent: true;
  };
}>;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private clientsService: ClientsService,
    private providersService: ProvidersService,
    private providerServicesService: ProviderServicesService,
    private notificationsService: NotificationsService,
    private queuesService: QueuesService,
    private pricingService: PricingService,
    private couponsService: CouponsService,
    private loyaltyService: LoyaltyService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,

    // >>> NOVO: Injeções para Missões & Indicações
    @Inject(forwardRef(() => MissionsService))
    private missionsService: MissionsService,
    @Inject(forwardRef(() => ReferralsService))
    private referralsService: ReferralsService,
    // <<< FIM NOVO
    private readonly i18n: I18nService,
    private readonly redisLockService: RedisLockService, // INJETADO
    // private readonly bookingStateMachine: BookingStateMachine, // NOVO: Injetar BookingStateMachine (se for usar)
  ) {}

  private getExpectedEnd(booking: Booking): Date {
    const base =
      booking.startedAt ||
      booking.scheduledStart ||
      this.getScheduledAtInSaoPaulo(
        booking.scheduledDate,
        booking.scheduledTime,
      );
    const dur = booking.durationMinutes ?? 60;
    return new Date(base.getTime() + dur * 60 * 1000);
  }

  /**
   * Resolve a Date that represents the given ISO string in the provided timezone.
   * Mirrors the approach used in PricingService to avoid adding new deps.
   */
  private resolveDateWithTimezone(iso: string, timezone?: string): Date {
    const base = new Date(iso);
    if (!timezone) return base;
    try {
      const localeString = base.toLocaleString('en-US', {
        timeZone: timezone as any,
      });
      return new Date(localeString);
    } catch {
      return base;
    }
  }

  /**
   * Compose an ISO (without timezone) from a date-only and HH:mm, then resolve it in America/Sao_Paulo.
   */
  private getScheduledAtInSaoPaulo(
    dateValue: any,
    timeHHmm: string | null | undefined,
  ): Date {
    const d = new Date(dateValue);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const [hh, mm] = String(timeHHmm || '00:00')
      .split(':')
      .map((n) => parseInt(n, 10));
    const H = String(isFinite(hh) ? hh : 0).padStart(2, '0');
    const M = String(isFinite(mm) ? mm : 0).padStart(2, '0');
    const isoLocal = `${y}-${m}-${day}T${H}:${M}:00`;
    return this.resolveDateWithTimezone(isoLocal, 'America/Sao_Paulo');
  }

  // Helper: common notification helper to inform client about provider status updates
  private async notifyClientStatusUpdate(
    booking: BookingWithDetailsRelations | any,
    status: BookingStatus,
  ) {
    const locale = 'pt-BR';
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

    // --- NOVO: Adicionar lock para evitar race conditions na criação de agendamentos ---
    const lockKey = `booking:creation:${clientUserId}:${createBookingDto.providerId}:${createBookingDto.scheduledDate}:${createBookingDto.scheduledTime}`;
    const lockValue = `${clientUserId}_${Date.now()}`; // Valor único para o lock
    const ttlMs = 15000; // Tempo de vida do lock em ms (15 segundos) para evitar duplicidades sob carga

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
    // --- Fim do Lock ---

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

      // --- Lógica de cálculo de totalPrice baseada no PricingType ---
      let calculatedTotalPrice: Prisma.Decimal;
      switch (providerService.pricingType) {
        case 'FIXED_PRICE':
          calculatedTotalPrice = providerService.price;
          break;
        case 'HOURLY':
          // Fallback robusto: se o app não enviar requestedDurationMinutes,
          // usar a durationMinutes configurada no ProviderService quando positiva.
          if (
            !createBookingDto.requestedDurationMinutes ||
            createBookingDto.requestedDurationMinutes <= 0
          ) {
            const serviceDefaultDuration = (providerService as any)
              .durationMinutes as number | null | undefined;
            if (serviceDefaultDuration && serviceDefaultDuration > 0) {
              this.logger.log(
                `[BookingsService] create - Aplicando fallback de durationMinutes do serviço HOURLY: ${serviceDefaultDuration} minutos.`,
              );
              createBookingDto.requestedDurationMinutes =
                serviceDefaultDuration;
            }
          }

          if (!createBookingDto.requestedDurationMinutes) {
            throw new BadRequestException(
              await this.i18n.translate(
                'booking.badRequest.durationRequired',
                locale,
              ),
            );
          }

          // Enforce mínimo de 4h (240 min) para HOURLY
          const normalizedDuration = Math.max(
            createBookingDto.requestedDurationMinutes,
            MIN_HOURLY_MINUTES,
          );
          if (
            normalizedDuration !== createBookingDto.requestedDurationMinutes
          ) {
            this.logger.log(
              `[BookingsService] create - Normalizando duração mínima para HOURLY: ${normalizedDuration} minutos.`,
            );
            createBookingDto.requestedDurationMinutes = normalizedDuration;
          }

          // Para HOURLY, usar pricePerHour se configurado; caso contrário, cair para price
          const hourlyBase =
            providerService.pricePerHour ?? providerService.price;
          if (!hourlyBase) {
            throw new BadRequestException(
              'Preço por hora não configurado para este serviço.',
            );
          }

          calculatedTotalPrice = hourlyBase.mul(
            new Prisma.Decimal(createBookingDto.requestedDurationMinutes).div(
              new Prisma.Decimal(60),
            ),
          );
          break;
        case 'BY_SIZE':
          if (
            createBookingDto.requestedSquareMeters &&
            providerService.pricePerSquareMeter
          ) {
            calculatedTotalPrice = providerService.pricePerSquareMeter.mul(
              new Prisma.Decimal(createBookingDto.requestedSquareMeters),
            );
          } else if (
            createBookingDto.requestedRoomCount &&
            providerService.pricePerRoom
          ) {
            calculatedTotalPrice = providerService.pricePerRoom.mul(
              new Prisma.Decimal(createBookingDto.requestedRoomCount),
            );
          } else {
            throw new BadRequestException(
              await this.i18n.translate(
                'booking.badRequest.sizeOrRoomsRequired',
                locale,
              ),
            );
          }
          break;
        default:
          calculatedTotalPrice = new Prisma.Decimal(
            createBookingDto.totalPrice,
          );
          this.logger.warn(
            `[BookingsService] create - Tipo de precificação desconhecido ou não implementado: ${providerService.pricingType}. Usando totalPrice do DTO.`,
          );
          break;
      }
      if (calculatedTotalPrice.lessThan(0)) {
        throw new BadRequestException(
          await this.i18n.translate('booking.badRequest.negativePrice', locale),
        );
      }
      this.logger.log(
        `[BookingsService] create - Serviço do provedor encontrado: ${providerService.id}. Preço calculado: ${calculatedTotalPrice.toFixed(2)}`,
      );

      // NEW: Apply dynamic pricing
      const { finalPrice: dynamicFinalPrice } =
        await this.pricingService.calculatePrice({
          serviceId: providerService.serviceId,
          providerId: provider.id,
          latitude: createBookingDto.address.latitude,
          longitude: createBookingDto.address.longitude,
          scheduledDate: createBookingDto.scheduledDate,
          cityCode: createBookingDto.address?.city,
        });
      calculatedTotalPrice = new Prisma.Decimal(dynamicFinalPrice);

      // NEW: Apply coupon if provided
      let couponId: string | null = null;
      let discountAmount: Prisma.Decimal = new Prisma.Decimal(0); // Para telemetria
      if (createBookingDto.couponCode) {
        this.logger.log(
          `[BookingsService] create - Tentando aplicar cupom: ${createBookingDto.couponCode}`,
        );
        const couponApplicationResult = await this.couponsService.applyCoupon(
          createBookingDto.couponCode,
          client.userId,
          {
            originalPrice: calculatedTotalPrice.toNumber(),
            clientId: client.id,
            providerServiceId: providerService.serviceId,
            providerId: provider.id,
            scheduledDate: createBookingDto.scheduledDate,
          },
        );

        if (couponApplicationResult.coupon) {
          calculatedTotalPrice = new Prisma.Decimal(
            couponApplicationResult.newTotalPrice,
          );
          couponId = couponApplicationResult.coupon.id;
          discountAmount = new Prisma.Decimal(
            couponApplicationResult.discountAmount,
          );
          this.logger.log(
            `[BookingsService] create - Cupom ${createBookingDto.couponCode} aplicado. Novo preço: ${calculatedTotalPrice.toFixed(2)}`,
          );
        } else {
          this.logger.warn(
            `[BookingsService] create - Cupom ${createBookingDto.couponCode} não aplicável: ${couponApplicationResult.message}`,
          );
        }
      }

      try {
        this.logger.log(
          `[BookingsService] create - Criando novo endereço no DB.`,
        );
        const newAddress = await this.prisma.address.create({
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

        const createdBooking = await this.prisma.booking.create({
          data: {
            clientId: client.id,
            providerId: provider.id,
            providerServiceId: providerService.id,
            scheduledDate: new Date(createBookingDto.scheduledDate),
            scheduledTime: createBookingDto.scheduledTime,
            scheduledStart: this.getScheduledAtInSaoPaulo(
              createBookingDto.scheduledDate,
              createBookingDto.scheduledTime,
            ),
            durationMinutes:
              createBookingDto.requestedDurationMinutes ||
              providerService.durationMinutes ||
              60,
            totalPrice: calculatedTotalPrice,
            notes: createBookingDto.notes,
            status: BookingStatus.PENDING,
            addressId: newAddress.id,
            couponId: couponId,
            discountAmount: discountAmount, // <<-- ADICIONADO: Salvar o valor do desconto
            // NOVO: Registrar uso do cupom aqui se o booking for criado com sucesso
            couponUsage: couponId
              ? {
                  create: {
                    couponId: couponId,
                    userId: clientUserId,
                    appliedValue: discountAmount, // Valor do desconto aplicado
                  },
                }
              : undefined,
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
          },
        });
        this.logger.log(
          `[BookingsService] create - Agendamento criado com sucesso no DB. ID: ${createdBooking.id}. ProviderId no booking retornado pelo Prisma: ${createdBooking.providerId}`,
        );

        // >>> NOVO: evento de missão para criação de booking
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
            `[BookingsService] Evento de missão 'booking.created' disparado para o cliente ${createdBooking.client.userId}.`,
          );
        } catch (e) {
          this.logger.warn(
            `[BookingsService] create - Falha ao emitir evento de missão booking.created: ${e?.message}`,
          );
        }
        // <<< FIM NOVO

        // Telemetria: booking_created
        this.logger.log(
          `[TELEMETRY] booking_created: { bookingId: ${createdBooking.id}, clientId: ${createdBooking.clientId}, providerId: ${createdBooking.providerId}, totalPrice: ${createdBooking.totalPrice.toFixed(2)}, couponId: ${couponId} }`,
        );

        // Se houve cupom, registrar uso (incrementa usesCount/status)
        if (couponId) {
          await this.couponsService.markCouponAsUsed(couponId);
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
      // --- NOVO: Liberar lock ---
      await this.redisLockService.releaseLock(lockKey, lockValue);
      this.logger.log(
        `[BookingsService] create - Lock liberado para a chave: ${lockKey}`,
      );
      // --- Fim da Liberação do Lock ---
    }
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
    // This method bypasses coupon/dynamic pricing logic as it's handled by subscription
    return this.prisma.booking.create({
      data: {
        clientId: data.clientId,
        providerId: data.providerId,
        providerServiceId: data.providerServiceId,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        totalPrice: new Prisma.Decimal(data.totalPrice),
        subscriptionId: data.subscriptionId,
        addressId: data.addressId,
        status: BookingStatus.PENDING, // Or 'SCHEDULED'
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
      },
    });
  }

  // NEW: Method to infer demand for pricing service
  async getDemandCountForArea(
    serviceId: string,
    latitude: number,
    longitude: number,
    scheduledDateTime: Date,
    radiusKm: number = 5,
  ) {
    const futureBookingsCount = await this.prisma.booking.count({
      where: {
        providerServiceId: serviceId,
        scheduledDate: {
          gte: scheduledDateTime,
          lte: new Date(scheduledDateTime.getTime() + 2 * 60 * 60 * 1000), // Next 2 hours
        },
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.STARTED,
          ], // Consider only active bookings (STARTED instead of IN_PROGRESS)
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
    const bookingDto = new BookingDetailsDto(bookingPrisma);

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
    request?: Request,
  ): Promise<BookingWithDetailsRelations[]> {
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

    this.logger.log(
      `[BookingsService] findUserBookings: Cláusula WHERE final: ${JSON.stringify(whereClause)}`,
    );

    return this.prisma.booking.findMany({
      where: whereClause,
      include: {
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
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true,
        incidents: true,
        guaranteeClaims: true,
        coupon: true,
        paymentIntent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
      },
    });
    if (!booking) {
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', locale, { id }),
      );
    }
    return booking;
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
    // Fix: Ensure client, provider, and providerService are included in the query
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        client: { include: { user: true } }, // <<-- FIXED: Include client for access to its properties
        paymentIntent: true,
      },
    });

    if (!booking) {
      this.logger.error(
        `[BookingsService] updateStatus - Agendamento com ID "${id}" não encontrado.`,
      );
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', locale, { id }),
      );
    }
    this.logger.log(
      `[BookingsService] updateStatus - Agendamento encontrado, status atual: ${booking.status}`,
    );
    const prevCompletedCount =
      (booking as any).client?.completedBookingsCount ?? 0;

    // Identidade do ator (quando houver request)
    const actorUserId =
      (request as any)?.user?.['userId'] || (request as any)?.user?.['id'];
    const actorRole =
      (request as any)?.user?.['role'] || (request as any)?.role || userRole;
    const actorProviderId =
      actorRole === UserRole.PROVIDER && actorUserId
        ? (await this.providersService.findByUserId(actorUserId))?.id
        : null;
    const actorClientId =
      actorRole === UserRole.CLIENT && actorUserId
        ? (await this.clientsService.findClientByUserId(actorUserId))?.id
        : null;

    if (userRole === UserRole.CLIENT) {
      if (!actorClientId || actorClientId !== booking.clientId) {
        throw new ForbiddenException(
          await this.i18n
            .translate?.('booking.forbidden.updateStatus', locale)
            .catch?.(() => 'Acesso negado ao agendamento.'),
        );
      }
    }
    if (userRole === UserRole.PROVIDER) {
      if (!actorProviderId || actorProviderId !== booking.providerId) {
        throw new ForbiddenException(
          await this.i18n
            .translate?.('booking.forbidden.updateStatus', locale)
            .catch?.(() => 'Acesso negado ao agendamento.'),
        );
      }
    }

    let canUpdate = false;
    let errorMessageKey: string = 'booking.badRequest.invalidStatusTransition';

    // Bloqueia reprocessamento de estados finais (exceto ADMIN)
    const finalizedStates = [
      BookingStatus.FINISHED,
      BookingStatus.CANCELED,
      BookingStatus.REJECTED,
      BookingStatus.NO_SHOW,
    ];
    if (
      finalizedStates.includes(booking.status as any) &&
      userRole !== UserRole.ADMIN
    ) {
      throw new BadRequestException(
        await this.i18n.translate('booking.badRequest.statusFinalized', locale),
      );
    }

    if (userRole === UserRole.ADMIN) {
      canUpdate = true;
      this.logger.log(
        `[BookingsService] updateStatus - ADMIN bypass de transição para booking ${id}.`,
      );
    } else if (userRole === UserRole.CLIENT) {
      if (newStatus === BookingStatus.CANCELED) {
        if (
          booking.status === BookingStatus.FINISHED ||
          booking.status === BookingStatus.CANCELED ||
          booking.status === BookingStatus.REJECTED
        ) {
          errorMessageKey = 'booking.badRequest.cannotCancelCompleted';
          canUpdate = false;
        } else {
          canUpdate = true;
        }
      } else {
        errorMessageKey = 'booking.badRequest.clientOnlyCancel';
      }
    } else if (userRole === UserRole.PROVIDER) {
      switch (booking.status) {
        case BookingStatus.PENDING:
          if (
            newStatus === BookingStatus.CONFIRMED ||
            newStatus === BookingStatus.REJECTED
          ) {
            canUpdate = true;
          } else {
            errorMessageKey = 'booking.badRequest.providerPendingStatus';
          }
          break;
        case BookingStatus.CONFIRMED:
          if (
            newStatus === BookingStatus.ON_THE_WAY ||
            newStatus === BookingStatus.ARRIVED ||
            newStatus === BookingStatus.STARTED ||
            newStatus === BookingStatus.FINISHED ||
            newStatus === BookingStatus.CANCELED ||
            newStatus === BookingStatus.RESCHEDULED
          ) {
            canUpdate = true;
          } else {
            errorMessageKey = 'booking.badRequest.providerConfirmedStatus';
          }
          break;
        case BookingStatus.STARTED:
          if (
            newStatus === BookingStatus.FINISHED ||
            newStatus === BookingStatus.CANCELED
          ) {
            canUpdate = true;
          } else {
            errorMessageKey = 'booking.badRequest.providerInProgressStatus';
          }
          break;
        case BookingStatus.RESCHEDULED:
          if (
            newStatus === BookingStatus.CONFIRMED ||
            newStatus === BookingStatus.CANCELED
          ) {
            canUpdate = true;
          } else {
            errorMessageKey = 'booking.badRequest.providerRescheduledStatus';
          }
          break;
        case BookingStatus.FINISHED:
        case BookingStatus.CANCELED:
        case BookingStatus.REJECTED:
          errorMessageKey = 'booking.badRequest.statusFinalized';
          break;
        default:
          errorMessageKey = 'booking.badRequest.invalidBookingStatus';
          break;
      }
    }

    if (
      userRole === UserRole.PROVIDER &&
      booking.status === BookingStatus.CONFIRMED &&
      newStatus === BookingStatus.FINISHED
    ) {
      canUpdate = false;
      errorMessageKey = 'booking.badRequest.providerConfirmedStatus';
    }

    if (!canUpdate) {
      this.logger.warn(
        `[BookingsService] updateStatus: Transição de status não permitida para booking ${id}: de ${booking.status} para ${newStatus} pelo role ${userRole}. Erro: ${errorMessageKey}`,
      );
      throw new BadRequestException(
        await this.i18n.translate(errorMessageKey, locale, {
          status: booking.status,
        }),
      );
    }
    this.logger.log(
      `[BookingsService] updateStatus - Status de agendamento validado. Atualizando no DB.`,
    );

    // Server-side guardrails for time windows and audit fields
    const now = new Date();
    const dataToUpdate: Prisma.BookingUpdateInput = { status: newStatus };

    // Ajuste: somente permitir STARTED quando booking estiver ARRIVED
    if (
      userRole === UserRole.PROVIDER &&
      booking.status === BookingStatus.ARRIVED &&
      newStatus === BookingStatus.STARTED
    ) {
      const scheduledAt = this.getScheduledAtInSaoPaulo(
        booking.scheduledDate,
        booking.scheduledTime,
      );
      const diffMin = Math.round(
        (now.getTime() - scheduledAt.getTime()) / 60000,
      );
      const minEarly = -15; // allow up to 15 minutes before
      const maxLate = 120; // allow up to 120 minutes after
      if (!(diffMin >= minEarly && diffMin <= maxLate)) {
        const msg = await this.i18n
          .translate?.('booking.badRequest.startOutsideWindow', locale)
          .catch?.(() => null);
        throw new BadRequestException(
          msg || 'Início fora da janela permitida.',
        );
      }
      (dataToUpdate as any).startedAt = now;
      (dataToUpdate as any).startedByUserId =
        (request as any)?.user?.['userId'] ||
        (request as any)?.user?.['id'] ||
        null;
    }

    // Ajuste: finalizar (FINISHED) somente quando booking estiver STARTED
    if (
      userRole === UserRole.PROVIDER &&
      booking.status === BookingStatus.STARTED &&
      newStatus === BookingStatus.FINISHED
    ) {
      const payStatus = booking.paymentIntent?.status;
      if (payStatus !== PaymentIntentStatus.PAID) {
        throw new BadRequestException(
          await this.i18n
            .translate?.('booking.badRequest.unpaid', locale)
            .catch?.(() => 'Pagamento não confirmado.'),
        );
      }
      const minRunMinutes = Math.max(
        0,
        parseInt(process.env.MIN_SERVICE_MINUTES ?? '15', 10) || 15,
      );
      const refStart =
        booking.startedAt ??
        booking.scheduledStart ??
        this.getScheduledAtInSaoPaulo(
          booking.scheduledDate,
          booking.scheduledTime,
        );
      const expectedEnd = this.getExpectedEnd(booking as any as Booking);
      if (expectedEnd && now < expectedEnd) {
        const msg = await this.i18n
          .translate?.('booking.badRequest.finishTooEarly', locale)
          .catch?.(() => null);
        throw new BadRequestException(
          msg || 'Finalização muito cedo em relação ao horário previsto.',
        );
      }
      const runMin = Math.round(
        (now.getTime() - new Date(refStart as any).getTime()) / 60000,
      );
      if (runMin < minRunMinutes) {
        const msg = await this.i18n
          .translate?.('booking.badRequest.finishTooEarly', locale)
          .catch?.(() => null);
        throw new BadRequestException(
          msg || 'Finalização muito cedo em relação ao horário previsto.',
        );
      }
      (dataToUpdate as any).completedAt = now;
      (dataToUpdate as any).completedByUserId =
        (request as any)?.user?.['userId'] ||
        (request as any)?.user?.['id'] ||
        null;
    }

    // --- NOVO: Lógica de Fidelização e Gamificação (após validação de status) ---
    if (newStatus === BookingStatus.FINISHED) {
      // Increment completedBookingsCount for the client (now triggered on FINISHED)
      await this.prisma.client.update({
        where: { id: booking.clientId },
        data: { completedBookingsCount: { increment: 1 } },
      });
      this.logger.log(
        `[BookingsService] updateStatus: Cliente ${booking.clientId} teve completedBookingsCount incrementado para ${booking.client?.completedBookingsCount + 1}.`,
      ); // Use optional chaining

      // Increment monthlyBookingsCount for the provider
      await this.prisma.provider.update({
        where: { id: booking.providerId },
        data: { monthlyBookingsCount: { increment: 1 } },
      });
      this.logger.log(
        `[BookingsService] updateStatus: Provedor ${booking.providerId} teve monthlyBookingsCount incrementado.`,
      );

      // ADICIONAR PONTOS PARA O CLIENTE POR SERVIÇO CONCLUÍDO
      await this.loyaltyService.addPoints({
        userId: booking.client.userId,
        points: 10,
        type: LoyaltyTransactionType.SERVICE_COMPLETED,
        referenceId: booking.id,
      });
      this.logger.log(
        `[BookingsService] updateStatus: Cliente ${booking.client.userId} recebeu pontos por serviço concluído.`,
      );
      // Telemetria: loyalty_points_earned_service_completed
      this.logger.log(
        `[TELEMETRY] loyalty_points_earned_service_completed: { userId: ${booking.client.userId}, bookingId: ${booking.id}, points: 10 }`,
      );

      // Enfileira notificação de review
      const reviewNotificationMessage = await this.i18n.translate(
        'notification.reviewRequest',
        locale,
        {
          serviceName: booking.providerService?.service.name,
          providerName: booking.provider?.fullName,
        },
      ); // Use optional chaining
      const reviewNotificationTargetUrl = `/client/bookings/${booking.id}/review`;
      await this.queuesService.addNotificationJob('send-notification', {
        userId: booking.client.userId,
        type: 'REVIEW_REQUEST',
        message: reviewNotificationMessage,
        targetUrl: reviewNotificationTargetUrl,
      });
      this.logger.log(
        `[BookingsService] updateStatus: Notificação de avaliação adicionada à fila para cliente ${booking.client.userId}.`,
      );

      // >>> NOVO: Missões -- evento de conclusão (agora disparado em FINISHED)
      try {
        await this.missionsService.trackEvent(
          booking.client.userId,
          'booking.completed',
          {
            bookingId: booking.id,
            providerId: booking.providerId,
            providerServiceId: booking.providerServiceId,
          },
        );
        this.logger.log(
          `[BookingsService] Evento de missão 'booking.completed' disparado para o cliente ${booking.client.userId}.`,
        );

        // NOVO: Missões -- evento 'first_booking_completed'
        if (prevCompletedCount === 0) {
          await this.missionsService.trackEvent(
            booking.client.userId,
            'first_booking_completed',
            {
              bookingId: booking.id,
              providerId: booking.providerId,
            },
          );
          this.logger.log(
            `[BookingsService] Evento de missão 'first_booking_completed' disparado para o cliente ${booking.client.userId}.`,
          );

          // NOVO: Emitir cupom de retorno (ativação)
          try {
            await this.couponsService.issueReturnCoupon(
              booking.client.userId,
              booking.id,
            );
            this.logger.log(
              `[BookingsService] Cupom de retorno emitido para o cliente ${booking.client.userId} após o primeiro booking.`,
            );
          } catch (e: any) {
            this.logger.error(
              `[BookingsService] Falha ao emitir cupom de retorno para ${booking.client.userId}: ${e?.message || e}`,
            );
          }
        }
      } catch (e: any) {
        this.logger.warn(
          `[BookingsService] updateStatus - Falha ao emitir evento de missão booking.completed/first_booking_completed: ${e?.message}`,
        );
      }

      // >>> NOVO: Indicações -- verificar conversão do indicado (1º FINISHED)
      try {
        await this.referralsService.handleBookingCompletedForReferral(
          booking.client.userId,
          booking.id,
        );
      } catch (e: any) {
        this.logger.warn(
          `[BookingsService] updateStatus - Falha ao processar conversão de referral: ${e?.message}`,
        );
      }
      // <<< FIM NOVO
    }

    // Métricas de cancelamento / no show
    if (
      newStatus === BookingStatus.CANCELED &&
      booking.status !== BookingStatus.CANCELED
    ) {
      await this.prisma.client.update({
        where: { id: booking.clientId },
        data: { cancellationCount: { increment: 1 } },
      });
      this.logger.log(
        `[BookingsService] updateStatus: Cliente ${booking.clientId} teve cancellationCount incrementado.`,
      );
    } else if (
      newStatus === BookingStatus.NO_SHOW &&
      booking.status !== BookingStatus.NO_SHOW
    ) {
      await this.prisma.client.update({
        where: { id: booking.clientId },
        data: { noShowCount: { increment: 1 } },
      });
      this.logger.log(
        `[BookingsService] updateStatus: Cliente ${booking.clientId} teve noShowCount incrementado.`,
      );
    }
    // --- Fim da Lógica de Fidelização e Gamificação ---

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: dataToUpdate,
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
      },
    });

    // Premium: ao confirmar, agenda lembretes T-24h/T-2h/T-15m e T0 para cliente e provedor
    if (newStatus === BookingStatus.CONFIRMED) {
      try {
        const scheduledAt = this.getScheduledAtInSaoPaulo(
          updatedBooking.scheduledDate,
          updatedBooking.scheduledTime,
        );
        if (!Number.isNaN(scheduledAt.getTime())) {
          const [hh, mm] = String(updatedBooking.scheduledTime || '00:00')
            .split(':')
            .map((n) => parseInt(n, 10));
          await this.queuesService.scheduleBookingReminders({
            bookingId: updatedBooking.id,
            clientUserId: updatedBooking.client?.userId,
            providerUserId: updatedBooking.provider?.userId,
            scheduledAt,
            deeplinkClient: `/agendamento/${updatedBooking.id}`,
            deeplinkProvider: `/agendamento/${updatedBooking.id}`,
            locale,
          });
          this.logger.log(
            `[BookingsService] updateStatus: Lembretes agendados para booking ${updatedBooking.id}.`,
          );
          // Push imediato de confirmação (som alto + deeplink)
          try {
            await this.queuesService.addNotificationJob(
              'send-push-notification',
              {
                userId: updatedBooking.client?.userId,
                title: 'Pagamento confirmado',
                body: `Seu serviço está confirmado para ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}.`,
                data: {
                  url: `/agendamento/${updatedBooking.id}`,
                  deeplink: `/agendamento/${updatedBooking.id}`,
                  channelId: 'high-priority',
                  priority: 'max',
                  idempotencyKey: `notif:booking_confirmed:client:${updatedBooking.id}`,
                },
              },
            );
          } catch {}
          try {
            await this.queuesService.addNotificationJob(
              'send-push-notification',
              {
                userId: updatedBooking.provider?.userId,
                title: 'Novo atendimento confirmado',
                body: `Atendimento confirmado para ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}.`,
                data: {
                  url: `/agendamento/${updatedBooking.id}`,
                  deeplink: `/agendamento/${updatedBooking.id}`,
                  channelId: 'high-priority',
                  priority: 'max',
                  idempotencyKey: `notif:booking_confirmed:provider:${updatedBooking.id}`,
                },
              },
            );
          } catch {}
        }
      } catch (e) {
        this.logger.warn(
          `[BookingsService] updateStatus: Falha ao agendar lembretes para booking ${updatedBooking?.id}: ${e?.message || e}`,
        );
      }
    }

    // Ledger: creditar ganho e fee ao concluir (idempotente) - agora disparado por FINISHED
    if (
      newStatus === BookingStatus.FINISHED &&
      updatedBooking.provider?.userId
    ) {
      // --- INÍCIO DA IMPLEMENTAÇÃO DA FINALIZAÇÃO DO SERVIÇO (Ledger) ---
      // Regra: Libera ganho (EARNING + líquido) e Zera retenção (HOLD - bruto)
      // Isso substitui a lógica anterior de criação de HOLD e agendamento de release,
      // e também a criação separada do FEE, pois o ganho líquido já considera a taxa.

      const grossAmount = updatedBooking.totalPrice;
      const providerUserId = updatedBooking.provider.userId;
      const bookingId = updatedBooking.id;

      // Calcular a taxa da plataforma (take rate) e o valor líquido
      const commissionPercent = new Prisma.Decimal(
        Math.max(0, Math.min(1, COMMISSION_RATE)),
      );
      const feeAmount = grossAmount.mul(commissionPercent);
      const netAmount = grossAmount.sub(feeAmount);

      // Verificar se as entradas de EARNING e HOLD (liberação) já existem para garantir idempotência
      const earningExists = await this.prisma.ledgerEntry.findFirst({
        where: { bookingId: bookingId, type: LedgerEntryType.EARNING },
      });
      const holdReleaseExists = await this.prisma.ledgerEntry.findFirst({
        where: {
          bookingId: bookingId,
          type: LedgerEntryType.HOLD,
          amount: { lt: 0 },
        }, // Procura por HOLD negativo (liberação)
      });

      if (!earningExists && !holdReleaseExists) {
        await this.prisma.ledgerEntry.createMany({
          data: [
            {
              userId: providerUserId,
              bookingId: bookingId,
              amount: netAmount,
              type: LedgerEntryType.EARNING,
              note: `Ganho líquido liberado`,
            },
            {
              userId: providerUserId,
              bookingId: bookingId,
              amount: grossAmount.neg(), // Valor bruto negativo para zerar retenção
              type: LedgerEntryType.HOLD,
              note: `Liberação do valor retido`,
            },
          ],
        });
        this.logger.log(
          `[BookingsService] updateStatus: Ledger EARNING e HOLD (liberação) criados para booking ${bookingId}.`,
        );
      } else {
        this.logger.log(
          `[BookingsService] updateStatus: Ledger EARNING ou HOLD (liberação) já existem para booking ${bookingId}, pulando criação.`,
        );
      }

      // A lógica anterior de criação de HOLD positivo e agendamento de job 'release-earning'
      // e a criação separada do FEE são removidas/substituídas por esta nova regra,
      // pois o ganho líquido (netAmount) já reflete a dedução da taxa da plataforma.

      // Plataforma: piso de margem (opcional via ENV) - Esta validação ainda é relevante
      try {
        const minPlatformFee = Math.max(
          0,
          parseFloat(process.env.MIN_PLATFORM_FEE ?? '0'),
        );
        // Valida se a taxa calculada (feeAmount) atinge o piso mínimo da plataforma
        if (minPlatformFee > 0 && feeAmount.toNumber() < minPlatformFee) {
          throw new BadRequestException(
            await this.i18n.translate(
              'pricing.badRequest.minPlatformFee',
              locale,
            ),
          );
        }
      } catch (e) {
        if (e instanceof BadRequestException) {
          throw e;
        }
        this.logger.warn(
          `[BookingsService] updateStatus - Falha ao validar piso de margem: ${e?.message || e}`,
        );
      }
      // --- FIM DA IMPLEMENTAÇÃO DA FINALIZAÇÃO DO SERVIÇO (Ledger) ---
    }

    // Telemetria: booking_status_updated
    this.logger.log(
      `[TELEMETRY] booking_status_updated: { bookingId: ${updatedBooking.id}, oldStatus: ${booking.status}, newStatus: ${newStatus}, userRole: ${userRole} }`,
    );

    return updatedBooking;
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
      },
    });
    this.logger.log(
      `[BookingsService] findUpcomingBookings: Bookings encontradas via Prisma ${upcomingPrismaBookings.length} agendamentos futuros antes da filtragem de hora.`,
    );

    const filteredBookings = upcomingPrismaBookings.filter((booking) => {
      const bookingDateTime = new Date(booking.scheduledDate);
      const [hours, minutes] = booking.scheduledTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const currentDateTime = new Date();
      currentDateTime.setSeconds(0, 0);

      if (bookingDateTime.toDateString() === currentDateTime.toDateString()) {
        return bookingDateTime >= currentDateTime;
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
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
      },
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
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.ON_THE_WAY },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true, // Adicionado
        incidents: true, // Adicionado
        guaranteeClaims: true, // Adicionado
        coupon: true, // Adicionado
        paymentIntent: true, // Adicionado
      },
    });

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
  ): Promise<BookingWithDetailsRelations> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
      },
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
    // bloco de arriveAtLocation
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.ARRIVED, arrivedAt: now },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true, // Adicionado
        incidents: true, // Adicionado
        guaranteeClaims: true, // Adicionado
        coupon: true, // Adicionado
        paymentIntent: true, // Adicionado
      },
    });

    await this.notifyClientStatusUpdate(updated, BookingStatus.ARRIVED);
    this.logger.log(
      `[BookingsService] arriveAtLocation: Booking ${bookingId} CHEGOU.`,
    );
    return updated;
  }

  async startService(bookingId: string, providerUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { include: { user: true } },
        client: { include: { user: true } },
        paymentIntent: true,
      },
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado.');
    if (booking.provider.userId !== providerUserId)
      throw new ForbiddenException('Somente o prestador pode iniciar.');
    if (booking.status !== BookingStatus.ARRIVED)
      throw new BadRequestException(
        'Status inválido para iniciar. Deve ser ARRIVED.',
      );
    if (booking.paymentIntent?.status !== 'PAID')
      throw new BadRequestException('Pagamento não confirmado.');

    const scheduledStart =
      booking.scheduledStart ||
      this.getScheduledAtInSaoPaulo(
        booking.scheduledDate,
        booking.scheduledTime,
      );
    const now = new Date();
    const diffMs = now.getTime() - scheduledStart.getTime();
    const windowMs = 15 * 60 * 1000;
    if (diffMs < -windowMs || diffMs > windowMs) {
      throw new BadRequestException('Fora da janela de início (±15min).');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        startedAt: now,
        status: BookingStatus.STARTED,
        startedByUserId: providerUserId,
      },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        paymentIntent: true,
      },
    });

    await this.notifyClientStatusUpdate(updated, BookingStatus.STARTED);
    // Push físico crítico: SERVICE_STARTED -> cliente
    if (updated.client?.userId) {
      const providerName = updated.provider?.user?.fullName || 'Prestador';
      const scheduledAt =
        updated.scheduledStart ||
        this.getScheduledAtInSaoPaulo(
          updated.scheduledDate,
          updated.scheduledTime,
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
    return updated;
  }

  async completeService(bookingId: string, providerUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true, paymentIntent: true },
    });
    if (!booking) throw new NotFoundException('Agendamento não encontrado.');
    if (booking.provider.userId !== providerUserId)
      throw new ForbiddenException('Somente o prestador pode concluir.');
    if (booking.status !== BookingStatus.STARTED)
      throw new BadRequestException(
        'Status inválido para concluir. Deve ser STARTED.',
      );
    if (booking.paymentIntent?.status !== 'PAID')
      throw new BadRequestException('Pagamento não confirmado.');

    const expectedEnd = this.getExpectedEnd(booking);
    if (new Date() < expectedEnd)
      throw new BadRequestException('Ainda não atingiu o horário final.');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        completedAt: new Date(),
        status: BookingStatus.FINISHED,
        completedByUserId: providerUserId,
      },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        paymentIntent: true,
      },
    });

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
      include: { paymentIntent: true },
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
      const updated = await this.prisma.booking.update({
        where: { id: b.id },
        data: {
          status: BookingStatus.FINISHED,
          completedAt: expectedEnd ?? now,
        },
        include: {
          client: { include: { user: true } },
          provider: { include: { user: true } },
          providerService: { include: { service: true } },
          paymentIntent: true,
        },
      });
      this.logger.log(
        `[BookingsService] autoCompleteOverdueBookings: booking ${b.id} marcado como FINISHED automaticamente.`,
      );

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
      include: { client: true, provider: true },
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
      include: { client: true, provider: true, address: true },
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
      include: { client: true, provider: true },
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
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: finalStatus,
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
      },
    });

    // Criar entradas no Ledger quando completar (idempotente por bookingId)
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
