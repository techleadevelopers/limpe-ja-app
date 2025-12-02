// backend-cleaning/src/coupons/dto/update-coupon.dto.ts
import {
  IsString,
  IsNumber,
  Min,
  IsISO8601,
  IsOptional,
  IsInt,
  IsIn,
  IsBoolean,
} from 'class-validator';

/**
 * Observações:
 * - 'type' aceita valores normalizados: 'PERCENT' | 'FIXED'.
 * - 'target' usa 'GENERAL' | 'NEW_CLIENTS' | 'SPECIFIC_SERVICE' | 'SPECIFIC_PROVIDER'.
 * - 'status' usa 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'USED_UP'.
 * - 'value':
 *     • se type = 'PERCENT', informe FRAÇÃO (ex.: 0.20 para 20%)
 *     • se type = 'FIXED', informe valor absoluto em moeda.
 */
export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsIn(['PERCENT', 'FIXED']) // <<-- FIXED: Removed 'PERCENTAGE', 'FIXED_AMOUNT'
  type?: 'PERCENT' | 'FIXED';

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
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
  @IsIn([
    'GENERAL',
    'NEW_CLIENTS',
    'SPECIFIC_SERVICE',
    'SPECIFIC_PROVIDER',
    'NEW_CUSTOMER',
    'REFERRAL_REFERRED',
    'REFERRAL_REFERRER',
    'MISSION_REWARD',
    'REPEAT_CUSTOMER',
  ]) // <<-- FIXED: Replaced 'ALL' with 'GENERAL' and added new targets
  target?:
    | 'GENERAL'
    | 'NEW_CLIENTS'
    | 'SPECIFIC_SERVICE'
    | 'SPECIFIC_PROVIDER'
    | 'NEW_CUSTOMER'
    | 'REFERRAL_REFERRED'
    | 'REFERRAL_REFERRER'
    | 'MISSION_REWARD'
    | 'REPEAT_CUSTOMER';

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'EXPIRED', 'USED_UP'])
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'USED_UP';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  firstBookingOnly?: boolean;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  maxDiscount?: number;
}
