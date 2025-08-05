// backend-cleaning/src/coupons/dto/update-coupon.dto.ts
import { IsString, IsEnum, IsNumber, IsPositive, Min, IsISO8601, IsOptional, IsInt } from 'class-validator';
import { CouponType, CouponTarget, CouponStatus } from '../entities/coupon.entity';

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

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
  target?: CouponTarget;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;
}