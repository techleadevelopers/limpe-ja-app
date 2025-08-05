// backend-cleaning/src/guarantee/guarantee.module.ts
import { Module } from '@nestjs/common';
import { GuaranteeService } from './guarantee.service';
import { GuaranteeController } from './guarantee.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module'; // Assuming NotificationsModule exists

@Module({
  imports: [NotificationsModule],
  controllers: [GuaranteeController],
  providers: [GuaranteeService, PrismaService],
  exports: [GuaranteeService],
})
export class GuaranteeModule {}