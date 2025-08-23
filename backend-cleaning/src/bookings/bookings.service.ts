// src/bookings/bookings.service.ts

import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, Logger, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Booking, BookingStatus, UserRole, Prisma } from '@prisma/client';
import { ClientsService } from '../clients/clients.service';
import { ProvidersService, ProviderWithCalculatedRating } from '../providers/providers.service'; // Import ProviderWithCalculatedRating
import { ProviderServicesService } from '../provider-services/provider-services.service';
import { NotificationsService } from '../notifications/notifications.service'; // Import NotificationsService
import { PixChargeResponseDto } from '../payments/dto/create-pix-charge.dto'; // Assuming this DTO is correct
import { BookingAndPixResponseDto } from './dto/booking-and-pix-response.dto';
import { PaymentsService } from '../payments/payments.service';
import { BookingDetailsDto } from './dto/booking-details.dto'; // <-- IMPORTADO AQUI
import { ReportDisputeDto, DisputeReason } from './dto/report-dispute.dto'; // Importe o DTO de disputa
import { QueuesService } from '../queues/queues.service'; // Importe o serviço de filas
import { PricingService } from '../pricing/pricing.service'; // NEW
import { CouponsService } from '../coupons/coupons.service'; // NEW

// Importar LoyaltyService e LoyaltyTransactionType
import { LoyaltyService } from '../loyalty/loyalty.service'; // <--- NOVA LINHA
import { LoyaltyTransactionType } from '@prisma/client'; // <--- NOVA LINHA: Assumindo que LoyaltyTransactionType está no seu schema.prisma

// >>> NOVO: Missões & Indicações
import { MissionsService } from '../missions/missions.service';
import { ReferralsService } from '../referrals/referrals.service';
// <<< FIM NOVO
import { I18nService } from '../common/i18n/i18n.service'; // Importar I18nService
import { Request } from 'express'; // Para acessar o locale da requisição

// NOVO: Importar RedisLockService
import { RedisLockService } from '../common/locks/redis-lock.service';
// NOVO: Importar BookingStateMachine (se for usar para transições de status)
// import { BookingStateMachine } from './states/booking.state-machine'; // Descomente se for implementar a máquina de estados aqui

