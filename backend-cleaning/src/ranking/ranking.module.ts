// src/modules/ranking/ranking.module.ts
import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersModule } from '../providers/providers.module'; // <--- CORREÇÃO: Importa o ProvidersModule
import { RankingController } from './ranking.controller'; // <--- ADICIONAR ESTA LINHA

@Module({
  // Remova ProvidersService daqui e importe o módulo
  providers: [RankingService, PrismaService],
  controllers: [RankingController], // <--- ADICIONAR ESTA LINHA
  imports: [ProvidersModule], // <--- CORREÇÃO: Adicionado o ProvidersModule aqui
  exports: [RankingService],
})
export class RankingModule {}
