// src/bookings/bookings.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common'; // Adicionado Logger
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking, BookingStatus, UserRole, Prisma } from '@prisma/client'; // BookingStatus já importado
import { ClientsService } from '../clients/clients.service';
import { ProvidersService } from '../providers/providers.service';
import { ProviderServicesService } from '../provider-services/provider-services.service';
import { BookingEntity } from './entities/booking.entity';
import { PaymentsService } from '../payments/payments.service';
import { PixChargeResponseDto } from '../payments/dto/create-pix-charge.dto';

// Define um tipo para Booking com as relações exatas que o BookingDetailsDto espera
type BookingWithDetailsRelations = Prisma.BookingGetPayload<{
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
  private readonly logger = new Logger(BookingsService.name); // Instanciar Logger

  constructor(
    private prisma: PrismaService,
    private clientsService: ClientsService,
    private providersService: ProvidersService,
    private providerServicesService: ProviderServicesService,
    private paymentsService: PaymentsService,
  ) {}

  async create(clientUserId: string, createBookingDto: CreateBookingDto): Promise<BookingWithDetailsRelations> {
    this.logger.log(`[BookingsService] create - Início da criação do agendamento.`);
    this.logger.log(`[BookingsService] create - clientUserId: ${clientUserId}`);
    this.logger.log(`[BookingsService] create - DTO recebido: providerId=${createBookingDto.providerId}, providerServiceId=${createBookingDto.providerServiceId}, scheduledDate=${createBookingDto.scheduledDate}, scheduledTime=${createBookingDto.scheduledTime}, totalPrice=${createBookingDto.totalPrice}`);
    this.logger.log(`[BookingsService] create - Endereço DTO: ${JSON.stringify(createBookingDto.address)}`);


    const client = await this.clientsService.findClientByUserId(clientUserId);
    if (!client) {
      this.logger.error(`[BookingsService] create - Cliente não encontrado para userId: ${clientUserId}`);
      throw new NotFoundException('Cliente não encontrado.');
    }
    this.logger.log(`[BookingsService] create - Cliente encontrado: ${client.id}`);


    const provider = await this.providersService.findOne(createBookingDto.providerId); // findOne espera providerId
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
    this.logger.log(`[BookingsService] create - Serviço do provedor encontrado: ${providerService.id}`);


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
          scheduledDate: new Date(createBookingDto.scheduledDate),
          scheduledTime: createBookingDto.scheduledTime,
          totalPrice: new Prisma.Decimal(createBookingDto.totalPrice),
          notes: createBookingDto.notes,
          status: BookingStatus.PENDING,
          addressId: newAddress.id, // Conecta o endereço usando addressId
        } as any, // Mantenha o type assertion se necessário
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

    } catch (error: any) { // Capture como 'any' para acessar 'response?.data' ou 'message'
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
    createBookingDto: CreateBookingDto, // Contém o providerId original
  ): Promise<{ booking: BookingWithDetailsRelations, pixCharge: PixChargeResponseDto }> {
    this.logger.log(`[BookingsService] createBookingAndPixCharge - Início da operação combinada.`);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - clientUserId: ${clientUserId}`);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - DTO de criação original recebido: ${JSON.stringify(createBookingDto)}`);

    const booking = await this.create(clientUserId, createBookingDto);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - Agendamento criado com sucesso (ID: ${booking.id}).`);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - Booking object retornado por 'create': ${JSON.stringify(booking, null, 2)}`); // Este log irá confirmar o valor de booking.providerId

    const pixChargeDto = {
      amount: booking.totalPrice.toNumber(),
      description: `Pagamento para o serviço de limpeza agendado (ID: ${booking.id})`,
      bookingId: booking.id,
      providerId: booking.providerId, // <<<< CORREÇÃO FINAL APLICADA AQUI: Usando booking.providerId >>>>
    };
    this.logger.log(`[BookingsService] createBookingAndPixCharge - PIX Charge DTO para PaymentsService (antes da chamada): ${JSON.stringify(pixChargeDto)}`);


    const pixChargeResponse = await this.paymentsService.createPixCharge(clientUserId, pixChargeDto);
    this.logger.log(`[BookingsService] createBookingAndPixCharge - Resposta PIX Charge recebida: ${JSON.stringify(pixChargeResponse)}`);

    return { booking, pixCharge: pixChargeResponse };
  }

  // CORREÇÃO AQUI: O parâmetro 'status' que vem do controller (geralmente query params)
  // pode ser uma string, mas Prisma espera o ENUM.
  async findUserBookings(userId: string, role: UserRole, status?: string): Promise<BookingWithDetailsRelations[]> {
    this.logger.log(`[BookingsService] findUserBookings: Buscando agendamentos para userId: ${userId}, role: ${role}, status: ${status || 'todos'}`);
    let whereClause: Prisma.BookingWhereInput = {}; // Usar tipo específico do Prisma para 'where'

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
      // Admin pode ver todos os agendamentos, sem filtro de userId
      this.logger.log(`[BookingsService] findUserBookings - Usuário é ADMIN. Buscando todos os agendamentos.`);
    } else {
      this.logger.error(`[BookingsService] findUserBookings - Função de usuário inválida: ${role}`);
      throw new BadRequestException('Função de usuário inválida para buscar agendamentos.');
    }

    if (status) {
      // Validar e converter a string de status para o enum BookingStatus
      const validBookingStatus = Object.values(BookingStatus).find(s => s === status);
      if (validBookingStatus) {
        whereClause.status = validBookingStatus;
        this.logger.log(`[BookingsService] findUserBookings: Filtrando por status válido: ${validBookingStatus}`);
      } else {
        this.logger.warn(`[BookingsService] findUserBookings: Status inválido recebido: "${status}". Ignorando filtro de status.`);
        // Dependendo da sua regra de negócio, você pode lançar um erro ou ignorar o status inválido.
        // throw new BadRequestException(`Status de agendamento inválido: ${status}`);
      }
    }

    this.logger.log(`[BookingsService] findUserBookings: Cláusula WHERE final: ${JSON.stringify(whereClause)}`);

    return this.prisma.booking.findMany({
      where: whereClause,
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
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
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      this.logger.error(`[BookingsService] updateStatus - Agendamento com ID "${id}" não encontrado.`);
      throw new NotFoundException(`Agendamento com ID "${id}" não encontrado.`);
    }
    this.logger.log(`[BookingsService] updateStatus - Agendamento encontrado, status atual: ${booking.status}`);


    if (userRole !== UserRole.ADMIN) {
      if (userRole === UserRole.CLIENT) {
        if (newStatus !== BookingStatus.CANCELED) {
          throw new ForbiddenException('Clientes só podem cancelar agendamentos.');
        }
        if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELED) {
          throw new BadRequestException(`Não é possível cancelar um agendamento com status "${booking.status}".`);
        }
      } else if (userRole === UserRole.PROVIDER) {
        if (
          (booking.status === BookingStatus.PENDING && newStatus === BookingStatus.CONFIRMED) ||
          (booking.status === BookingStatus.CONFIRMED && newStatus === BookingStatus.COMPLETED) ||
          (newStatus === BookingStatus.CANCELED) ||
          (newStatus === BookingStatus.RESCHEDULED)
        ) {
          if ((newStatus === BookingStatus.CANCELED || newStatus === BookingStatus.RESCHEDULED) &&
              (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELED)
          ) {
            throw new BadRequestException(`Não é possível ${newStatus === BookingStatus.CANCELED ? 'cancelar' : 'reagendar'} um agendamento com status "${booking.status}".`);
          }
        } else {
          throw new BadRequestException(`Transição de status de "${booking.status}" para "${newStatus}" não permitida para provedores.`);
        }
      }
    }
    this.logger.log(`[BookingsService] updateStatus - Status de agendamento validado. Atualizando no DB.`);

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

  async findUpcomingBookings(providerId: string): Promise<BookingEntity[]> {
    this.logger.log(`[BookingsService] findUpcomingBookings: Buscando agendamentos futuros para providerId: ${providerId}`);
    const now = new Date();
    // Para comparar apenas a data (sem hora), setamos para o início do dia
    now.setHours(0, 0, 0, 0); 

    const upcomingPrismaBookings = await this.prisma.booking.findMany({
      where: {
        providerId: providerId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.RESCHEDULED],
        },
        scheduledDate: {
          gte: now, // Filtra agendamentos a partir de hoje (início do dia)
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

    // Filtra em memória para garantir que horários no dia atual que já passaram não sejam incluídos.
    const filteredBookings = upcomingPrismaBookings.filter(booking => {
      const bookingDateTime = new Date(booking.scheduledDate);
      const [hours, minutes] = booking.scheduledTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const currentDateTime = new Date(); // Obtém a data e hora atual para comparação
      currentDateTime.setSeconds(0, 0); // Ignora segundos e milissegundos para comparação precisa

      // Se a data do agendamento é hoje, então o horário do agendamento deve ser >= ao horário atual
      if (bookingDateTime.toDateString() === currentDateTime.toDateString()) {
        return bookingDateTime >= currentDateTime;
      }
      // Se a data do agendamento é futura, sempre incluir
      return true;
    });
    this.logger.log(`[BookingsService] findUpcomingBookings: Encontrados ${filteredBookings.length} agendamentos futuros após filtragem final.`);
    return filteredBookings.map(booking => new BookingEntity(booking));
  }
}