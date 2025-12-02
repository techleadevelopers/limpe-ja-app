// backend-cleaning/src/subscriptions/dto/create-subscription.dto.ts
import {
  IsUUID,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { SubscriptionFrequency } from '../entities/subscription.entity'; // Assuming entity defines enum

export class CreateSubscriptionDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  providerId: string;

  @IsUUID()
  providerServiceId: string;

  @IsEnum(SubscriptionFrequency)
  frequency: SubscriptionFrequency;

  @IsISO8601()
  startDate: string; // ISO date string (e.g., '2023-10-27T10:00:00Z')

  @IsISO8601({ strict: true })
  endDate?: string; // Optional end date

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  totalPrice: number; // Price per generated booking/cycle
}
