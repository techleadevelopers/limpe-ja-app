// src/provider-services/provider-services.module.ts (Exemplo)
import { Module } from '@nestjs/common';
import { ProviderServicesService } from './provider-services.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [],
  providers: [ProviderServicesService],
  exports: [ProviderServicesService], // <--- DEVE EXPORTAR ProviderServicesService
})
export class ProviderServicesModule {}