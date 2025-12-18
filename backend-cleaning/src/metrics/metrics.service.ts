// src/metrics/metrics.service.ts

import { Injectable } from '@nestjs/common';
import { CustomerMetricsQueryDto } from './dto/customer-metrics.query.dto';
import { BookingsMetricsRepository } from './repositories/bookings.metrics.repo';
import { PaymentsMetricsRepository } from './repositories/payments.metrics.repo';
import { ReviewsMetricsRepository } from './repositories/reviews.metrics.repo';
import { PrivacyPolicy } from './policies/privacy.policy'; // Para LGPD

@Injectable()
export class MetricsService {
  constructor(
    private readonly bookingsRepo: BookingsMetricsRepository,
    private readonly paymentsRepo: PaymentsMetricsRepository,
    private readonly reviewsRepo: ReviewsMetricsRepository,
    private readonly privacyPolicy: PrivacyPolicy, // Injetar a política de privacidade
  ) {}

  async getCustomerSummary(userId: string, query: CustomerMetricsQueryDto) {
    this.privacyPolicy.ensureUserAccess(userId); // Garante que o usuário só acesse seus próprios dados

    const { from, to } = query;

    const totalBookings = await this.bookingsRepo.countBookings(
      userId,
      from,
      to,
    );
    const completedBookings = await this.bookingsRepo.countBookings(
      userId,
      from,
      to,
      'FINISHED',
    );
    // CORREÇÃO AQUI: 'CANCELED_BY_CUSTOMER' foi alterado para 'CANCELED'
    const canceledBookings = await this.bookingsRepo.countBookings(
      userId,
      from,
      to,
      'CANCELED',
    );
    const avgRating = await this.reviewsRepo.getAverageRating(userId, from, to);
    const totalSpentCents = await this.paymentsRepo.getTotalSpent(
      userId,
      from,
      to,
    );

    // TODO: Implement repeat_rate logic if needed, possibly based on multiple bookings over time

    return {
      total_bookings: totalBookings,
      completed_bookings: completedBookings,
      canceled_bookings: canceledBookings,
      avg_rating: avgRating,
      total_spent_centavos: totalSpentCents,
      repeat_rate: 0, // Placeholder
    };
  }

  async getCustomerTimeseries(userId: string, query: CustomerMetricsQueryDto) {
    this.privacyPolicy.ensureUserAccess(userId);

    const { from, to, granularity, metric } = query;

    if (metric === 'bookings') {
      return this.bookingsRepo.getBookingCountsByGranularity(
        userId,
        from,
        to,
        granularity,
      );
    } else if (metric === 'spent') {
      return this.paymentsRepo.getTotalSpentByGranularity(
        userId,
        from,
        to,
        granularity,
      );
    }
    // Adicionar outros tipos de métricas conforme necessário
    return [];
  }

  async getCustomerFunnel(userId: string) {
    this.privacyPolicy.ensureUserAccess(userId);

    // Este é um exemplo simplificado. Em um sistema real, você coletaria esses eventos
    // de logs de eventos ou de um sistema de analytics.
    // Aqui, estamos simulando com base nos dados existentes (bookings, payments).

    const totalSearches = await this.bookingsRepo.countBookings(userId); // Proxy: count all bookings ever initiated
    const totalViewProviders = totalSearches; // Proxy: assume every search leads to view (needs real event tracking)
    const totalStartCheckout = await this.bookingsRepo.countBookings(
      userId,
      undefined,
      undefined,
      undefined,
      true,
    ); // Proxy: bookings with payment intent
    const totalPaymentInitiated =
      await this.paymentsRepo.countPaymentIntents(userId);
    const totalPaid = await this.paymentsRepo.countPaidPayments(userId);
    const totalCompleted = await this.bookingsRepo.countBookings(
      userId,
      undefined,
      undefined,
      'FINISHED',
    );

    return {
      search: totalSearches,
      view_provider: totalViewProviders,
      start_checkout: totalStartCheckout,
      payment_initiated: totalPaymentInitiated,
      paid: totalPaid,
      completed: totalCompleted,
    };
  }
}
