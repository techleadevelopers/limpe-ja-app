// dashboard.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ProvidersService, ProviderWithIncludes } from '../providers/providers.service'; // Importar ProviderWithIncludes
import { BookingsService } from '../bookings/bookings.service';
import { EarningsService } from '../earnings/earnings.service';
import { ReviewsService } from '../reviews/reviews.service';
import { DashboardDto } from './dto/dashboard.dto';
import { BookingDetailsDto } from '../bookings/dto/booking-details.dto';

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
    this.logger.log(`[DashboardService] getDashboardData: Iniciando busca para userId: ${userId}`);

    // PRIMEIRO PASSO: Encontrar o provedor pelo userId (CORRETO)
    // provider agora será do tipo ProviderWithIncludes, que possui userId
    const provider = await this.providersService.findByUserId(userId);

    if (!provider) {
      this.logger.error(`[DashboardService] getDashboardData: PROVEDOR NÃO ENCONTRADO APÓS CHAMADA A findByUserId para userId: ${userId}. Isso não deveria acontecer se o provedor existe.`);
      throw new NotFoundException('Provedor não encontrado.');
    }
    // A propriedade userId agora existe em 'provider'
    this.logger.log(`[DashboardService] getDashboardData: Provedor encontrado: ${provider.fullName} (ID: ${provider.id}, userId: ${provider.userId})`);

    // SEGUNDO PASSO: Buscar agendamentos futuros (passando o provider.id, que é o que bookingsService espera para agendamentos)
    this.logger.log(`[DashboardService] getDashboardData: Buscando agendamentos futuros para provider.id: ${provider.id}`);
    const upcomingBookingsRaw = await this.bookingsService.findUpcomingBookings(provider.id);
    this.logger.log(`[DashboardService] getDashboardData: Agendamentos futuros encontrados: ${upcomingBookingsRaw.length}`);

    const upcomingBookings = upcomingBookingsRaw.map(
      (booking) => new BookingDetailsDto(booking),
    );

    // TERCEIRO PASSO: Buscar sumário de ganhos (Passando o userId original, pois earningsService.getEarnings espera um userId)
    this.logger.log(`[DashboardService] getDashboardData: Buscando sumário de ganhos para userId: ${userId}`);
    const earningsSummary = await this.earningsService.getEarnings(userId);
    this.logger.log(`[DashboardService] getDashboardData: Sumário de ganhos encontrado.`);

    // NOVO PASSO: Buscar avaliações recentes para o provedor
    this.logger.log(`[DashboardService] getDashboardData: Buscando avaliações recentes para provider.id: ${provider.id}`);
    const recentReviews = await this.reviewsService.findRecentReviewsByProviderId(provider.id);
    this.logger.log(`[DashboardService] getDashboardData: Avaliações recentes encontradas: ${recentReviews.length}`);

    this.logger.log(`[DashboardService] getDashboardData: Retornando dados do dashboard.`);
    return {
      fullName: provider.fullName,
      upcomingBookings,
      totalEarnings: earningsSummary.totalEarnings,
      pendingWithdrawals: earningsSummary.pendingWithdrawals,
      reviews: recentReviews,
      fiveStarReviewCount: provider.fiveStarReviewCount, // Include new field
      monthlyBookingsCount: provider.monthlyBookingsCount, // Include new field
    };
  }
}
