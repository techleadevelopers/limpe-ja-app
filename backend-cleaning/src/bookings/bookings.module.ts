// src/bookings/bookings.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Importe forwardRef
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module'; // ADICIONADO
import { ProvidersModule } from '../providers/providers.module'; // ADICIONADO
import { ProviderServicesModule } from '../provider-services/provider-services.module'; // ADICIONADO
import { PaymentsModule } from '../payments/payments.module'; // ADICIONADO

@Module({
  imports: [
    PrismaModule,
    ClientsModule, // Necessário para ClientsService
    ProvidersModule, // Necessário para ProvidersService
    ProviderServicesModule, // Necessário para ProviderServicesService
    forwardRef(() => PaymentsModule), // Necessário para PaymentsService (pode ser circular)
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService], // Exporta para outros módulos (ex: ReviewsModule)
})
export class BookingsModule {}