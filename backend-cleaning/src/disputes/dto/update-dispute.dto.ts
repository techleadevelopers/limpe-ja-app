import { IsEnum, IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { DisputeStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateDisputeDto } from './create-dispute.dto';

// Use PartialType para tornar todos os campos de CreateDisputeDto opcionais
export class UpdateDisputeDto extends PartialType(OmitType(CreateDisputeDto, ['bookingId'])) {
  @IsEnum(DisputeStatus)
  @IsNotEmpty()
  @ApiProperty({ enum: DisputeStatus, description: 'Novo status da disputa.', example: 'RESOLVED' })
  status: DisputeStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Notas de resolução (preenchido por um admin).', example: 'Disputa resolvida com reembolso parcial.' })
  resolutionNotes?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional({ description: 'Valor do reembolso final a ser processado.', example: 25.00 })
  refundAmount?: number;
}