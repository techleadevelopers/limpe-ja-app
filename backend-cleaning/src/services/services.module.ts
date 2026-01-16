// src/services/services.module.ts
import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { NotificationService } from './NotificationService';
import { WhatsappService } from './whatsappService';

// Importe o módulo de cache para que o ServicesService possa usá-lo
import { CacheModule } from '../cache/cache.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule, // <-- Adicione CacheModule aqui para resolver a dependência
  ],
  controllers: [ServicesController],
  providers: [ServicesService, NotificationService, WhatsappService],
  exports: [ServicesService, NotificationService, WhatsappService],
})
export class ServicesModule {}
