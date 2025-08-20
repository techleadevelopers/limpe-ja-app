// backend-cleaning/src/coupons/dto/update-coupon.dto.ts
import { IsString, IsEnum, IsNumber, IsPositive, Min, IsISO8601, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { CouponType, CouponTarget, CouponStatus } from '@prisma/client'; // Importar do Prisma

export class UpdateBookingStatusDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType; // Mapeia para 'valueType' no DB

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  value?: number;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxUses?: number;

  @IsOptional()
  @IsEnum(CouponTarget)
  target?: CouponTarget; // Mapeia para 'target' no DB

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}