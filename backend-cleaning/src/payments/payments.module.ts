// src/payments/payments.module.ts
import { Module } from '@nestjs/common'; // Remova forwardRef se não for mais usado
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
// REMOVIDO: import { BookingsModule } from '../bookings/bookings.module'; // REMOVA ESTA LINHA

@Module({
  imports: [
    PrismaModule,
    // REMOVIDO: forwardRef(() => BookingsModule), // REMOVA ESTA LINHA OU BookingsModule, se já estava
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}