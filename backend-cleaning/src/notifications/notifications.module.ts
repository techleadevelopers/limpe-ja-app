// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // Para JwtAuthGuard

@Module({
  imports: [
    PrismaModule, // Necessário para interagir com o banco de dados via PrismaService
    AuthModule, // Necessário para usar o JwtAuthGuard
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // Exporta o serviço caso outros módulos precisem criar notificações
})
export class NotificationsModule {}