// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Torna o PrismaService disponível globalmente para injeção
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exporta o serviço para que outros módulos possam usá-lo
})
export class PrismaModule {}
