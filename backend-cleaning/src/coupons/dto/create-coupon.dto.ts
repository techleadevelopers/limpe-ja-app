// backend-cleaning/src/coupons/dto/create-coupon.dto.ts
import { IsString, IsEnum, IsNumber, IsPositive, Min, IsISO8601, IsOptional, IsInt, Max, IsBoolean } from 'class-validator';
import { CouponType, CouponTarget, CouponStatus } from '../entities/coupon.entity'; // CORRIGIDO: Importar do arquivo de entidade local

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CouponType)
  type: CouponType; // Mapeia para 'valueType' no DB

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  value: number; // e.g., 0.10 for 10% or 10.00 for R$10

  @IsISO8601()
  validFrom: string;

  @IsISO8601()
  validUntil: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsEnum(CouponTarget)
  target: CouponTarget; // Mapeia para 'target' no DB

  @IsOptional()
  @IsString() // Could be IsUUID if targeting specific entities
  targetId?: string; // ID of service or provider if target is specific

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // Corresponds to 'isActive' in the schema
}