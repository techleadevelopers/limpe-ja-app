// src/modules/loyalty/loyalty.module.ts
import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service'; // Se precisar interagir com usuários
import { CouponsService } from '../coupons/coupons.service'; // Se precisar interagir com cupons para resgate
import { NotificationsModule } from '../notifications/notifications.module'; // Importação adicionada

@Module({
  providers: [LoyaltyService, PrismaService, UsersService, CouponsService], // Adicione PrismaService e outros serviços necessários
  controllers: [LoyaltyController],
  imports: [NotificationsModule], // Importa o NotificationsModule para resolver a dependência
  exports: [LoyaltyService], // Exportar o serviço para que outros módulos possam usá-lo
})
export class LoyaltyModule {}