// CORREÇÃO: Adicionado subscription, incidents e guaranteeClaims à tipagem
// CORREÇÃO IMPORTANTE: Removido paymentIntentId e paymentIntent da tipagem de Booking,
// pois a relação agora é definida no PaymentIntent com bookingId como FK.
export type BookingWithDetailsRelations = Prisma.BookingGetPayload<{
  include: {
    client: { include: { user: true } };
    provider: { include: { user: true } };
    providerService: { include: { service: true } };
    review: true;
    address: true;
    subscription: true; // NEW: Include subscription
    incidents: true; // NEW: Include incidents
    guaranteeClaims: true; // NEW: Include guaranteeClaims
    coupon: true; // NEW: Include coupon
    paymentIntent: true; // NEW: Inclui o PaymentIntent relacionado
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
    private notificationsService: NotificationsService, // Inject NotificationsService
    private queuesService: QueuesService, // Injetar QueuesService
    private pricingService: PricingService, // NEW
    private couponsService: CouponsService, // NEW
    private loyaltyService: LoyaltyService, // <--- NOVA LINHA: Injetar LoyaltyService
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,

    // >>> NOVO: Injeções para Missões & Indicações
    @Inject(forwardRef(() => MissionsService))
    private missionsService: MissionsService,
    @Inject(forwardRef(() => ReferralsService))
    private referralsService: ReferralsService,
    // <<< FIM NOVO
    private readonly i18n: I18nService, // Injetar I18nService
    private readonly redisLockService: RedisLockService, // NOVO: Injetar RedisLockService
    // private readonly bookingStateMachine: BookingStateMachine, // NOVO: Injetar BookingStateMachine (se for usar)
  ) {}

  async create(clientUserId: string, createBookingDto: CreateBookingDto, request?: Request): Promise<BookingWithDetailsRelations> {
    this.logger.log(`[BookingsService] create - Início da criação do agendamento.`);
    this.logger.log(`[BookingsService] create - clientUserId: ${clientUserId}`);
    this.logger.log(`[BookingsService] create - DTO recebido: ${JSON.stringify(createBookingDto)}`);
    this.logger.log(`[BookingsService] create - Endereço DTO: ${JSON.stringify(createBookingDto.address)}`);

    const locale = (request as any)?.locale || 'pt-BR'; // Obter locale da requisição

    // NOVO: Adicionar lock para evitar race conditions na criação de agendamentos
    const lockKey = `booking:creation:${clientUserId}:${createBookingDto.providerId}:${createBookingDto.scheduledDate}:${createBookingDto.scheduledTime}`;
    // CORREÇÃO: Passar clientUserId como 'value' para o lock, e 5000 como 'ttlMs'
    const lock = await this.redisLockService.acquireLock(lockKey, clientUserId, 5000); // Tenta adquirir o lock por 5 segundos

    if (!lock) {
      this.logger.error(`[BookingsService] create - Falha ao adquirir lock para criação de agendamento para o usuário ${clientUserId}.`);
      throw new ConflictException(await this.i18n.translate('booking.conflict.concurrentCreation', locale));
    }

    try {
      const client = await this.clientsService.findClientByUserId(clientUserId);
      if (!client) {
        this.logger.error(`[BookingsService] create - Cliente não encontrado para userId: ${clientUserId}`);
        throw new NotFoundException(await this.i18n.translate('client.notFound', locale)); // Usar I18nService
      }
      this.logger.log(`[BookingsService] create - Cliente encontrado: ${client.id}`);

      const provider = await this.providersService.findOne(createBookingDto.providerId);
      if (!provider) {
        this.logger.error(`[BookingsService] create - Provedor com ID "${createBookingDto.providerId}" não encontrado.`);
        throw new NotFoundException(await this.i18n.translate('provider.notFound', locale, { id: createBookingDto.providerId })); // Usar I18nService
      }
      this.logger.log(`[BookingsService] create - Provedor encontrado: ${provider.id}`);

      const providerService = await this.providerServicesService.findOne(createBookingDto.providerServiceId, createBookingDto.providerId);
      if (!providerService) {
        this.logger.error(`[BookingsService] create - Serviço do provedor com ID "${createBookingDto.providerServiceId}" não encontrado para o provedor "${createBookingDto.providerId}".`);
        throw new NotFoundException(await this.i18n.translate('providerService.notFound', locale, { providerServiceId: createBookingDto.providerServiceId, providerId: createBookingDto.providerId })); // Usar I18nService
      }

      // --- Lógica de cálculo de totalPrice baseada no PricingType ---
      let calculatedTotalPrice: Prisma.Decimal;
      switch (providerService.pricingType) {
        case 'FIXED_PRICE':
          calculatedTotalPrice = providerService.price;
          break;
        case 'HOURLY':
          if (!createBookingDto.requestedDurationMinutes) {
            throw new BadRequestException(await this.i18n.translate('booking.badRequest.durationRequired', locale)); // Usar I18nService
          }
          calculatedTotalPrice = providerService.price.mul(new Prisma.Decimal(createBookingDto.requestedDurationMinutes).div(new Prisma.Decimal(60))); // Ensure division is with Decimal
          break;
        case 'BY_SIZE':
          if (createBookingDto.requestedSquareMeters && providerService.pricePerSquareMeter) {
            calculatedTotalPrice = providerService.pricePerSquareMeter.mul(new Prisma.Decimal(createBookingDto.requestedSquareMeters));
          } else if (createBookingDto.requestedRoomCount && providerService.pricePerRoom) {
            calculatedTotalPrice = providerService.pricePerRoom.mul(new Prisma.Decimal(createBookingDto.requestedRoomCount));
          } else {
            throw new BadRequestException(await this.i18n.translate('booking.badRequest.sizeOrRoomsRequired', locale)); // Usar I18nService
          }
          break;
        default:
          // Fallback para o valor do DTO se o tipo de precificação for desconhecido ou CUSTOM_QUOTE
          calculatedTotalPrice = new Prisma.Decimal(createBookingDto.totalPrice);
          this.logger.warn(`[BookingsService] create - Tipo de precificação desconhecido ou não implementado: ${providerService.pricingType}. Usando totalPrice do DTO.`);
          break;
      }
      if (calculatedTotalPrice.lessThan(0)) {
          throw new BadRequestException(await this.i18n.translate('booking.badRequest.negativePrice', locale)); // Usar I18nService
      }
      this.logger.log(`[BookingsService] create - Serviço do provedor encontrado: ${providerService.id}. Preço calculado: ${calculatedTotalPrice.toFixed(2)}`);

      // NEW: Apply dynamic pricing
      const { finalPrice: dynamicFinalPrice } = await this.pricingService.calculatePrice({
        serviceId: providerService.serviceId,
        providerId: provider.id,
        latitude: createBookingDto.address.latitude, // CORREÇÃO: Adicionar latitude ao CreateAddressDto
        longitude: createBookingDto.address.longitude, // CORREÇÃO: Adicionar longitude ao CreateAddressDto
        scheduledDate: createBookingDto.scheduledDate,
      });
      calculatedTotalPrice = new Prisma.Decimal(dynamicFinalPrice); // Override with dynamic price

      // NEW: Apply coupon if provided
      let couponId: string | null = null;
      if (createBookingDto.couponCode) { // CORREÇÃO: Adicionar couponCode ao CreateBookingDto
        this.logger.log(`[BookingsService] create - Tentando aplicar cupom: ${createBookingDto.couponCode}`);
        const couponApplicationResult = await this.couponsService.applyCoupon(createBookingDto.couponCode, client.userId, {
          originalPrice: calculatedTotalPrice.toNumber(),
          clientId: client.id,
          providerServiceId: providerService.serviceId,
          providerId: provider.id,
          scheduledDate: createBookingDto.scheduledDate,
        });

        if (couponApplicationResult.coupon) {
          calculatedTotalPrice = new Prisma.Decimal(couponApplicationResult.newTotalPrice);
          couponId = couponApplicationResult.coupon.id;
          this.logger.log(`[BookingsService] create - Cupom ${createBookingDto.couponCode} aplicado. Novo preço: ${calculatedTotalPrice.toFixed(2)}`);
        } else {
          this.logger.warn(`[BookingsService] create - Cupom ${createBookingDto.couponCode} não aplicável: ${couponApplicationResult.message}`);
          // Optionally throw an error or just proceed without coupon
        }
      }

      try {
        this.logger.log(`[BookingsService] create - Criando novo endereço no DB.`);
        const newAddress = await this.prisma.address.create({
          data: {
            cep: createBookingDto.address.cep,
            street: createBookingDto.address.street,
            number: createBookingDto.address.number,
            complement: createBookingDto.address.complement,
            neighborhood: createBookingDto.address.neighborhood,
            city: createBookingDto.address.city,
            state: createBookingDto.address.state,
            latitude: new Prisma.Decimal(createBookingDto.address.latitude), // CORREÇÃO: Converter para Prisma.Decimal
            longitude: new Prisma.Decimal(createBookingDto.address.longitude), // CORREÇÃO: Converter para Prisma.Decimal
          },
        });
        this.logger.log(`[BookingsService] create - Novo endereço criado com ID: ${newAddress.id}`);

        const createdBooking = await this.prisma.booking.create({
          data: {
            clientId: client.id,
            providerId: provider.id,
            providerServiceId: providerService.id,
            scheduledDate: new Date(createBookingDto.scheduledDate), // Ensure this is a Date object
            scheduledTime: createBookingDto.scheduledTime,
            totalPrice: calculatedTotalPrice, // Use the calculated total price
            notes: createBookingDto.notes,
            status: BookingStatus.PENDING,
            addressId: newAddress.id,
            couponId: couponId, // NEW: Store coupon ID
          },
          include: {
            client: { include: { user: true } },
            provider: { include: { user: true } },
            providerService: { include: { service: true } },
            review: true,
            address: true,
            subscription: true, // CORREÇÃO: Incluir subscription
            incidents: true, // CORREÇÃO: Incluir incidents
            guaranteeClaims: true, // CORREÇÃO: Incluir guaranteeClaims
            coupon: true, // NEW: Include coupon
            paymentIntent: true, // NEW: Inclui o PaymentIntent relacionado
          },
        });
        this.logger.log(`[BookingsService] create - Agendamento criado com sucesso no DB. ID: ${createdBooking.id}. ProviderId no booking retornado pelo Prisma: ${createdBooking.providerId}`);

        // >>> NOVO: evento de missão (opcional) para criação
        try {
          await this.missionsService.trackEvent(createdBooking.client.userId, 'booking.created', {
            bookingId: createdBooking.id,
            providerId: createdBooking.providerId,
            providerServiceId: createdBooking.providerServiceId,
          });
        } catch (e) {
          this.logger.warn(`[BookingsService] create - Falha ao emitir evento de missão booking.created: ${e?.message}`);
        }
        // <<< FIM NOVO

        return createdBooking;

      } catch (error: any) {
        this.logger.error('Erro detalhado ao criar agendamento no DB:', error.response?.data || error.message, error.stack);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ConflictException(await this.i18n.translate('booking.conflict.alreadyExists', locale)); // Usar I18nService
          }
          if (error.code === 'P2003' || error.code === 'P2025') {
              throw new BadRequestException(await this.i18n.translate('booking.badRequest.foreignKeyOrNotFound', locale)); // Usar I18nService
          }
        }
        throw new BadRequestException(await this.i18n.translate('booking.badRequest.cannotCreate', locale)); // Usar I18nService
      }
    } finally {
      // O valor do lock deve ser o mesmo usado na aquisição para liberar
      await this.redisLockService.releaseLock(lockKey, clientUserId); // Garante que o lock seja liberado
      this.logger.log(`[BookingsService] create - Lock liberado para a chave: ${lockKey}`);
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
    // ... any other fields for a subscription-generated booking
    addressId: string; // Assuming address already exists for subscription bookings
    scheduledTime: string; // Assuming subscription also defines a time
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
        // ... other default fields for subscription bookings
      },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true, // NEW
        incidents: true, // NEW
        guaranteeClaims: true, // NEW
        coupon: true, // NEW: Include coupon
        paymentIntent: true, // NEW: Inclui o PaymentIntent relacionado
      },
    });
  }

  // NEW: Method to infer demand for pricing service
  async getDemandCountForArea(serviceId: string, latitude: number, longitude: number, scheduledDateTime: Date, radiusKm: number = 5) {
    const futureBookingsCount = await this.prisma.booking.count({
      where: {
        providerServiceId: serviceId,
        scheduledDate: {
          gte: scheduledDateTime,
          lte: new Date(scheduledDateTime.getTime() + 2 * 60 * 60 * 1000), // Next 2 hours
        },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS], // Consider only active bookings
        },
      },
    });
    return futureBookingsCount;
  }

  async createBookingAndPixCharge(
    clientUserId: string,
    createBookingDto: CreateBookingDto,
    request?: Request, // Adicionado para passar o locale
  ): Promise<BookingAndPixResponseDto> {
    this.logger.log(`[BookingsService] createBookingAndPixCharge - Início da operação combinada.`);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - clientUserId: ${clientUserId}`);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - DTO de criação original recebido: ${JSON.stringify(createBookingDto)}`);

    const locale = (request as any)?.locale || 'pt-BR';

    const bookingPrisma = await this.create(clientUserId, createBookingDto, request); // Passar request
    const bookingDto = new BookingDetailsDto(bookingPrisma); // <-- CORREÇÃO: Mapeia para DTO aqui

    this.logger.log(`[BookingsService] createBookingAndPixCharge - Agendamento criado com sucesso (ID: ${bookingDto.id}).`);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - Booking object retornado por 'create' (mapeado para DTO): ${JSON.stringify(bookingDto, null, 2)}`);

    const pixChargeDto = {
      amount: bookingDto.totalPrice, // Use totalPrice do DTO (que já é number)
      description: `Pagamento para o serviço de limpeza agendado (ID: ${bookingDto.id})`,
      bookingId: bookingDto.id,
      providerId: bookingDto.providerId,
    };
    this.logger.log(`[BookingsService] createBookingAndPixCharge - PIX Charge DTO para PaymentsService (antes da chamada): ${JSON.stringify(pixChargeDto)}`);

    try {
      const pixChargeResponse = await this.paymentsService.createPixCharge(clientUserId, pixChargeDto);
      this.logger.log(`[BookingsService] createBookingAndPixCharge - Resposta PIX Charge recebida: ${JSON.stringify(pixChargeResponse)}`);
      return { booking: bookingDto, pixCharge: pixChargeResponse }; // Retorna o DTO combinado
    } catch (error) {
      this.logger.error(`[BookingsService] createBookingAndPixCharge - Erro ao gerar cobrança PIX: ${error.message}`);
      throw new BadRequestException(await this.i18n.translate('pix.chargeFailed', locale, { message: error.message })); // Usar I18nService
    }
  }

  async findUserBookings(userId: string, role: UserRole, status?: string, request?: Request): Promise<BookingWithDetailsRelations[]> {
    this.logger.log(`[BookingsService] findUserBookings: Buscando agendamentos para userId: ${userId}, role: ${role}, status: ${status || 'todos'}`);
    let whereClause: Prisma.BookingWhereInput = {};
    const locale = (request as any)?.locale || 'pt-BR';

    if (role === UserRole.CLIENT) {
      const client = await this.prisma.client.findUnique({ where: { userId } });
      if (!client) {
        this.logger.error(`[BookingsService] findUserBookings - Cliente não encontrado para userId: ${userId}`);
        throw new NotFoundException(await this.i18n.translate('client.notFound', locale)); // Usar I18nService
      }
      whereClause.clientId = client.id;
    } else if (role === UserRole.PROVIDER) {
      const provider = await this.prisma.provider.findUnique({ where: { userId } });
      if (!provider) {
        this.logger.error(`[BookingsService] findUserBookings - Provedor não encontrado para userId: ${userId}`);
        throw new NotFoundException(await this.i18n.translate('provider.notFound', locale, { id: userId })); // Usar I18nService
      }
      whereClause.providerId = provider.id;
    } else if (role === UserRole.ADMIN) {
      this.logger.log(`[BookingsService] findUserBookings - Usuário é ADMIN. Buscando todos os agendamentos.`);
    } else {
      this.logger.error(`[BookingsService] findUserBookings - Função de usuário inválida: ${role}`);
      throw new BadRequestException(await this.i18n.translate('booking.badRequest.invalidUserRole', locale)); // Usar I18nService
    }

    if (status) {
      const validBookingStatus = Object.values(BookingStatus).find(s => s === status);
      if (validBookingStatus) {
        whereClause.status = validBookingStatus;
        this.logger.log(`[BookingsService] findUserBookings: Filtrando por status válido: ${validBookingStatus}`);
      } else {
        this.logger.warn(`[BookingsService] findUserBookings: Status inválido recebido: "${status}". Ignorando filtro de status.`);
      }
    }

    this.logger.log(`[BookingsService] findUserBookings: Cláusula WHERE final: ${JSON.stringify(whereClause)}`);

    return this.prisma.booking.findMany({
      where: whereClause,
      include: {
        client: {
          include: {
            user: true,
            address: true
          }
        },
        provider: {
          include: {
            user: true,
            address: true,
            // Incluir serviços do provedor para mostrar especialidades
            providerServices: {
              include: {
                service: true
              }
            }
          }
        },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true, // NEW
        incidents: true, // NEW
        guaranteeClaims: true, // NEW
        coupon: true, // NEW: Include coupon
        paymentIntent: true, // NEW: Inclui o PaymentIntent relacionado
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, request?: Request): Promise<BookingWithDetailsRelations | null> {
    this.logger.log(`[BookingsService] findOne: Buscando agendamento por ID: ${id}`);
    const locale = (request as any)?.locale || 'pt-BR';
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true, // NEW
        incidents: true, // NEW
        guaranteeClaims: true, // NEW
        coupon: true, // NEW: Include coupon
        paymentIntent: true, // NEW: Inclui o PaymentIntent relacionado
      },
    });
    if (!booking) {
      throw new NotFoundException(await this.i18n.translate('booking.notFound', locale, { id })); // Usar I18nService
    }
    return booking;
  }

  async updateStatus(id: string, newStatus: BookingStatus, userRole: UserRole, request?: Request): Promise<BookingWithDetailsRelations> {
    this.logger.log(`[BookingsService] updateStatus: Tentando atualizar agendamento ${id} para status ${newStatus} por role ${userRole}.`);
    // CORREÇÃO: Incluir 'provider' e 'providerService' para acessar suas propriedades
    const locale = (request as any)?.locale || 'pt-BR';
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        provider: { include: { user: true } }, // Incluir user para acessar fullName
        providerService: { include: { service: true } }, // Incluir service para acessar name
        client: { include: { user: true } } // Incluir client e user para acessar userId
      }
    });

    if (!booking) {
      this.logger.error(`[BookingsService] updateStatus - Agendamento com ID "${id}" não encontrado.`);
      throw new NotFoundException(await this.i18n.translate('booking.notFound', locale, { id })); // Usar I18nService
    }
    this.logger.log(`[BookingsService] updateStatus - Agendamento encontrado, status atual: ${booking.status}`);

    let canUpdate = false;
    let errorMessageKey: string = 'booking.badRequest.invalidStatusTransition'; // Chave padrão

    // NOVO: Exemplo de uso da máquina de estados (se BookingStateMachine for implementado)
    // try {
    //   canUpdate = this.bookingStateMachine.canTransition(booking.status, newStatus, userRole);
    // } catch (e) {
    //   errorMessageKey = e.message; // A máquina de estados pode lançar mensagens de erro específicas
    //   canUpdate = false;
    // }

    // Mantendo a lógica de transição existente por enquanto, caso a máquina de estados não seja implementada imediatamente
    if (userRole === UserRole.ADMIN) {
      canUpdate = true;
      this.logger.log(`[BookingsService] updateStatus - ADMIN bypass de transição para booking ${id}.`);
    } else if (userRole === UserRole.CLIENT) {
      if (newStatus === BookingStatus.CANCELED) {
        if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELED || booking.status === BookingStatus.REJECTED) {
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
          if (newStatus === BookingStatus.CONFIRMED || newStatus === BookingStatus.REJECTED) {
            canUpdate = true;
          } else {
            errorMessageKey = 'booking.badRequest.providerPendingStatus';
          }
          break;
        case BookingStatus.CONFIRMED:
          if (newStatus === BookingStatus.IN_PROGRESS || newStatus === BookingStatus.COMPLETED || newStatus === BookingStatus.CANCELED || newStatus === BookingStatus.RESCHEDULED) {
            canUpdate = true;
          } else {
            errorMessageKey = 'booking.badRequest.providerConfirmedStatus';
          }
          break;
        case BookingStatus.IN_PROGRESS:
          if (newStatus === BookingStatus.COMPLETED || newStatus === BookingStatus.CANCELED) {
            canUpdate = true;
          } else {
            errorMessageKey = 'booking.badRequest.providerInProgressStatus';
          }
          break;
        case BookingStatus.RESCHEDULED:
          if (newStatus === BookingStatus.CONFIRMED || newStatus === BookingStatus.CANCELED) {
            canUpdate = true;
          } else {
            errorMessageKey = 'booking.badRequest.providerRescheduledStatus';
          }
          break;
        case BookingStatus.COMPLETED:
        case BookingStatus.CANCELED:
        case BookingStatus.REJECTED:
          errorMessageKey = 'booking.badRequest.statusFinalized';
          break;
        default:
          errorMessageKey = 'booking.badRequest.invalidBookingStatus';
          break;
      }
    }

    if (!canUpdate) {
      this.logger.warn(`[BookingsService] updateStatus: Transição de status não permitida para booking ${id}: de ${booking.status} para ${newStatus} pelo role ${userRole}. Erro: ${errorMessageKey}`);
      // Usar I18nService para mensagens de erro
      throw new BadRequestException(await this.i18n.translate(errorMessageKey, locale, { status: booking.status }));
    }
    this.logger.log(`[BookingsService] updateStatus - Status de agendamento validado. Atualizando no DB.`);

    // --- Lógica de Fidelização (após validação de status) ---
    if (newStatus === BookingStatus.COMPLETED) {
      // Increment completedBookingsCount for the client
      await this.prisma.client.update({
        where: { id: booking.clientId },
        data: { completedBookingsCount: { increment: 1 } },
      });
      this.logger.log(`[BookingsService] updateStatus: Cliente ${booking.clientId} teve completedBookingsCount incrementado.`);

      // Increment monthlyBookingsCount for the provider
      await this.prisma.provider.update({
        where: { id: booking.providerId },
        data: { monthlyBookingsCount: { increment: 1 } },
      });
      this.logger.log(`[BookingsService] updateStatus: Provedor ${booking.providerId} teve monthlyBookingsCount incrementado.`);

      // ADICIONAR PONTOS PARA O CLIENTE POR SERVIÇO CONCLUÍDO
      await this.loyaltyService.addPoints({
        userId: booking.client.userId,
        points: 10, // Exemplo: +10 pontos por serviço concluído
        type: LoyaltyTransactionType.SERVICE_COMPLETED,
        referenceId: booking.id,
      });
      this.logger.log(`[BookingsService] updateStatus: Cliente ${booking.client.userId} recebeu pontos por serviço concluído.`);

      // Mark coupon as used if one was applied to this booking
      const bookingWithCoupon = await this.prisma.booking.findUnique({
        where: { id: booking.id },
        select: { couponId: true }
      });

      if (bookingWithCoupon?.couponId) {
        await this.couponsService.markCouponAsUsed(bookingWithCoupon.couponId);
        this.logger.log(`[BookingsService] updateStatus: Cupom ${bookingWithCoupon.couponId} marcado como usado para o agendamento ${booking.id}.`);
      }

      // Enfileira notificação de review
      const reviewNotificationMessage = await this.i18n.translate('notification.reviewRequest', locale, { serviceName: booking.providerService.service.name, providerName: booking.provider.fullName }); // Usar I18nService
      const reviewNotificationTargetUrl = `/client/bookings/${booking.id}/review`;
      await this.queuesService.addNotificationJob('send-notification', {
        userId: booking.client.userId,
        type: 'REVIEW_REQUEST',
        message: reviewNotificationMessage,
        targetUrl: reviewNotificationTargetUrl,
      });
      this.logger.log(`[BookingsService] updateStatus: Notificação de avaliação adicionada à fila para cliente ${booking.client.userId}.`);

      // >>> NOVO: Missões -- evento de conclusão
      try {
        await this.missionsService.trackEvent(booking.client.userId, 'booking.completed', {
          bookingId: booking.id,
          providerId: booking.providerId,
          providerServiceId: booking.providerServiceId,
        });
      } catch (e) {
        this.logger.warn(`[BookingsService] updateStatus - Falha ao emitir evento de missão booking.completed: ${e?.message}`);
      }

      // >>> NOVO: Indicações -- verificar conversão do indicado (1º COMPLETED)
      try {
        await this.referralsService.handleBookingCompletedForReferral(booking.client.userId, booking.id);
      } catch (e) {
        this.logger.warn(`[BookingsService] updateStatus - Falha ao processar conversão de referral: ${e?.message}`);
      }
      // <<< FIM NOVO

      // NEW: Lógica para calcular e armazenar taxa de aceitação e tempo médio de resposta
      // Isso é um placeholder. A lógica real dependeria de um histórico de interações.
      // Você precisaria de um campo no modelo Provider para armazenar isso.
      // Exemplo conceitual (assumindo campos no modelo Provider):
      // await this.providersService.updateProviderPerformanceMetrics(booking.providerId);
    }

    // Métricas de cancelamento / no show
    if (newStatus === BookingStatus.CANCELED && booking.status !== BookingStatus.CANCELED) {
      await this.prisma.client.update({
        where: { id: booking.clientId },
        data: { cancellationCount: { increment: 1 } },
      });
      this.logger.log(`[BookingsService] updateStatus: Cliente ${booking.clientId} teve cancellationCount incrementado.`);
    } else if (newStatus === BookingStatus.NO_SHOW && booking.status !== BookingStatus.NO_SHOW) {
      await this.prisma.client.update({
        where: { id: booking.clientId },
        data: { noShowCount: { increment: 1 } },
      });
      this.logger.log(`[BookingsService] updateStatus: Cliente ${booking.clientId} teve noShowCount incrementado.`);
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: newStatus },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true, // NEW
        incidents: true, // NEW
        guaranteeClaims: true, // NEW
        coupon: true, // NEW: Include coupon
        paymentIntent: true, // NEW: Inclui o PaymentIntent relacionado
      },
    });
  }

  async findUpcomingBookings(providerId: string): Promise<BookingWithDetailsRelations[]> { // Retorna o tipo Prisma
    this.logger.log(`[BookingsService] findUpcomingBookings: Buscando agendamentos futuros para providerId: ${providerId}`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingPrismaBookings = await this.prisma.booking.findMany({
      where: {
        providerId: providerId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.RESCHEDULED, BookingStatus.IN_PROGRESS], // Incluído IN_PROGRESS
        },
        scheduledDate: {
          gte: now,
        },
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { scheduledTime: 'asc' },
      ],
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
        subscription: true, // NEW
        incidents: true, // NEW
        guaranteeClaims: true, // NEW
        coupon: true, // NEW: Include coupon
        paymentIntent: true, // NEW: Inclui o PaymentIntent relacionado
      },
    });
    this.logger.log(`[BookingsService] findUpcomingBookings: Primas encontradas ${upcomingPrismaBookings.length} agendamentos futuros antes da filtragem de hora.`);

    const filteredBookings = upcomingPrismaBookings.filter(booking => {
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
    this.logger.log(`[BookingsService] findUpcomingBookings: Encontrados ${filteredBookings.length} agendamentos futuros após filtragem final.`);
    return filteredBookings; // Retorna o tipo Prisma
  }

  async cancelBooking(bookingId: string, userRole: UserRole, request?: Request): Promise<BookingWithDetailsRelations> { // Adicionado userRole e request
    return this.updateStatus(bookingId, BookingStatus.CANCELED, userRole, request);
  }

  async checkConfirmedBookingBetweenUsers(clientId: string, providerId: string): Promise<boolean> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        clientId: clientId,
        providerId: providerId,
        status: BookingStatus.CONFIRMED,
      },
    });
    return !!booking;
  }

  async checkActiveChatBooking(clientId: string, providerId: string): Promise<{ canChat: boolean; bookingId?: string }> {
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        clientId: clientId,
        providerId: providerId,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
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

  async reportIssue(bookingId: string, userId: string, userRole: UserRole, reason: string, request?: Request): Promise<BookingWithDetailsRelations> {
    this.logger.log(`[BookingsService] reportIssue: Usuário ${userId} (${userRole}) reportando problema no booking ${bookingId}. Motivo: ${reason}`);
    const locale = (request as any)?.locale || 'pt-BR';

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, provider: true } // Include client and provider to check ownership
    });

    if (!booking) {
      throw new NotFoundException(await this.i18n.translate('booking.notFound', locale, { id: bookingId })); // Usar I18nService
    }

    const client = await this.clientsService.findClientByUserId(userId);
    const provider = await this.providersService.findByUserId(userId);

    if (userRole === UserRole.CLIENT && booking.clientId !== client?.id) {
      throw new ForbiddenException(await this.i18n.translate('booking.forbidden.reportIssue', locale)); // Usar I18nService
    }
    if (userRole === UserRole.PROVIDER && booking.providerId !== provider?.id) {
      throw new ForbiddenException(await this.i18n.translate('booking.forbidden.reportIssue', locale)); // Usar I18nService
    }

    const notificationMessage = await this.i18n.translate('notification.newDisputeAdmin', locale, { bookingId, reason }); // Usar I18nService
    await this.queuesService.addNotificationJob('send-notification', {
      userId: 'ADMIN_USER_ID', // Substitua pelo ID do usuário admin real
      type: 'BOOKING_DISPUTE',
      message: notificationMessage,
      targetUrl: `/admin/disputes/${bookingId}`,
    });
    this.logger.log(`[BookingsService] reportIssue: Notificação de disputa adicionada à fila para ADMIN.`);

    return this.updateStatus(bookingId, BookingStatus.PENDING_DISPUTE, userRole, request); // Passar request
  }

  // NOVO MÉTODO: Reportar Disputa (adiciona à fila)
  async reportDispute(bookingId: string, userId: string, userRole: UserRole, dto: ReportDisputeDto, request?: Request): Promise<void> { // Adicionado request
    this.logger.log(`[BookingsService] reportDispute: Usuário ${userId} (${userRole}) reportando disputa para booking ${bookingId}.`);
    const locale = (request as any)?.locale || 'pt-BR';

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, provider: true, address: true }
    });

    if (!booking) {
      throw new NotFoundException(await this.i18n.translate('booking.notFound', locale, { id: bookingId })); // Usar I18nService
    }

    const client = await this.clientsService.findClientByUserId(userId);
    const provider = await this.providersService.findByUserId(userId);

    if (userRole === UserRole.CLIENT && booking.clientId !== client?.id) {
      throw new ForbiddenException(await this.i18n.translate('dispute.forbidden.access', locale)); // Usar I18nService
    }
    if (userRole === UserRole.PROVIDER && booking.providerId !== provider?.id) {
      throw new ForbiddenException(await this.i18n.translate('dispute.forbidden.access', locale)); // Usar I18nService
    }

    await this.queuesService.addDisputeJob('process-booking-dispute', {
      bookingId,
      reporterUserId: userId,
      reporterRole: userRole,
      reason: dto.reason,
      description: dto.description,
      refundAmount: dto.refundAmount, // CORREÇÃO: Usar dto.refundAmount
      attachments: dto.attachments,
    });

    await this.updateStatus(bookingId, BookingStatus.PENDING_DISPUTE, userRole, request); // Passar request

    this.logger.log(`[BookingsService] reportDispute: Disputa para booking ${bookingId} adicionada à fila de processamento.`);
  }

  // NOVO MÉTODO: Resolver Disputa (apenas para ADMIN)
  async resolveDispute(bookingId: string, resolution: string, refundAmount?: number, newStatus?: BookingStatus, request?: Request): Promise<BookingWithDetailsRelations> { // Adicionado request
    this.logger.log(`[BookingsService] resolveDispute: Resolvendo disputa para booking ${bookingId}. Resolução: ${resolution}.`);
    const locale = (request as any)?.locale || 'pt-BR';

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, provider: true }
    });

    if (!booking) {
      throw new NotFoundException(await this.i18n.translate('booking.notFound', locale, { id: bookingId })); // Usar I18nService
    }

    if (booking.status !== BookingStatus.PENDING_DISPUTE) {
      throw new BadRequestException(await this.i18n.translate('dispute.badRequest.notInDisputeStatus', locale)); // Usar I18nService
    }

    if (refundAmount && refundAmount > 0) {
      this.logger.log(`[BookingsService] resolveDispute: Iniciando processo de reembolso de R$${refundAmount} para booking ${bookingId}.`);
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
    }

    const finalStatus = newStatus || BookingStatus.COMPLETED;
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
        subscription: true, // NEW
        incidents: true, // NEW
        guaranteeClaims: true, // NEW
        coupon: true, // NEW: Include coupon
        paymentIntent: true, // NEW: Inclui o PaymentIntent relacionado
      },
    });

    const clientNotificationMessage = await this.i18n.translate('notification.disputeResolvedClient', locale, { bookingId: booking.id, status: finalStatus, resolution }); // Usar I18nService
    await this.queuesService.addNotificationJob('send-notification', {
      userId: booking.client.userId,
      type: 'DISPUTE_RESOLUTION',
      message: clientNotificationMessage,
      targetUrl: `/client/bookings/${booking.id}`,
    });
    const providerNotificationMessage = await this.i18n.translate('notification.disputeResolvedProvider', locale, { bookingId: booking.id, status: finalStatus, resolution }); // Usar I18nService
    await this.queuesService.addNotificationJob('send-notification', {
      userId: booking.provider.userId,
      type: 'DISPUTE_RESOLUTION',
      message: providerNotificationMessage,
      targetUrl: `/provider/bookings/${booking.id}`,
    });

    this.logger.log(`[BookingsService] resolveDispute: Disputa para booking ${bookingId} resolvida. Novo status: ${finalStatus}.`);
    return updatedBooking;
  }
}