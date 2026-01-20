import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { BookingDetailsDto } from '../bookings/dto/booking-details.dto';

type LiveProviderWithRelations = Prisma.ProviderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        fullName: true;
        phone: true;
      };
    };
    address: true;
  };
}>;

export interface LiveStatusPayload {
  providers: LiveProviderWithRelations[];
  confirmedBookings: BookingDetailsDto[];
  activeBookings: BookingDetailsDto[];
}

@Injectable()
export class LiveStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
  ) {}

  async getLiveStatus(): Promise<LiveStatusPayload> {
    const providersPromise = this.fetchProviders();
    const confirmedPromise = this.fetchBookingsByStatus(
      BookingStatus.CONFIRMED,
    );
    const activePromise = this.fetchBookingsByStatus(BookingStatus.STARTED);

    const [providers, confirmedBookings, activeBookings] = await Promise.all([
      providersPromise,
      confirmedPromise,
      activePromise,
    ]);

    return {
      providers,
      confirmedBookings,
      activeBookings,
    };
  }

  private fetchProviders(): Promise<LiveProviderWithRelations[]> {
    return this.prisma.provider.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        address: true,
      },
    });
  }

  private async fetchBookingsByStatus(
    status: BookingStatus,
  ): Promise<BookingDetailsDto[]> {
    const bookings = await this.bookingsService.findUserBookings(
      'live-status',
      UserRole.ADMIN,
      status,
    );
    return bookings.map((booking) => new BookingDetailsDto(booking));
  }
}
