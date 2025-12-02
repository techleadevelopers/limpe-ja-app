// src/offers/offers.module.ts
import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Importa o PrismaModule para que OffersService possa usar PrismaService
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService], // Exporta OffersService se outros módulos precisarem usá-lo
})
export class OffersModule {}
