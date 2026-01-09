// src/availability/availability.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { MyAvailabilityController } from './my-availability.controller'; // Importe o controlador específico
import { AvailabilityService } from './availability.service';
import { ProvidersModule } from '../providers/providers.module'; // Importa o ProvidersModule

@Module({
  imports: [
    forwardRef(() => ProvidersModule), // Adiciona ProvidersModule aos imports
  ],
  controllers: [
    MyAvailabilityController, // Coloque o controlador mais específico primeiro
    AvailabilityController, // Em seguida, o controlador mais genérico
  ],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
