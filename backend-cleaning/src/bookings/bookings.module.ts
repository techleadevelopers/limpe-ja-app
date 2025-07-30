// src/bookings/bookings.module.ts
import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Assuming you have this
import { ClientsModule } from '../clients/clients.module'; // Assuming you have this
import { ProvidersModule } from '../providers/providers.module'; // Assuming you have this
import { ProviderServicesModule } from '../provider-services/provider-services.module'; // Assuming you have this
import { PaymentsModule } from '../payments/payments.module'; // Assuming you have this
import { NotificationsModule } from '../notifications/notifications.module'; // Make sure this path is correct

@Module({
  imports: [
    PrismaModule,
    ClientsModule,
    ProvidersModule,
    ProviderServicesModule,
    PaymentsModule,
    NotificationsModule, // Add NotificationsModule here
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService], // If other modules need to use BookingsService
})
export class BookingsModule {}