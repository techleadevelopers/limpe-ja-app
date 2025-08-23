// backend-cleaning/src/coupons/dto/update-coupon.dto.ts
import {
  IsString,
  IsNumber,
  Min,
  IsISO8601,
  IsOptional,
  IsInt,
  IsIn,
} from 'class-validator';

/**
 * Observações:
 * - 'type' aceita valores normalizados: 'PERCENT' | 'FIXED'
 *   (também aceitamos 'PERCENTAGE' e 'FIXED_AMOUNT' para retrocompatibilidade).
 * - 'target' usa 'GENERAL' | 'NEW_CLIENTS' | 'SPECIFIC_SERVICE' | 'SPECIFIC_PROVIDER'
 *   (também aceitamos 'ALL' como sinônimo de 'GENERAL').
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
  @IsIn(['PERCENT', 'FIXED', 'PERCENTAGE', 'FIXED_AMOUNT'])
  type?: 'PERCENT' | 'FIXED' | 'PERCENTAGE' | 'FIXED_AMOUNT';

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
  @IsIn(['GENERAL', 'ALL', 'NEW_CLIENTS', 'SPECIFIC_SERVICE', 'SPECIFIC_PROVIDER'])
  target?: 'GENERAL' | 'ALL' | 'NEW_CLIENTS' | 'SPECIFIC_SERVICE' | 'SPECIFIC_PROVIDER';

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'EXPIRED', 'USED_UP'])
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'USED_UP';

  @IsOptional()
  @IsString()
  description?: string;
}
