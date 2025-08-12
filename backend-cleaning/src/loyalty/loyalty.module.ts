// src/modules/loyalty/loyalty.module.ts
import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CouponsModule } from '../coupons/coupons.module'; // Importa o módulo de cupons
import { UsersModule } from '../users/users.module'; // Importa o módulo de usuários
import { NotificationsModule } from '../notifications/notifications.module'; // Importação adicionada

@Module({
  // Remova UsersService e CouponsService daqui, pois eles serão providos pelos módulos importados
  providers: [LoyaltyService], 
  controllers: [LoyaltyController],
  // Adicione UsersModule e CouponsModule aos imports
  imports: [
    PrismaModule,
    UsersModule,
    CouponsModule,
    NotificationsModule
  ],
  exports: [LoyaltyService], // Exportar o serviço para que outros módulos possam usá-lo
})
export class LoyaltyModule {}
