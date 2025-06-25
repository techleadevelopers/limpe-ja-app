// src/bookings/bookings.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Mantenha forwardRef
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';
import { ProvidersModule } from '../providers/providers.module';
import { ProviderServicesModule } from '../provider-services/provider-services.module';
import { PaymentsModule } from '../payments/payments.module'; // Mantenha importando PaymentsModule

@Module({
  imports: [
    PrismaModule,
    ClientsModule,
    ProvidersModule,
    ProviderServicesModule,
    forwardRef(() => PaymentsModule), // Mantenha forwardRef para PaymentsModule
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}