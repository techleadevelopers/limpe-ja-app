// src/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';

// Importe os MÓDULOS que exportam os serviços necessários
import { BookingsModule } from '../bookings/bookings.module'; // Importa BookingsModule
import { ClientsModule } from '../clients/clients.module';     // Importa ClientsModule
import { ProvidersModule } from '../providers/providers.module'; // Importa ProvidersModule
import { ProviderServicesModule } from '../provider-services/provider-services.module'; // Importa ProviderServicesModule
import { LoyaltyModule } from '../loyalty/loyalty.module'; // <--- CORREÇÃO: Adicione o LoyaltyModule

@Module({
  imports: [
    PrismaModule,
    BookingsModule,          // <--- Importe o MÓDULO Bookings
    ClientsModule,           // <--- Importe o MÓDULO Clients
    ProvidersModule,         // <--- Importe o MÓDULO Providers
    ProviderServicesModule,  // <--- Importe o MÓDULO ProviderServices
    LoyaltyModule,           // <--- CORREÇÃO: Adicionado o LoyaltyModule
    // Se ReviewsService ou ReviewsController precisarem diretamente de UsersService,
    // você também precisaria importar UsersModule aqui.
    // UsersModule,
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewsService, // Apenas ReviewsService é provido aqui, pois os outros vêm dos módulos importados
  ],
  exports: [ReviewsService], // Exporta ReviewsService se outros módulos precisarem dele
})
export class ReviewsModule {}
