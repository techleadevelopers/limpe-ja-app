import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingsModule } from './bookings/bookings.module';
import { CacheModule } from './cache/cache.module';
import { ChatModule } from './chat/chat.module';
import { ClientsModule } from './clients/clients.module';
import { ComplianceModule } from './compliance/compliance.module';
import { ConnectModule } from './connect/connect.module';
import { CouponsModule } from './coupons/coupons.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EarningsModule } from './earnings/earnings.module';
import { FaqsModule } from './faqs/faqs.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { GuaranteeModule } from './guarantee/guarantee.module';
import { IncidentsModule } from './incidents/incidents.module';
import { InsuranceModule } from './insurance/insurance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OffersModule } from './offers/offers.module';
import { PaymentsModule } from './payments/payments.module';
import { PricingModule } from './pricing/pricing.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProviderPromotionsModule } from './provider-promotions/provider-promotions.module';
import { ProviderServicesModule } from './provider-services/provider-services.module';
import { ProvidersModule } from './providers/providers.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SafetyModule } from './safety/safety.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SearchModule } from './search/search.module';
import { ServicesModule } from './services/services.module';
import { SettingsModule } from './settings/settings.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';

// ConfigModule customizado
import { CommonModule } from './common/common.module';
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
import { MetaModule } from './meta/meta.module';
import { MetricsModule } from './metrics/metrics.module';
import { ObservabilityModule } from './observability/observability.module';
import { SupportModule } from './support/support.module';
import { TelemetryModule } from './telemetry/telemetry.module';

// Admin
import { AdminModule } from './admin/admin.module';
import { AuditLogModule } from './audit/audit-log.module';

// Queues
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit/audit.interceptor';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor';
import { HttpMetricsMiddleware } from './common/middleware/http-metrics.middleware';
import { ConfigController } from './config/config.controller';
import { HealthModule } from './health/health.module';
import { QueuesModule } from './queues/queues.module';
import { CleanupDeletedUserNotificationsJob } from './worker/cleanup-deleted-user-notifications.job';
import { ExpireBookingsJob } from './worker/expire-bookings.job';

@Module({
  imports: [
    // O CustomConfigModule já carrega e valida as variáveis de ambiente.
    CustomConfigModule,

    // Scheduler global (necessário para @Cron)
    ScheduleModule.forRoot(),

    ThrottlerModule.forRootAsync({
      imports: [CustomConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl', 120) * 1000,
            limit: 1000, // Hardcoded para ignorar variáveis de ambiente durante o teste
          },
        ],
      }),
    }),

    SentryModule.forRoot(),
    CommonModule,

    PrismaModule,
    AuthModule,
    ComplianceModule,
    UsersModule,
    forwardRef(() => ProvidersModule),
    ProviderPromotionsModule,
    ClientsModule,
    ServicesModule,
    ProviderServicesModule,
    AvailabilityModule,
    BookingsModule,
    ReviewsModule,
    ChatModule,
    NotificationsModule,
    SchedulerModule,
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
    IncidentsModule,
    CouponsModule,
    GuaranteeModule,
    InsuranceModule,
    PricingModule,
    GeocodingModule,
    LoyaltyModule,
    RankingModule,
    MissionsModule,
    DisputeModule,
    AdminModule,
    AuditLogModule,
    LocksModule,
    MetricsModule,
    ObservabilityModule,
    TelemetryModule,
    SupportModule,
    MetaModule,
    AnalyticsModule,
    SettingsModule,
    UploadModule,
    ConnectModule,
    HealthModule,
  ],
  controllers: [AppController, ConfigController],
  providers: [
    AppService,
    CleanupDeletedUserNotificationsJob,
    ExpireBookingsJob,
    TracingInterceptor,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}
