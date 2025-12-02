// src/support/support.module.ts

import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module'; // Para notificar usuários
import { QueuesModule } from '../queues/queues.module'; // Para jobs de escalonamento
import { SupportSlaPolicy } from './policies/sla.policy';
import { SupportStateMachine } from './states/support.state-machine';
import { EscalationsJobProcessor } from './jobs/escalations.job';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule, QueuesModule],
  controllers: [SupportController],
  providers: [
    SupportService,
    SupportSlaPolicy,
    SupportStateMachine,
    EscalationsJobProcessor,
  ],
  exports: [SupportService],
})
export class SupportModule {}
