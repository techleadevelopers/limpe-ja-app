// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
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
import { FaqsModule } from './faqs/faqs.module'; // <-- NOVO: Importe o FaqsModule
import configuration from './config/configuration'; // <-- NOVO: Importe a configuração
import { validationSchema } from './config/validation-schema'; // <-- NOVO: Importe o schema de validação

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
    FaqsModule, // <-- NOVO: Adicione o FaqsModule aqui
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}