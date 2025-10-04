import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { PayoutsController } from './payouts.controller';
import { PayoutsWebhookController } from './payouts.webhook.controller';
import { PayoutsService } from './payouts.service';
import { LocksModule } from '../common/locks/locks.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    LocksModule,
    forwardRef(() => QueuesModule),
  ],
  controllers: [PayoutsController, PayoutsWebhookController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
