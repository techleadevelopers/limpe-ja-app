import { Module, forwardRef } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { AdminQueuesController } from './admin-queues.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => QueuesModule)],
  controllers: [AdminDashboardController, AdminQueuesController],
  providers: [AdminDashboardService],
})
export class AdminModule {}
