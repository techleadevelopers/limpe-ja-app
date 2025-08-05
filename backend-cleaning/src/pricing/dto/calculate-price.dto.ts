// backend-cleaning/src/pricing/dto/calculate-price.dto.ts
import { IsUUID, IsNumber, IsISO8601, IsOptional, Min, Max } from 'class-validator';

export class CalculatePriceDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  providerId?: string; // Optional, if calculating for a specific provider

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
}

export interface DynamicPriceResult {
  originalPrice: number;
  surgeFactor: number;
  finalPrice: number;
  reason?: string; // e.g., "Alta demanda na sua região"
}