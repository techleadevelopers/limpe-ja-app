import { Module } from '@nestjs/common';
import { GeocodingService } from '../services/geocoding.service'; // Importa o serviço real
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule se o GeocodingService depender dele

@Module({
  imports: [ConfigModule], // O GeocodingService usa ConfigService, então ConfigModule é necessário aqui
  providers: [GeocodingService], // Declara GeocodingService como um provider deste módulo
  exports: [GeocodingService], // Exporta GeocodingService para que outros módulos possam injetá-lo
})
export class GeocodingModule {}
