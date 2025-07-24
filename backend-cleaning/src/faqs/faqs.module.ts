// src/faqs/faqs.module.ts
import { Module } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // Para JwtAuthGuard e RolesGuard

@Module({
  imports: [
    PrismaModule, // Necessário para interagir com o banco de dados via PrismaService
    AuthModule,   // Necessário para usar JwtAuthGuard e RolesGuard
  ],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService], // Exporta o serviço caso outros módulos precisem acessar FAQs
})
export class FaqsModule {}