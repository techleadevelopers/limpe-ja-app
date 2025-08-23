// src/metrics/metrics.module.ts

import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { BookingsMetricsRepository } from './repositories/bookings.metrics.repo';
import { PaymentsMetricsRepository } from './repositories/payments.metrics.repo';
import { ReviewsMetricsRepository } from './repositories/reviews.metrics.repo';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // Para usar JwtAuthGuard
import { PrivacyPolicy } from './policies/privacy.policy'; // Importe a classe PrivacyPolicy

@Module({
  imports: [PrismaModule, AuthModule], // PrismaModule para acesso ao DB, AuthModule para guards
  controllers: [MetricsController],
  providers: [
    MetricsService,
    BookingsMetricsRepository,
    PaymentsMetricsRepository,
    ReviewsMetricsRepository,
    PrivacyPolicy, // <-- Adicione PrivacyPolicy aqui para que seja injetável
  ],
  exports: [MetricsService], // Se MetricsService for usado por outros módulos
})
export class MetricsModule {}