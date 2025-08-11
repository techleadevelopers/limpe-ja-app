// src/modules/loyalty/loyalty.module.ts
import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service'; // Se precisar interagir com usuários
import { CouponsService } from '../coupons/coupons.service'; // Se precisar interagir com cupons para resgate

@Module({
  providers: [LoyaltyService, PrismaService, UsersService, CouponsService], // Adicione PrismaService e outros serviços necessários
  controllers: [LoyaltyController],
  exports: [LoyaltyService], // Exportar o serviço para que outros módulos possam usá-lo
})
export class LoyaltyModule {}