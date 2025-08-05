// src/geocoding/geocoding.module.ts
import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { ConfigModule } from '@nestjs/config'; // Importe ConfigModule porque GeocodingService o utiliza

@Module({
  imports: [ConfigModule], // Importe ConfigModule para que ConfigService esteja disponível
  providers: [GeocodingService],
  exports: [GeocodingService], // Exporte o serviço para que outros módulos possam injetá-lo
})
export class GeocodingModule {}