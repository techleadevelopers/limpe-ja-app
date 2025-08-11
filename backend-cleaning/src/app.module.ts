// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import configuration from './config/configuration';
import { validationSchema } from './config/validation-schema';
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

// Importe o SentryModule da forma correta
import { SentryModule } from '@sentry/nestjs/setup';

// Importar os novos módulos de Loyalty e Ranking
import { LoyaltyModule } from './loyalty/loyalty.module'; // <--- NOVA LINHA
import { RankingModule } from './ranking/ranking.module'; // <--- NOVA LINHA

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 10),
        }],
      }),
    }),
    // O SentryModule deve ser importado sem argumentos, pois a inicialização
    // já foi feita no arquivo `instrument.ts` ou `main.ts`
    SentryModule.forRoot(),
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
    LoyaltyModule, // <--- NOVA LINHA: Adicionado LoyaltyModule
    RankingModule, // <--- NOVA LINHA: Adicionado RankingModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}