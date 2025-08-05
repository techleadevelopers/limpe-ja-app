// src/geocoding/dto/geocode-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class GeocodeResponseDto {
  @ApiProperty({ description: 'Latitude da localização', example: -23.550520 })
  latitude: number;

  @ApiProperty({ description: 'Longitude da localização', example: -46.633308 })
  longitude: number;
}