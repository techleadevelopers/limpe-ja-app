// src/payouts/payouts.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { PayoutsController } from './payouts.controller';
import { AdminWithdrawalsController } from './admin-withdrawals.controller';
import { PayoutsWebhookController } from './payouts.webhook.controller';
import { PayoutsService } from './payouts.service';
import { LocksModule } from '../common/locks/locks.module';
import { ConfigModule } from '@nestjs/config';
import { ConnectModule } from '../connect/connect.module';

// IMPORTAR PaymentsModule AQUI (Se estiver no mesmo nível, o path seria '../payments/payments.module')
import { PaymentsModule } from '../payments/payments.module'; 

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    LocksModule,
    forwardRef(() => QueuesModule),
    ConnectModule,
    // <<<<<<<<<<<< ESTA LINHA É A CORREÇÃO PRINCIPAL >>>>>>>>>>>>
    forwardRef(() => PaymentsModule), // Adicione este import para resolver a dependência circular.
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  ],
  controllers: [
    PayoutsController,
    PayoutsWebhookController,
    AdminWithdrawalsController,
  ],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}