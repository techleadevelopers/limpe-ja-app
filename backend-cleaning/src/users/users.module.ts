// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module'; // Certifique-se de que está importado
import { UsersController } from './users.controller'; // Certifique-se que o caminho está correto

@Module({
  imports: [PrismaModule], // Adicionado para que UsersService possa usar PrismaService
  controllers: [UsersController], // <-- ESTA LINHA É CRÍTICA!
  providers: [UsersService],
  exports: [UsersService],   // <--- CRÍTICO: UsersService deve ser exportado aqui
})
export class UsersModule {}