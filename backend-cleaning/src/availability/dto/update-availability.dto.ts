import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiPropertyOptional({
    description:
      'ID do slot de disponibilidade existente para atualização ou deleção',
    example: 'uuid-do-slot',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description:
      'Dia da semana (0 para Domingo, 1 para Segunda, ..., 6 para Sábado)',
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    description: 'Horário de início do slot (formato HH:mm)',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  // Poderia adicionar validação de formato de hora mais robusta (e.g., regex /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/)
  startTime: string;

  @ApiProperty({
    description: 'Horário de término do slot (formato HH:mm)',
    example: '17:00',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({
    description:
      'Define se o provedor está disponível neste slot. Usar "false" para indicar remoção do slot.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
