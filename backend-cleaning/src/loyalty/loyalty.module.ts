// src/modules/loyalty/loyalty.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Importa o PrismaModule
import { UsersModule } from '../users/users.module'; // Importa o UsersModule
import { CouponsModule } from '../coupons/coupons.module'; // Importa o CouponsModule
import { MissionsModule } from '../missions/missions.module'; // ✅ Importa o MissionsModule

@Module({
  // Importe os módulos que fornecem os serviços necessários
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule), // <--- Mantido como você já tem
    CouponsModule,
    MissionsModule, // ✅ Injetado o MissionsModule
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService], // Apenas o LoyaltyService é provido aqui
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
