// src/app.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Mantenha para injeção em forRootAsync
import { UsersModule } from './users/users.module';
import { ProvidersModule } from './providers/providers.module';
import { ClientsModule } from './clients/clients.module';
import { ServicesModule } from './services/services.module';
import { ProviderServicesModule } from './provider-services/provider-services.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OffersModule } from './offers/offers.module';
import { PaymentsModule } from './payments/payments.module';
import { SearchModule } from './search/search.module';
import { VerificationModule } from './verification/verification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EarningsModule } from './earnings/earnings.module';
import { FaqsModule } from './faqs/faqs.module';
import { CacheModule } from './cache/cache.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SafetyModule } from './safety/safety.module';
import { CouponsModule } from './coupons/coupons.module';
import { GuaranteeModule } from './guarantee/guarantee.module';
import { PricingModule } from './pricing/pricing.module';
import { PayoutsModule } from './payouts/payouts.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SettingsModule } from './settings/settings.module';
import { UploadModule } from './upload/upload.module';

// NOVO: Import do ConfigModule customizado (centraliza configuration e validationSchema)
import { ConfigModule as CustomConfigModule } from './config/config.module';

// Sentry
import { SentryModule } from '@sentry/nestjs/setup';

// Loyalty e Ranking
import { LoyaltyModule } from './loyalty/loyalty.module';
import { RankingModule } from './ranking/ranking.module';

// 🔹 MISSIONS
import { MissionsModule } from './missions/missions.module';
// 🔹 DISPUTES
import { DisputeModule } from './disputes/dispute.module';

// NOVO: Módulos para os novos recursos
import { LocksModule } from './common/locks/locks.module'; // NOVO: Módulo de Lock Distribuído
import { MetricsModule } from './metrics/metrics.module'; // NOVO: Módulo de Métricas
import { SupportModule } from './support/support.module'; // NOVO: Módulo de Suporte

// NOVO: Import do AdminModule (ajuste o path se necessário)
import { AdminModule } from './admin/admin.module';

// Import do QueuesModule SEM forwardRef no import (forwardRef é de common)
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    // NOVO: Use o ConfigModule customizado (substitui o forRoot direto)
    CustomConfigModule,

    // ThrottlerModule ajustado para usar as configs de configuration.ts
    ThrottlerModule.forRootAsync({
      imports: [CustomConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: config.get<number>('throttle.ttl', 60) * 1000, // Ajustado: throttle.ttl (de configuration.ts)
          limit: config.get<number>('throttle.limit', 10),     // Ajustado: throttle.limit (de configuration.ts)
        }],
      }),
    }),

    // FIX DEFINITIVO Sentry: Use forRoot() SEM ARGUMENTOS (resolve "propriedade não existe" e "0 args esperados")
    // Sentry auto-detecta DSN de SENTRY_DSN no .env (validado pelo CustomConfigModule)
    // Se precisar de configs extras, adicione manualmente no main.ts ou atualize pacote
    SentryModule.forRoot(),

    // REMOVIDO: BullModule duplicado – QueuesModule já configura forRootAsync com redis.url de config

    // Todos os outros módulos permanecem iguais (com forwardRef onde necessário para circular deps)
    PrismaModule,
    AuthModule,
    UsersModule,
    forwardRef(() => ProvidersModule), // ForwardRef para Providers se houver circular com Queues/Verification
    ClientsModule,
    ServicesModule,
    ProviderServicesModule,
    AvailabilityModule,
    BookingsModule,
    ReviewsModule,
    ChatModule,
    NotificationsModule,
    OffersModule,
    PaymentsModule,
    SearchModule,
    VerificationModule,
    DashboardModule,
    EarningsModule,
    FaqsModule,
    forwardRef(() => QueuesModule), // forwardRef direto de common
    CacheModule,
    ReferralsModule,
    SubscriptionsModule,
    SafetyModule,
    CouponsModule,
    GuaranteeModule,
    PricingModule,
    GeocodingModule,
    LoyaltyModule,
    RankingModule,
    MissionsModule,
    DisputeModule,
    // NOVO: Inclusão do AdminModule
    AdminModule,
    // NOVO: Inclusão dos novos módulos
    LocksModule,
    MetricsModule,
    SupportModule,
    AnalyticsModule,
    SettingsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
