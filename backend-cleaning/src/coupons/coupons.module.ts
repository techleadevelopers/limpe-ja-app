// backend-cleaning/src/coupons/coupons.module.ts
import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module'; // Assuming UsersModule exists

@Module({
  imports: [UsersModule], // Import UsersModule to make UsersService available
  controllers: [CouponsController],
  providers: [CouponsService, PrismaService],
  exports: [CouponsService], // Export so BookingsModule can use it
})
export class CouponsModule {}