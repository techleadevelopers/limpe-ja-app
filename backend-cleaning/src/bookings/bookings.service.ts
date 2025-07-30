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

export type BookingWithDetailsRelations = Prisma.BookingGetPayload<{
  include: {
    client: { include: { user: true } };
    provider: { include: { user: true } };
    providerService: { include: { service: true } };
    review: true;
    address: true;
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
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  async create(clientUserId: string, createBookingDto: CreateBookingDto): Promise<BookingWithDetailsRelations> {
    this.logger.log(`[BookingsService] create - Início da criação do agendamento.`);
    this.logger.log(`[BookingsService] create - clientUserId: ${clientUserId}`);
    this.logger.log(`[BookingsService] create - DTO recebido: ${JSON.stringify(createBookingDto)}`);
    this.logger.log(`[BookingsService] create - Endereço DTO: ${JSON.stringify(createBookingDto.address)}`);

    const client = await this.clientsService.findClientByUserId(clientUserId);
    if (!client) {
      this.logger.error(`[BookingsService] create - Cliente não encontrado para userId: ${clientUserId}`);
      throw new NotFoundException('Cliente não encontrado.');
    }
    this.logger.log(`[BookingsService] create - Cliente encontrado: ${client.id}`);

    const provider = await this.providersService.findOne(createBookingDto.providerId);
    if (!provider) {
      this.logger.error(`[BookingsService] create - Provedor com ID "${createBookingDto.providerId}" não encontrado.`);
      throw new NotFoundException(`Provedor com ID "${createBookingDto.providerId}" não encontrado.`);
    }
    this.logger.log(`[BookingsService] create - Provedor encontrado: ${provider.id}`);

    const providerService = await this.providerServicesService.findOne(createBookingDto.providerServiceId, createBookingDto.providerId);
    if (!providerService) {
      this.logger.error(`[BookingsService] create - Serviço do provedor com ID "${createBookingDto.providerServiceId}" não encontrado para o provedor "${createBookingDto.providerId}".`);
      throw new NotFoundException(`Serviço do provedor com ID "${createBookingDto.providerServiceId}" não encontrado para o provedor "${createBookingDto.providerId}".`);
    }

    // --- Lógica de cálculo de totalPrice baseada no PricingType ---
    let calculatedTotalPrice: Prisma.Decimal;
    switch (providerService.pricingType) {
      case 'FIXED_PRICE':
        calculatedTotalPrice = providerService.price;
        break;
      case 'HOURLY':
        if (!createBookingDto.requestedDurationMinutes) {
          throw new BadRequestException('Duração em minutos é obrigatória para serviços por hora.');
        }
        calculatedTotalPrice = providerService.price.mul(new Prisma.Decimal(createBookingDto.requestedDurationMinutes).div(new Prisma.Decimal(60))); // Ensure division is with Decimal
        break;
      case 'BY_SIZE':
        if (createBookingDto.requestedSquareMeters && providerService.pricePerSquareMeter) {
          calculatedTotalPrice = providerService.pricePerSquareMeter.mul(new Prisma.Decimal(createBookingDto.requestedSquareMeters));
        } else if (createBookingDto.requestedRoomCount && providerService.pricePerRoom) {
          calculatedTotalPrice = providerService.pricePerRoom.mul(new Prisma.Decimal(createBookingDto.requestedRoomCount));
        } else {
          throw new BadRequestException('Metragem ou número de cômodos é obrigatório para serviços por tamanho.');
        }
        break;
      default:
        // Fallback para o valor do DTO se o tipo de precificação for desconhecido ou CUSTOM_QUOTE
        calculatedTotalPrice = new Prisma.Decimal(createBookingDto.totalPrice);
        this.logger.warn(`[BookingsService] create - Tipo de precificação desconhecido ou não implementado: ${providerService.pricingType}. Usando totalPrice do DTO.`);
        break;
    }
    if (calculatedTotalPrice.lessThan(0)) {
        throw new BadRequestException('O preço calculado não pode ser negativo.');
    }
    this.logger.log(`[BookingsService] create - Serviço do provedor encontrado: ${providerService.id}. Preço calculado: ${calculatedTotalPrice.toFixed(2)}`);

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
        },
        include: {
          client: { include: { user: true } },
          provider: { include: { user: true } },
          providerService: { include: { service: true } },
          review: true,
          address: true,
        },
      });
      this.logger.log(`[BookingsService] create - Agendamento criado com sucesso no DB. ID: ${createdBooking.id}. ProviderId no booking retornado pelo Prisma: ${createdBooking.providerId}`);
      return createdBooking;

    } catch (error: any) {
      this.logger.error('Erro detalhado ao criar agendamento no DB:', error.response?.data || error.message, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Já existe um agendamento com os dados fornecidos.');
        }
        if (error.code === 'P2003' || error.code === 'P2025') {
            throw new BadRequestException('Erro de dados relacionados ao endereço ou outras chaves estrangeiras. Verifique os dados fornecidos.');
        }
      }
      throw new BadRequestException('Não foi possível criar o agendamento. Verifique os dados fornecidos.');
    }
  }

  async createBookingAndPixCharge(
    clientUserId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingAndPixResponseDto> {
    this.logger.log(`[BookingsService] createBookingAndPixCharge - Início da operação combinada.`);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - clientUserId: ${clientUserId}`);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - DTO de criação original recebido: ${JSON.stringify(createBookingDto)}`);

    const bookingPrisma = await this.create(clientUserId, createBookingDto); // Retorna BookingWithDetailsRelations
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

    const pixChargeResponse = await this.paymentsService.createPixCharge(clientUserId, pixChargeDto);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - Resposta PIX Charge recebida: ${JSON.stringify(pixChargeResponse)}`);

    return { booking: bookingDto, pixCharge: pixChargeResponse }; // Retorna o DTO combinado
  }

  async findUserBookings(userId: string, role: UserRole, status?: string): Promise<BookingWithDetailsRelations[]> {
    this.logger.log(`[BookingsService] findUserBookings: Buscando agendamentos para userId: ${userId}, role: ${role}, status: ${status || 'todos'}`);
    let whereClause: Prisma.BookingWhereInput = {};

    if (role === UserRole.CLIENT) {
      const client = await this.prisma.client.findUnique({ where: { userId } });
      if (!client) {
        this.logger.error(`[BookingsService] findUserBookings - Cliente não encontrado para userId: ${userId}`);
        throw new NotFoundException('Cliente não encontrado.');
      }
      whereClause.clientId = client.id;
    } else if (role === UserRole.PROVIDER) {
      const provider = await this.prisma.provider.findUnique({ where: { userId } });
      if (!provider) {
        this.logger.error(`[BookingsService] findUserBookings - Provedor não encontrado para userId: ${userId}`);
        throw new NotFoundException('Provedor não encontrado.');
      }
      whereClause.providerId = provider.id;
    } else if (role === UserRole.ADMIN) {
      this.logger.log(`[BookingsService] findUserBookings - Usuário é ADMIN. Buscando todos os agendamentos.`);
    } else {
      this.logger.error(`[BookingsService] findUserBookings - Função de usuário inválida: ${role}`);
      throw new BadRequestException('Função de usuário inválida para buscar agendamentos.');
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<BookingWithDetailsRelations | null> {
    this.logger.log(`[BookingsService] findOne: Buscando agendamento por ID: ${id}`);
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        providerService: { include: { service: true } },
        review: true,
        address: true,
      },
    });
  }

  async updateStatus(id: string, newStatus: BookingStatus, userRole: UserRole): Promise<BookingWithDetailsRelations> {
    this.logger.log(`[BookingsService] updateStatus: Tentando atualizar agendamento ${id} para status ${newStatus} por role ${userRole}.`);
    // CORREÇÃO: Incluir 'provider' e 'providerService' para acessar suas propriedades
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
      throw new NotFoundException(`Agendamento com ID "${id}" não encontrado.`);
    }
    this.logger.log(`[BookingsService] updateStatus - Agendamento encontrado, status atual: ${booking.status}`);

    let canUpdate = false;
    let errorMessage = 'Transição de status não permitida.';

    if (userRole === UserRole.ADMIN) {
      canUpdate = true;
      this.logger.log(`[BookingsService] updateStatus - ADMIN bypass de transição para booking ${id}.`);
    } else if (userRole === UserRole.CLIENT) {
      if (newStatus === BookingStatus.CANCELED) {
        if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELED || booking.status === BookingStatus.REJECTED) {
          errorMessage = `Não é possível cancelar um agendamento com status "${booking.status}".`;
        } else {
          canUpdate = true;
        }
      } else {
        errorMessage = 'Clientes só podem cancelar agendamentos.';
      }
    } else if (userRole === UserRole.PROVIDER) {
      switch (booking.status) {
        case BookingStatus.PENDING:
          if (newStatus === BookingStatus.CONFIRMED || newStatus === BookingStatus.REJECTED) {
            canUpdate = true;
          } else {
            errorMessage = `Provedor só pode CONFIRMAR ou REJEITAR um agendamento PENDENTE.`;
          }
          break;
        case BookingStatus.CONFIRMED:
          if (newStatus === BookingStatus.IN_PROGRESS || newStatus === BookingStatus.COMPLETED || newStatus === BookingStatus.CANCELED || newStatus === BookingStatus.RESCHEDULED) {
            canUpdate = true;
          } else {
            errorMessage = `Provedor só pode iniciar, completar, cancelar ou reagendar um agendamento CONFIRMADO.`;
          }
          break;
        case BookingStatus.IN_PROGRESS:
          if (newStatus === BookingStatus.COMPLETED || newStatus === BookingStatus.CANCELED) {
            canUpdate = true;
          } else {
            errorMessage = `Provedor só pode COMPLETAR ou CANCELAR um agendamento EM PROGRESSO.`;
          }
          break;
        case BookingStatus.RESCHEDULED:
          if (newStatus === BookingStatus.CONFIRMED || newStatus === BookingStatus.CANCELED) {
            canUpdate = true;
          } else {
            errorMessage = `Provedor só pode CONFIRMAR ou CANCELAR um agendamento REAGENDADO.`;
          }
          break;
        case BookingStatus.COMPLETED:
        case BookingStatus.CANCELED:
        case BookingStatus.REJECTED:
          errorMessage = 'Não é possível alterar o status de um agendamento já finalizado, cancelado ou rejeitado.';
          break;
        default:
          errorMessage = 'Status de agendamento inválido ou transição não suportada.';
          break;
      }
    }

    if (!canUpdate) {
      this.logger.warn(`[BookingsService] updateStatus: Transição de status não permitida para booking ${id}: de ${booking.status} para ${newStatus} pelo role ${userRole}. Erro: ${errorMessage}`);
      throw new BadRequestException(errorMessage);
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

      // Send notification to client to request a review
      // CORREÇÃO: O booking.providerService.name e booking.provider.fullName só estarão disponíveis se incluídos
      // na consulta inicial do booking.
      const reviewNotificationMessage = `Seu serviço de ${booking.providerService.service.name} com ${booking.provider.fullName} foi concluído! Deixe uma avaliação para ele.`;
      const reviewNotificationTargetUrl = `/client/bookings/${booking.id}/review`; // Example URL
      await this.notificationsService.createNotification(
        booking.client.userId, // Usar booking.client.userId, que é o ID do User associado ao Client
        'REVIEW_REQUEST',
        reviewNotificationMessage,
        reviewNotificationTargetUrl
      );
      this.logger.log(`[BookingsService] updateStatus: Notificação de avaliação enviada para cliente ${booking.client.userId}.`);
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

  async cancelBooking(bookingId: string, userRole: UserRole): Promise<BookingWithDetailsRelations> { // Adicionado userRole
    // Implementação atualiza status para CANCELED
    // Certifique-se de que a lógica de updateStatus lida com o userRole corretamente
    return this.updateStatus(bookingId, BookingStatus.CANCELED, userRole);
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

  async reportIssue(bookingId: string, userId: string, userRole: UserRole, reason: string): Promise<BookingWithDetailsRelations> {
    this.logger.log(`[BookingsService] reportIssue: Usuário ${userId} (${userRole}) reportando problema no booking ${bookingId}. Motivo: ${reason}`);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, provider: true } // Include client and provider to check ownership
    });

    if (!booking) {
      throw new NotFoundException(`Agendamento com ID "${bookingId}" não encontrado.`);
    }

    // Only the client or provider associated with the booking can report an issue
    // CORREÇÃO: findClientByUserId e findByUserId retornam ProviderWithCalculatedRating/Client,
    // que têm o 'id' do Client/Provider, não o userId.
    // Você precisa comparar o ID do CLIENTE/PROVEDOR do booking com o ID do CLIENTE/PROVEDOR encontrado pelo userId.
    const client = await this.clientsService.findClientByUserId(userId);
    const provider = await this.providersService.findByUserId(userId);

    if (userRole === UserRole.CLIENT && booking.clientId !== client?.id) {
      throw new ForbiddenException('Você não tem permissão para reportar um problema neste agendamento.');
    }
    if (userRole === UserRole.PROVIDER && booking.providerId !== provider?.id) {
      throw new ForbiddenException('Você não tem permissão para reportar um problema neste agendamento.');
    }

    // Update booking status to PENDING_DISPUTE
    // Notify an admin (you) about the dispute
    await this.notificationsService.createNotification('ADMIN_USER_ID', 'BOOKING_DISPUTE', `Disputa aberta para agendamento ${bookingId}. Motivo: ${reason}`, `/admin/disputes/${bookingId}`); // Replace 'ADMIN_USER_ID' with actual admin ID
    return this.updateStatus(bookingId, BookingStatus.PENDING_DISPUTE, userRole);
  }
}