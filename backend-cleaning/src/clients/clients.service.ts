// src/clients/clients.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { Client, Prisma, User, Address, Booking, Review } from '@prisma/client'; // Adicione User, Address, Booking, Review para tipagem
import { ClientDashboardDto } from './dto/client-dashboard.dto';
import { UsersService } from '../users/users.service'; // Para acessar dados do User associado

// Adicione as importações das entidades (se ainda as estiver usando assim para DTOs)
import { BookingEntity } from '../bookings/entities/booking.entity';
import { ReviewEntity } from '../reviews/entities/review.entity';

// =========================================================================
// NOVO: Tipo Auxiliar para Cliente com Incluções Comuns (ClientWithIncludes)
// =========================================================================
export type ClientWithIncludes = Client & {
  user: User; // User completo (com avatarUrl agora, se o schema foi migrado)
  address: Address | null;
  completedBookingsCount: number; // Add this field
  bookings: Booking[]; // Ou se você incluir mais detalhes em bookings, atualize aqui
  reviewsMade: Review[]; // Ou se você incluir mais detalhes em reviewsMade, atualize aqui
  // Adicione _count se o Prisma retornar, ou remova se for calculado no DTO
  _count?: { bookings: number }; // Conforme seu DTO ClientDetailsDto
  createdAt: Date; // Necessário para consistência com o DTO de Perfil de Usuário
  updatedAt: Date; // Necessário para consistência com o DTO de Perfil de Usuário
};


@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService, // Injeta UsersService para buscar o User associado
  ) {}

  async findClientById(id: string): Promise<ClientWithIncludes | null> { // Use o novo tipo
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        user: true, // Inclui o user completo
        _count: { select: { bookings: true } }, // Include count for bookings
        address: true,
        bookings: true,
        reviewsMade: true,
      },
    });
    return client as ClientWithIncludes | null; // Cast para o tipo correto
  }

  async findClientByUserId(userId: string): Promise<ClientWithIncludes | null> { // Use o novo tipo
    const client = await this.prisma.client.findUnique({
      where: { userId },
      include: {
        user: true, // Inclui o user completo
        _count: { select: { bookings: true } }, // Include count for bookings
        address: true,
        bookings: true,
        reviewsMade: true,
      },
    });
    return client as ClientWithIncludes | null; // Cast para o tipo correto
  }

  async updateClient(clientId: string, updateClientProfileDto: UpdateClientProfileDto): Promise<ClientWithIncludes> { // Retorno atualizado
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException(`Cliente com ID "${clientId}" não encontrado.`);
    }

    try {
      const updatedClient = await this.prisma.client.update({ // Captura o resultado da atualização
        where: { id: clientId },
        data: {
          fullName: updateClientProfileDto.fullName,
          phone: updateClientProfileDto.phone,
          // completedBookingsCount is updated in bookings.service.ts
          // Você pode querer atualizar o endereço aqui também, se o DTO permitir
          // address: updateClientProfileDto.address ? {
          //   upsert: {
          //     create: updateClientProfileDto.address,
          //     update: updateClientProfileDto.address,
          //   }
          // } : undefined,
        },
        include: { user: true, address: true, bookings: true, reviewsMade: true }, // Inclua as relações para o retorno
      });
      return updatedClient as ClientWithIncludes;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record not found
          throw new NotFoundException(`Cliente com ID "${clientId}" não encontrado.`);
        }
      }
      throw error;
    }
  }

  async getClientDashboardData(clientId: string): Promise<ClientDashboardDto> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: true,
        bookings: {
          orderBy: { scheduledDate: 'desc' },
          include: { provider: true, providerService: true, review: true },
        },
        reviewsMade: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Cliente com ID "${clientId}" não encontrado.`);
    }

    const pendingBookings = client.bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED');
    const completedBookings = client.bookings.filter(b => b.status === 'COMPLETED');

    const nextBooking = pendingBookings.length > 0 ? pendingBookings[0] : undefined;
    const recentBookings = client.bookings.slice(0, 5);

    const popularServices = [
      { name: 'Limpeza Padrão', bookingsCount: 150 },
      { name: 'Limpeza Pesada', bookingsCount: 80 },
    ];

    const pendingReviews = client.bookings.filter(b => b.status === 'COMPLETED' && !b.review).map(b => ({
      id: b.id, // ID do agendamento, não da review
      bookingId: b.id,
      clientId: b.clientId,
      providerId: b.providerId,
      rating: null,
      comment: null,
      createdAt: b.updatedAt,
    })) as ReviewEntity[];

    return {
      fullName: client.fullName,
      pendingBookingsCount: pendingBookings.length,
      completedBookingsCount: completedBookings.length,
      nextBooking: nextBooking ? (nextBooking as unknown as BookingEntity) : undefined,
      recentBookings: recentBookings.map(b => b as unknown as BookingEntity),
      popularServices,
      pendingReviews,
    };
  }
}