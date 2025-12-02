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

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    LocksModule,
    forwardRef(() => QueuesModule),
    ConnectModule,
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
