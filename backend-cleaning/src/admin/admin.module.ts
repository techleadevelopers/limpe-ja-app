import { Module, forwardRef } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { AdminQueuesController } from './admin-queues.controller';
import { SettingsModule } from '../settings/settings.module';
import { AdminSettingsController } from './admin-settings.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => QueuesModule), SettingsModule],
  controllers: [AdminDashboardController, AdminQueuesController, AdminSettingsController],
  providers: [AdminDashboardService],
})
export class AdminModule {}
