// backend-cleaning/src/coupons/dto/create-coupon.dto.ts
import { IsString, IsEnum, IsNumber, IsPositive, Min, IsISO8601, IsOptional, IsInt, Max, IsBoolean } from 'class-validator';
import { CouponType, CouponTarget, CouponStatus } from '@prisma/client'; // <<-- FIXED: Import from @prisma/client

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  value: number;

  @IsISO8601()
  validFrom: string;

  @IsISO8601()
  validUntil: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsEnum(CouponTarget)
  target: CouponTarget;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  firstBookingOnly?: boolean; // NOVO CAMPO
}