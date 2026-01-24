import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdatePanicLocationDto {
  @ApiProperty({
    description: 'Latitude decimal do alerta de pânico.',
    example: -23.55052,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude decimal do alerta de pânico.',
    example: -46.63331,
  })
  @IsNumber()
  longitude: number;
}
