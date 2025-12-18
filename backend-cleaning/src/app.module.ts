import {
  Module,
  forwardRef,
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config'; // mantém
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
import { ScheduleModule } from '@nestjs/schedule';
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
import { ConnectModule } from './connect/connect.module';

// ConfigModule customizado
import { ConfigModule as CustomConfigModule } from './config/config.module';

// Sentry
import { SentryModule } from '@sentry/nestjs/setup';

// Loyalty e Ranking
import { LoyaltyModule } from './loyalty/loyalty.module';
import { RankingModule } from './ranking/ranking.module';

// MISSIONS
import { MissionsModule } from './missions/missions.module';
// DISPUTES
import { DisputeModule } from './disputes/dispute.module';

// NOVOS recursos
import { LocksModule } from './common/locks/locks.module';
import { MetricsModule } from './metrics/metrics.module';
import { SupportModule } from './support/support.module';

// Admin
import { AdminModule } from './admin/admin.module';

// Queues
import { QueuesModule } from './queues/queues.module';
import { HealthModule } from './health/health.module';
import { HttpMetricsMiddleware } from './common/middleware/http-metrics.middleware';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor';

@Module({
  imports: [
    // 🔥 CORREÇÃO DEFINITIVA: carrega o .env aqui
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // mantém o módulo customizado
    CustomConfigModule,

    // Scheduler global (necessário para @Cron)
    ScheduleModule.forRoot(),

    ThrottlerModule.forRootAsync({
      imports: [CustomConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl', 60) * 1000,
            limit: config.get<number>('throttle.limit', 10),
          },
        ],
      }),
    }),

    SentryModule.forRoot(),

    PrismaModule,
    AuthModule,
    UsersModule,
    forwardRef(() => ProvidersModule),
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
    forwardRef(() => QueuesModule),
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
    AdminModule,
    LocksModule,
    MetricsModule,
    SupportModule,
    AnalyticsModule,
    SettingsModule,
    UploadModule,
    ConnectModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, TracingInterceptor],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}
