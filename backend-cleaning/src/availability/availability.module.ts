// src/availability/availability.module.ts
import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { ProvidersModule } from '../providers/providers.module'; // Importa o ProvidersModule

@Module({
  imports: [
    ProvidersModule, // Adiciona ProvidersModule aos imports
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}