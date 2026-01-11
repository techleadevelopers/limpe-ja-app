import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ManualStartRequestDto {
  @ApiPropertyOptional({
    description: 'Motivo ou contexto da solicitação de início manual',
    example: 'GPS dentro do prédio e sem sinal constante',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  reason?: string;
}
