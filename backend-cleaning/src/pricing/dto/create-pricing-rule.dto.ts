// backend-cleaning/src/pricing/dto/create-pricing-rule.dto.ts
import { IsString, IsOptional, IsInt, Min, Max, IsNumber, IsBoolean, IsDecimal } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePricingRuleDto {
  @IsOptional()
  @IsString() // Or IsUUID if zoneId refers to a specific Zone entity
  zoneId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6) // 0 for Sunday, 6 for Saturday
  dayOfWeek?: number;

  @IsOptional()
  @IsString() // HH:MM format
  @Transform(({ value }) => value.match(/^([01]\d|2[0-3]):([0-5]\d)$/) ? value : undefined) // Basic HH:MM validation
  startTime?: string;

  @IsOptional()
  @IsString() // HH:MM format
  @Transform(({ value }) => value.match(/^([01]\d|2[0-3]):([0-5]\d)$/) ? value : undefined) // Basic HH:MM validation
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  demandThreshold?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01) // Surge factor must be positive
  @Max(5.00) // Arbitrary max for a surge factor
  surgeFactor: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}