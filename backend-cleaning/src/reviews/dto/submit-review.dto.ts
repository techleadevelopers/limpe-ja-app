import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsUUID } from 'class-validator';

export class SubmitReviewDto {
  @ApiProperty({ description: 'ID do agendamento ao qual esta avaliação se refere', example: 'uuid-do-agendamento' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Pontuação da avaliação (1 a 5)', example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário detalhado sobre o serviço', example: 'O provedor foi muito atencioso e o resultado superou minhas expectativas.' })
  @IsOptional()
  @IsString()
  comment?: string;
}