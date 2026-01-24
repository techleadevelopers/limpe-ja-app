// src/clients/clients.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsController } from './clients.controller';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [
    forwardRef(() => UsersModule), // CORREÇÃO: Adicionado forwardRef para resolver a dependência circular.
    PrismaModule,
    GeocodingModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
