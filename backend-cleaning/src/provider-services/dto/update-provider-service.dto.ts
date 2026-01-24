import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, IsOptional, IsInt, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { MIN_HOURLY_MINUTES } from '../../common/constants/pricing';
import { sanitizeHtmlText } from '../../common/utils/transformers';

export class UpdateProviderServiceDto {
  @ApiPropertyOptional({
    description: 'Novo preco por hora (deve ser > 0)',
    example: 48.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  pricePerHour?: number;

  @ApiPropertyOptional({
    description: 'Nova duracao estimada em minutos (>= 240)',
    example: 200,
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_HOURLY_MINUTES)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Atualizacao na descricao do servico',
    example: 'Servico premium com foco em detalhes.',
  })
  @IsOptional()
  @Transform(sanitizeHtmlText)
  @IsString()
  description?: string;
}
