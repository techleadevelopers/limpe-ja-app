// src/disputes/dispute.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module'; // Dependência de BookingsModule
import { NotificationsModule } from '../notifications/notifications.module'; // Dependência de NotificationsModule
import { ThrottlerModule } from '@nestjs/throttler'; // NEW: Import ThrottlerModule

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BookingsModule), // Para evitar dependência circular se BookingsModule também importar DisputeModule
    NotificationsModule,
    // NEW: Configuração do ThrottlerModule para rate limiting (sintaxe de array compatível com versões antigas)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos em MILISSEGUNDOS (1 minuto)
        limit: 10, // Limite de requisições por IP por TTL
      },
    ]),
  ],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
