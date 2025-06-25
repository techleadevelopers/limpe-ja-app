// src/payments/dto/request-withdrawal.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, Min, IsOptional } from 'class-validator';

export class RequestWithdrawalDto {
  @ApiProperty({ description: 'Valor do saque solicitado', example: 250.00 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Nome do banco', example: 'Banco Exemplo S.A.' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ description: 'Número da agência', example: '0001' })
  @IsString()
  @IsNotEmpty()
  agencyNumber: string;

  @ApiProperty({ description: 'Número da conta', example: '12345-6' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Tipo da conta (Corrente, Poupança)', example: 'Corrente' })
  @IsString()
  @IsNotEmpty()
  accountType: string;

  @ApiPropertyOptional({ description: 'Observações adicionais para o saque', example: 'Saque para despesas pessoais' })
  @IsOptional()
  @IsString()
  notes?: string;
}