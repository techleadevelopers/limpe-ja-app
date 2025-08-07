// backend-cleaning/src/coupons/coupons.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Importe forwardRef
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)], // CORREÇÃO: Adicionado forwardRef para resolver a dependência circular.
  controllers: [CouponsController],
  providers: [CouponsService, PrismaService],
  exports: [CouponsService],
})
export class CouponsModule {}