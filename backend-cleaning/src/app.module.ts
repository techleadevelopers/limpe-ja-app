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
import { DashboardModule } from './dashboard/dashboard.module'; // Importe o DashboardModule
import { EarningsModule } from './earnings/earnings.module';     // Importe o EarningsModule

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Carrega variáveis de ambiente globalmente
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
    VerificationModule, // Adicione o VerificationModule aqui
    DashboardModule,    // Adicione o DashboardModule aqui
    EarningsModule,     // Adicione o EarningsModule aqui
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}