// src/payments/payments.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { BookingsModule } from '../bookings/bookings.module';
import { CouponsModule } from '../coupons/coupons.module';
import { NotificationsModule } from '../notifications/notifications.module'; // NEW
import { EmailModule } from '../email/email.module'; // NEW
import { QueuesModule } from '../queues/queues.module'; // NEW

@Module({
  imports: [
    PrismaModule,
    ProvidersModule,
    forwardRef(() => BookingsModule),
    CouponsModule,
    NotificationsModule, // NEW
    EmailModule, // NEW
    forwardRef(() => QueuesModule), // FIX: Adicionado forwardRef aqui
    // BankAccountsModule removido, pois não é mais necessário para saques PIX
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}