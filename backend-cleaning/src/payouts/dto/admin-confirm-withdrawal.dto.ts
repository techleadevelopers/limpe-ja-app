import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AdminConfirmWithdrawalDto {
  @ApiPropertyOptional({ description: 'ID de transação do gateway (se houver)' })
  @IsOptional()
  @IsString()
  gatewayTxnId?: string;

  @ApiPropertyOptional({ description: 'Observação opcional do administrador' })
  @IsOptional()
  @IsString()
  note?: string;
}

