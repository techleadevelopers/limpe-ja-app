// src/providers/providers.module.ts (Exemplo)
import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module'; // Se ProvidersService precisa de UsersService
import { ProvidersController } from './providers.controller'; // Importe o controller aqui

@Module({
  imports: [
    PrismaModule,
    UsersModule,
  ],
  controllers: [ProvidersController], // Adicione ProvidersController aqui
  providers: [ProvidersService],
  exports: [ProvidersService], // <--- DEVE EXPORTAR ProvidersService
})
export class ProvidersModule {}