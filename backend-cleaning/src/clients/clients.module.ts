// src/clients/clients.module.ts
import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { UsersModule } from '../users/users.module';   // Importado porque ClientsService precisa de UsersService
import { PrismaModule } from '../prisma/prisma.module'; // Importado porque ClientsService precisa de PrismaService
import { ClientsController } from './clients.controller'; // <--- Importe o ClientsController aqui

@Module({
  imports: [
    UsersModule,  // Para disponibilizar UsersService
    PrismaModule, // Para disponibilizar PrismaService
  ],
  controllers: [ClientsController], // <--- Certifique-se de que há uma vírgula aqui
  providers: [ClientsService],      // <--- Certifique-se de que há uma vírgula aqui
  exports: [ClientsService],
})
export class ClientsModule {}