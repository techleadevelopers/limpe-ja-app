// backend-cleaning/src/pricing/dto/update-pricing-rule.dto.ts
import { IsString, IsOptional, IsInt, Min, Max, IsNumber, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePricingRuleDto {
  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.match(/^([01]\d|2[0-3]):([0-5]\d)$/) ? value : undefined)
  startTime?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.match(/^([01]\d|2[0-3]):([0-5]\d)$/) ? value : undefined)
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  demandThreshold?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(5.00)
  surgeFactor?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}