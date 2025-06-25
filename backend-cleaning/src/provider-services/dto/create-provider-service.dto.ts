import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsInt, Min, IsOptional } from 'class-validator';

export class CreateProviderServiceDto {
  @ApiProperty({ description: 'ID do tipo de serviço (Service) que o provedor está oferecendo', example: 'uuid-do-tipo-servico' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: 'Preço cobrado pelo provedor para este serviço', example: 120.50 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Duração estimada do serviço em minutos', example: 180 })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Descrição específica do provedor para este serviço', example: 'Limpeza detalhada com produtos ecológicos.' })
  @IsOptional()
  @IsString()
  description?: string;
}