import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PixKeyType } from '@prisma/client';

export class RequestWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @IsString()
  @IsNotEmpty()
  pixKey!: string;

  @IsEnum(PixKeyType)
  pixKeyType!: PixKeyType;

  @IsString()
  @IsOptional()
  notes?: string;
}
