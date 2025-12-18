// src/clients/clients.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common'; // Adicionado Logger
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { Client, Prisma, User, Address, Booking, Review } from '@prisma/client';
import { ClientDashboardDto } from './dto/client-dashboard.dto';
import { UsersService } from '../users/users.service';

import { BookingEntity } from '../bookings/entities/booking.entity';
import { ReviewEntity } from '../reviews/entities/review.entity';
import { geocodeAddress } from '../utils/geocoding.service';

export type ClientWithIncludes = Client & {
  user: User;
  address: Address | null;
  completedBookingsCount: number; // Adicionado do schema.prisma
  noShowCount: number; // Adicionado do schema.prisma
  cancellationCount: number; // Adicionado do schema.prisma
  bookings: Booking[];
  reviewsMade: Review[];
  _count?: { bookings: number };
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name); // Instancia o logger

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  private buildAddressString(address?: Partial<Address>): string | null {
    if (!address) return null;
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      address.cep,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  private applyGeocodeFallback(
    address: Partial<Address>,
    geocoded?: { latitude: number; longitude: number } | null,
  ): { latitude?: number; longitude?: number } {
    const latitude =
      address.latitude !== undefined ? address.latitude : geocoded?.latitude;
    const longitude =
      address.longitude !== undefined ? address.longitude : geocoded?.longitude;
    return { latitude, longitude };
  }

  private async updateAddressLocationPoint(
    addressId: string,
    latitude?: number,
    longitude?: number,
  ) {
    if (!addressId || latitude === undefined || longitude === undefined) return;
    await this.prisma.$executeRaw`
      UPDATE "Address"
      SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      WHERE id = ${addressId};
    `;
  }

  async findClientById(id: string): Promise<ClientWithIncludes | null> {
    this.logger.log(
      `[ClientsService] findClientById: Buscando cliente por ID: ${id}`,
    );
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        user: true,
        _count: { select: { bookings: true } },
        address: true,
        bookings: true,
        reviewsMade: true,
      },
    });
    if (!client) {
      this.logger.warn(
        `[ClientsService] findClientById: Cliente com ID "${id}" não encontrado.`,
      );
    }
    return client as ClientWithIncludes | null;
  }

  async findClientByUserId(userId: string): Promise<ClientWithIncludes | null> {
    this.logger.log(
      `[ClientsService] findClientByUserId: Buscando cliente por userId: ${userId}`,
    );
    const client = await this.prisma.client.findUnique({
      where: { userId },
      include: {
        user: true,
        _count: { select: { bookings: true } },
        address: true,
        bookings: true,
        reviewsMade: true,
      },
    });
    if (!client) {
      this.logger.warn(
        `[ClientsService] findClientByUserId: Cliente para userId "${userId}" não encontrado.`,
      );
    }
    return client as ClientWithIncludes | null;
  }

  async updateClient(
    clientId: string,
    updateClientProfileDto: UpdateClientProfileDto,
  ): Promise<ClientWithIncludes> {
    this.logger.log(
      `[ClientsService] updateClient: Atualizando cliente com ID: ${clientId}`,
    );
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException(
        `Cliente com ID "${clientId}" nALo encontrado.`,
      );
    }

    let finalLatitude: number | undefined;
    let finalLongitude: number | undefined;
    let addressUpsert: Prisma.AddressUpsertWithoutClientInput | undefined;

    if (updateClientProfileDto.address) {
      const addressString = this.buildAddressString(
        updateClientProfileDto.address as Partial<Address>,
      );
      const geo = addressString ? await geocodeAddress(addressString) : null;
      const coords = this.applyGeocodeFallback(
        updateClientProfileDto.address as Partial<Address>,
        geo,
      );
      finalLatitude = coords.latitude;
      finalLongitude = coords.longitude;
      const addressPayload = { ...updateClientProfileDto.address } as any;
      if (finalLatitude !== undefined) addressPayload.latitude = finalLatitude;
      if (finalLongitude !== undefined)
        addressPayload.longitude = finalLongitude;
      addressUpsert = {
        create: addressPayload,
        update: addressPayload,
      };
    }

    try {
      const updatedClient = await this.prisma.client.update({
        where: { id: clientId },
        data: {
          fullName: updateClientProfileDto.fullName,
          phone: updateClientProfileDto.phone,
          // noShowCount e cancellationCount sALo atualizados no BookingsService
          address: addressUpsert ? { upsert: addressUpsert } : undefined,
        },
        include: {
          user: true,
          address: true,
          bookings: true,
          reviewsMade: true,
        },
      });
      this.logger.log(
        `[ClientsService] updateClient: Cliente ${clientId} atualizado com sucesso.`,
      );
      // Telemetria: client_profile_updated
      this.logger.log(
        `[TELEMETRY] client_profile_updated: { clientId: ${clientId} }`,
      );
      if (
        updatedClient.address?.id &&
        finalLatitude !== undefined &&
        finalLongitude !== undefined
      ) {
        await this.updateAddressLocationPoint(
          updatedClient.address.id,
          finalLatitude,
          finalLongitude,
        );
      }
      return updatedClient as ClientWithIncludes;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Cliente com ID "${clientId}" nALo encontrado.`,
          );
        }
      }
      this.logger.error(
        `[ClientsService] updateClient: Erro ao atualizar cliente ${clientId}: ${error.message}`,
      );
      throw error;
    }
  }

  async getClientDashboardData(clientId: string): Promise<ClientDashboardDto> {
    this.logger.log(
      `[ClientsService] getClientDashboardData: Buscando dados de dashboard para cliente ${clientId}.`,
    );
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
      throw new NotFoundException(
        `Cliente com ID "${clientId}" não encontrado.`,
      );
    }

    const pendingBookings = client.bookings.filter(
      (b) => b.status === 'PENDING' || b.status === 'CONFIRMED',
    );
    const completedBookings = client.bookings.filter(
      (b) => b.status === 'FINISHED',
    );

    const nextBooking =
      pendingBookings.length > 0 ? pendingBookings[0] : undefined;
    const recentBookings = client.bookings.slice(0, 5);

    const popularServices = [
      { name: 'Limpeza Padrão', bookingsCount: 150 },
      { name: 'Limpeza Pesada', bookingsCount: 80 },
    ];

    const pendingReviews = client.bookings
      .filter((b) => b.status === 'FINISHED' && !b.review)
      .map((b) => ({
        id: b.id,
        bookingId: b.id,
        clientId: b.clientId,
        providerId: b.providerId,
        rating: null,
        comment: null,
        createdAt: b.updatedAt,
      })) as ReviewEntity[];

    this.logger.log(
      `[ClientsService] getClientDashboardData: Dados de dashboard para cliente ${clientId} gerados.`,
    );
    return {
      fullName: client.fullName,
      pendingBookingsCount: pendingBookings.length,
      completedBookingsCount: completedBookings.length,
      nextBooking: nextBooking
        ? (nextBooking as unknown as BookingEntity)
        : undefined,
      recentBookings: recentBookings.map((b) => b as unknown as BookingEntity),
      popularServices,
      pendingReviews,
    };
  }
}
