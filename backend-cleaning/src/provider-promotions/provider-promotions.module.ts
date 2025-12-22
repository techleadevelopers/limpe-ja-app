import { Module } from '@nestjs/common';
import { ProviderPromotionsController } from './provider-promotions.controller';
import { ProviderPromotionsService } from './provider-promotions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProviderPromotionsController],
  providers: [ProviderPromotionsService],
})
export class ProviderPromotionsModule {}
