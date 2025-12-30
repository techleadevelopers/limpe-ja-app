import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { I18nModule } from '../common/i18n/i18n.module';

@Module({
  imports: [PrismaModule, NotificationsModule, I18nModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
