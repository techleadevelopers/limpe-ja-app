// src/dispute/dispute.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module'; // Dependência de BookingsModule
import { NotificationsModule } from '../notifications/notifications.module'; // Dependência de NotificationsModule

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BookingsModule), // Para evitar dependência circular se BookingsModule também importar DisputeModule
    NotificationsModule,
  ],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}