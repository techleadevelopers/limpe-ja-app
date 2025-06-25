// dashboard.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { BookingsService } from '../bookings/bookings.service';
import { EarningsService } from '../earnings/earnings.service';
import { ReviewsService } from '../reviews/reviews.service'; // Adicione esta linha
import { DashboardDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private providersService: ProvidersService,
    private bookingsService: BookingsService,
    private earningsService: EarningsService,
    private reviewsService: ReviewsService, // Injete o ReviewsService
  ) {}

  async getDashboardData(userId: string): Promise<DashboardDto> { // userId é o ID do usuário
    this.logger.log(`[DashboardService] getDashboardData: Iniciando busca para userId: ${userId}`);

    // PRIMEIRO PASSO: Encontrar o provedor pelo userId (CORRETO)
    const provider = await this.providersService.findByUserId(userId);

    if (!provider) {
      this.logger.error(`[DashboardService] getDashboardData: PROVEDOR NÃO ENCONTRADO APÓS CHAMADA A findByUserId para userId: ${userId}. Isso não deveria acontecer se o provedor existe.`);
      throw new NotFoundException('Provedor não encontrado.');
    }
    this.logger.log(`[DashboardService] getDashboardData: Provedor encontrado: ${provider.fullName} (ID: ${provider.id}, userId: ${provider.userId})`);

    // SEGUNDO PASSO: Buscar agendamentos futuros (passando o provider.id, que é o que bookingsService espera para agendamentos)
    this.logger.log(`[DashboardService] getDashboardData: Buscando agendamentos futuros para provider.id: ${provider.id}`);
    const upcomingBookings = await this.bookingsService.findUpcomingBookings(provider.id);
    this.logger.log(`[DashboardService] getDashboardData: Agendamentos futuros encontrados: ${upcomingBookings.length}`);

    // TERCEIRO PASSO: Buscar sumário de ganhos (Passando o userId original, pois earningsService.getEarnings espera um userId)
    this.logger.log(`[DashboardService] getDashboardData: Buscando sumário de ganhos para userId: ${userId}`);
    const earningsSummary = await this.earningsService.getEarnings(userId);
    this.logger.log(`[DashboardService] getDashboardData: Sumário de ganhos encontrado.`);

    // NOVO PASSO: Buscar avaliações recentes para o provedor
    this.logger.log(`[DashboardService] getDashboardData: Buscando avaliações recentes para provider.id: ${provider.id}`);
    const recentReviews = await this.reviewsService.findRecentReviewsByProviderId(provider.id); // Chame um método para buscar avaliações
    this.logger.log(`[DashboardService] getDashboardData: Avaliações recentes encontradas: ${recentReviews.length}`);

    this.logger.log(`[DashboardService] getDashboardData: Retornando dados do dashboard.`);
    return {
      fullName: provider.fullName,
      upcomingBookings,
      totalEarnings: earningsSummary.totalEarnings,
      pendingWithdrawals: earningsSummary.pendingWithdrawals,
      reviews: recentReviews, // Inclua as avaliações no DTO retornado
    };
  }
}