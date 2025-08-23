// backend-cleaning/src/coupons/coupons.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,                 // Usa PrismaService via módulo (boa prática)
    forwardRef(() => UsersModule) // Necessário pois CouponsService depende de UsersService
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],      // Para MissionsModule (e outros) consumirem
})
export class CouponsModule {}
