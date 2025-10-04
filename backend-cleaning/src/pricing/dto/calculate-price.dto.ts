// backend-cleaning/src/pricing/dto/calculate-price.dto.ts
import { IsUUID, IsNumber, IsISO8601, IsOptional, Min, Max, IsString } from 'class-validator';

export class CalculatePriceDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  providerId?: string; // Optional, if calculating for a specific provider

  @IsOptional()
  @IsString()
  cityCode?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsISO8601()
  scheduledDate: string; // Full ISO date string including time

  @IsOptional()
  @IsString()
  timezone?: string;
}

export interface DynamicPriceResult {
  originalPrice: number;
  surgeFactor: number;
  finalPrice: number;
  appliedRules: Array<{ id: string; scope: string; multiplier: number }>;
  reason?: string;
}
