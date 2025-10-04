import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { PixKeyType } from '@prisma/client';

export class RequestWithdrawalDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  pixKey!: string;

  @IsEnum(PixKeyType)
  pixKeyType!: PixKeyType;

  @IsString()
  @IsOptional()
  notes?: string;
}
