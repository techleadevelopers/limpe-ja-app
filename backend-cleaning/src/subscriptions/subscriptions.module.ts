// backend-cleaning/src/subscriptions/subscriptions.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Importar forwardRef
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsModule } from '../bookings/bookings.module';
import { PaymentsModule } from '../payments/payments.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [
    forwardRef(() => BookingsModule), // CORREÇÃO: Adicionado forwardRef para BookingsModule
    PaymentsModule,
    forwardRef(() => QueuesModule),   // CORREÇÃO: Adicionado forwardRef para QueuesModule
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PrismaService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}