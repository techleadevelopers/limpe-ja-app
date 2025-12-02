import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ProviderSettingsDto {
  @ApiPropertyOptional({
    description: 'Raio de atendimento em km',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  serviceRadiusKm?: number;

  // weeklyTemplate é ignorado por enquanto no backend
}
