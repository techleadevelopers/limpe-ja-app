// src/notifications/notifications.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { I18nModule } from '../common/i18n/i18n.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    I18nModule, // <-- disponibiliza o serviço para injeção no NotificationsService
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
