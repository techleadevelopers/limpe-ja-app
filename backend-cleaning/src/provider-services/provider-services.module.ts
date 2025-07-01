// src/provider-services/provider-services.module.ts
import { Module } from '@nestjs/common';
import { ProviderServicesService } from './provider-services.service';
import { ProviderServicesController } from './provider-services.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module'; // <-- Certifique-se que está importado
import { ServicesModule } from '../services/services.module';   // <-- Certifique-se que está importado

@Module({
  imports: [
    PrismaModule,
    ProvidersModule, // Necessário para ProvidersService
    ServicesModule,  // Necessário para ServicesService
  ],
  controllers: [ProviderServicesController],
  providers: [ProviderServicesService],
  exports: [ProviderServicesService],
})
export class ProviderServicesModule {}