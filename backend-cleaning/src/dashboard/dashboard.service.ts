// dashboard.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { BookingsService } from '../bookings/bookings.service';
import { EarningsService } from '../earnings/earnings.service';
import { ReviewsService } from '../reviews/reviews.service';
import { DashboardDto } from './dto/dashboard.dto';
import { BookingViewDto } from '../bookings/dto/booking-view.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private providersService: ProvidersService,
    private bookingsService: BookingsService,
    private earningsService: EarningsService,
    private reviewsService: ReviewsService,
  ) {}

  async getDashboardData(userId: string): Promise<DashboardDto> {
    this.logger.log(
      `[DashboardService] getDashboardData: Iniciando busca para userId: ${userId}`,
    );

    const providerPromise = this.providersService.findByUserId(userId);
    const earningsPromise = this.earningsService
      .getEarnings(userId)
      .catch((error) => {
        this.logger.error(
          `[DashboardService] getDashboardData: Falha ao buscar ganhos para userId ${userId}: ${error?.message || error}`,
          error?.stack,
        );
        return { totalEarnings: 0, pendingWithdrawals: 0 };
      });
    const reviewsPromise = providerPromise
      .then((provider) => {
        if (!provider) {
          return [];
        }
        return this.reviewsService.findRecentReviewsByProviderId(provider.id);
      })
      .catch((error) => {
        this.logger.error(
          `[DashboardService] getDashboardData: Falha ao buscar avaliações recentes para userId ${userId}: ${error?.message || error}`,
          error?.stack,
        );
        return [];
      });

    const [provider, earningsSummary, recentReviews] = await Promise.all([
      providerPromise,
      earningsPromise,
      reviewsPromise,
    ]);

    if (!provider) {
      this.logger.error(
        `[DashboardService] getDashboardData: PROVEDOR NÃO ENCONTRADO APÓS CHAMADA A findByUserId para userId: ${userId}. Isso não deveria acontecer se o provedor existe.`,
      );
      throw new NotFoundException('Provedor não encontrado.');
    }

    this.logger.log(
      `[DashboardService] getDashboardData: Provedor encontrado: ${provider.fullName} (ID: ${provider.id}, userId: ${provider.userId})`,
    );
    this.logger.log(
      `[DashboardService] getDashboardData: Sumário de ganhos obtido para userId: ${userId}.`,
    );

    let upcomingBookingsRaw = [];
    try {
      upcomingBookingsRaw = await this.bookingsService.findUpcomingBookings(
        provider.id,
      );
    } catch (error) {
      this.logger.error(
        `[DashboardService] getDashboardData: Falha ao buscar agendamentos futuros para providerId ${provider.id}: ${error?.message || error}`,
        error?.stack,
      );
      upcomingBookingsRaw = [];
    }
    this.logger.log(
      `[DashboardService] getDashboardData: Agendamentos futuros encontrados: ${upcomingBookingsRaw.length}`,
    );

    const upcomingBookings = upcomingBookingsRaw.map((booking) =>
      new BookingViewDto(booking, { userRole: UserRole.PROVIDER }),
    );

    this.logger.log(
      `[DashboardService] getDashboardData: Avaliações recentes encontradas: ${recentReviews.length}`,
    );
    this.logger.log(
      `[DashboardService] getDashboardData: Retornando dados do dashboard.`,
    );

    return {
      fullName: provider.fullName,
      upcomingBookings,
      totalEarnings: earningsSummary.totalEarnings,
      pendingWithdrawals: earningsSummary.pendingWithdrawals,
      reviews: recentReviews,
      fiveStarReviewCount: provider.fiveStarReviewCount,
      monthlyBookingsCount: provider.monthlyBookingsCount,
    };
  }
}
