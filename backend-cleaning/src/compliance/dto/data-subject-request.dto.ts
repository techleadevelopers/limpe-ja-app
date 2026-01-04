import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DataSubjectRequestDto {
  @ApiPropertyOptional({
    description: 'Motivo adicional para a solicitação',
    example: 'Quero uma cópia completa dos meus dados',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
