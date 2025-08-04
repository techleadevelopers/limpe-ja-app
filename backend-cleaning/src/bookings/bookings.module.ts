// src/bookings/bookings.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';
import { ProvidersModule } from '../providers/providers.module';
import { ProviderServicesModule } from '../provider-services/provider-services.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueuesModule } from '../queues/queues.module'; // Importe o QueuesModule

@Module({
  imports: [
    PrismaModule,
    ClientsModule,
    ProvidersModule,
    ProviderServicesModule,
    forwardRef(() => PaymentsModule),
    NotificationsModule,
    QueuesModule, // CORREÇÃO: Adicione QueuesModule para fornecer QueuesService
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}