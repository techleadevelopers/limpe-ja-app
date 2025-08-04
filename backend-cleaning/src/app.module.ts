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

// NOVAS IMPORTAÇÕES DE MÓDULOS
import { QueuesModule } from './queues/queues.module';
import { CacheModule } from './cache/cache.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ThrottlerModule } from '@nestjs/throttler'; // Módulo para Rate Limiting

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration], // Carrega a configuração customizada
      validationSchema,      // Aplica o schema de validação
      validationOptions: {
        allowUnknown: true, // Permite variáveis de ambiente não definidas no schema
        abortEarly: true,   // Aborta a validação no primeiro erro
      },
    }),
    // Configuração do ThrottlerModule para Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule], // Importa ConfigModule para acessar ConfigService
      inject: [ConfigService], // Injeta ConfigService
      useFactory: (config: ConfigService) => ({
        // A propriedade 'throttlers' deve ser um array de objetos com ttl e limit
        throttlers: [{
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000, // Converte segundos para milissegundos
          limit: config.get<number>('THROTTLE_LIMIT', 10),
        }],
      }),
    }),
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
    // Adicione os novos módulos aqui
    QueuesModule,     // Módulo para gerenciar filas (BullMQ)
    CacheModule,      // Módulo para gerenciar cache (Redis)
    ReferralsModule,  // Módulo para o sistema de indicações
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}