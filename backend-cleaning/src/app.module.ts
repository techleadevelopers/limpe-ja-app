// src/app.module.ts
import { Module } from '@nestjs/common';
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
import { QueuesModule } from './queues/queues.module';
import { CacheModule } from './cache/cache.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SafetyModule } from './safety/safety.module';
import { CouponsModule } from './coupons/coupons.module';
import { GuaranteeModule } from './guarantee/guarantee.module';
import { PricingModule } from './pricing/pricing.module';
import { GeocodingModule } from './geocoding/geocoding.module';

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
import { BullModule } from '@nestjs/bull'; // Importar BullModule para configurar filas

@Module({
  imports: [
    // NOVO: Use o ConfigModule customizado (substitui o forRoot direto)
    CustomConfigModule,

    // ThrottlerModule ajustado para usar as configs de configuration.ts
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: config.get<number>('throttle.ttl', 60) * 1000, // Ajustado: throttle.ttl (de configuration.ts)
          limit: config.get<number>('throttle.limit', 10),     // Ajustado: throttle.limit (de configuration.ts)
        }],
      }),
    }),

    // SentryModule (pode injetar config se necessário: dsn: config.get('sentry.dsn'))
    SentryModule.forRoot(),

    // NOVO: Configuração do BullModule para a fila de suporte (ajustado para redis.url)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get<string>('redis.url'), // Ajustado: redis.url (de configuration.ts)
      }),
    }),
    BullModule.registerQueue({
      name: 'support-escalations', // Nome da fila para o módulo de suporte
    }),

    // Todos os outros módulos permanecem iguais
    PrismaModule,
    AuthModule,
    UsersModule,
    ProvidersModule,
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
    QueuesModule,
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
    // NOVO: Inclusão dos novos módulos
    LocksModule,
    MetricsModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}