// src/payments/dto/request-withdrawal.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, Min, IsOptional, IsEnum } from 'class-validator';

// Enum para os tipos de chave PIX
export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
}

export class RequestWithdrawalDto {
  @ApiProperty({ description: 'Valor do saque solicitado', example: 250.00 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Tipo da chave PIX', enum: PixKeyType, example: PixKeyType.CPF })
  @IsEnum(PixKeyType)
  @IsNotEmpty()
  pixKeyType: PixKeyType;

  @ApiProperty({ description: 'Chave PIX para o saque', example: '123.456.789-00' })
  @IsString()
  @IsNotEmpty()
  pixKey: string;

  @ApiPropertyOptional({ description: 'Observações adicionais para o saque', example: 'Saque para despesas pessoais' })
  @IsOptional()
  @IsString()
  notes?: string;
}