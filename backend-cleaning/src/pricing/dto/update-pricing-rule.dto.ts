// backend-cleaning/src/pricing/dto/update-pricing-rule.dto.ts
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PricingScope } from '@prisma/client';

export class UpdatePricingRuleDto {
  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsEnum(PricingScope)
  scope?: PricingScope;

  @IsOptional()
  @IsString()
  cityCode?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
      ? value
      : undefined,
  )
  startTime?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
      ? value
      : undefined,
  )
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  demandThreshold?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(5.0)
  surgeFactor?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(5.0)
  maxMultiplier?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
