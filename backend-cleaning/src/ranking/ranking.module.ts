// src/modules/ranking/ranking.module.ts
import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { RankingController } from './ranking.controller'; // <--- ADICIONAR ESTA LINHA

@Module({
  providers: [RankingService, PrismaService, ProvidersService],
  controllers: [RankingController], // <--- ADICIONAR ESTA LINHA
  exports: [RankingService],
})
export class RankingModule {}