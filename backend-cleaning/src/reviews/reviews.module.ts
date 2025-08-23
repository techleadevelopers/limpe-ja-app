// src/reviews/reviews.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';

// Módulos já usados pelo ReviewsService
import { BookingsModule } from '../bookings/bookings.module';
import { ClientsModule } from '../clients/clients.module';
import { ProvidersModule } from '../providers/providers.module';
import { ProviderServicesModule } from '../provider-services/provider-services.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

// NOVO: Missões
import { MissionsModule } from '../missions/missions.module';

@Module({
  imports: [
    PrismaModule,
    // Se existir dependência circular entre Reviews <-> Bookings, use forwardRef
    forwardRef(() => BookingsModule),
    ClientsModule,
    ProvidersModule,
    ProviderServicesModule,
    LoyaltyModule,
    // Importante: para injetar MissionsService no ReviewsService
    forwardRef(() => MissionsModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
