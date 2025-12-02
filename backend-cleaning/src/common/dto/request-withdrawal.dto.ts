import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PixKeyType } from '@prisma/client';

/**
 * DTO compartilhado para solicitações de saque, evitando duplicidade de schemas.
 */
export class RequestWithdrawalDto {
  @ApiProperty({
    description: 'Valor do saque solicitado',
    example: 250.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({
    description: 'Tipo da chave PIX',
    enum: PixKeyType,
    example: PixKeyType.CPF,
  })
  @IsEnum(PixKeyType)
  @IsNotEmpty()
  pixKeyType!: PixKeyType;

  @ApiProperty({
    description: 'Chave PIX para o saque',
    example: '123.456.789-00',
  })
  @IsString()
  @IsNotEmpty()
  pixKey!: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais para o saque',
    example: 'Saque para despesas pessoais',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
