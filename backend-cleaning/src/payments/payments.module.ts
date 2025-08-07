// src/payments/payments.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { BookingsModule } from '../bookings/bookings.module';
import { CouponsModule } from '../coupons/coupons.module'; // Importar CouponsModule

@Module({
  imports: [
    PrismaModule,
    ProvidersModule,
    forwardRef(() => BookingsModule),
    CouponsModule, // CORREÇÃO: Adicionado CouponsModule para disponibilizar CouponsService
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
