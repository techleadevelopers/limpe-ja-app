// src/referrals/referrals.module.ts (Exemplo)
import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';

// Importe o módulo de notificações para que os serviços dependentes possam usá-lo
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module'; // Exemplo
import { PrismaModule } from '../prisma/prisma.module'; // Exemplo

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    NotificationsModule, // <-- Adicione NotificationsModule aqui
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}