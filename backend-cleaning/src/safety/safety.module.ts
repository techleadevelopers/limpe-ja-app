// backend-cleaning/src/safety/safety.module.ts
import { Module } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module'; // Assuming NotificationsModule exists
import { EmailModule } from '../email/email.module'; // Assuming EmailModule exists - VERIFIQUE O CAMINHO E EXISTÊNCIA
import { SmsModule } from '../sms/sms.module'; // Assuming SmsModule exists
import { QueuesModule } from '../queues/queues.module'; // Assuming QueuesModule exists

@Module({
  imports: [
    NotificationsModule,
    EmailModule, // VERIFIQUE SE ESTE MÓDULO ESTÁ CORRETAMENTE IMPLEMENTADO
    SmsModule,
    QueuesModule,
  ],
  controllers: [SafetyController],
  providers: [SafetyService, PrismaService],
  exports: [SafetyService],
})
export class SafetyModule {}
