import { Module } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ServicesModule } from '../services/services.module';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { QueuesModule } from '../queues/queues.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisLockModule } from '../common/locks/redis-lock.module';

@Module({
  imports: [
    NotificationsModule,
    ServicesModule,
    EmailModule,
    SmsModule,
    QueuesModule,
    RedisLockModule,
  ],
  controllers: [SafetyController],
  providers: [SafetyService, PrismaService],
  exports: [SafetyService],
})
export class SafetyModule {}
