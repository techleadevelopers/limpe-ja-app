// src/providers/providers.module.ts
import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ProvidersController } from './providers.controller';
import { VerificationModule } from '../verification/verification.module'; // <-- IMPORTAR AQUI

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    VerificationModule, // <-- ADICIONADO AQUI
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}