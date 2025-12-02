// backend-cleaning/src/subscriptions/dto/update-subscription.dto.ts
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import {
  SubscriptionFrequency,
  SubscriptionStatus,
} from '../entities/subscription.entity';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsEnum(SubscriptionFrequency)
  frequency?: SubscriptionFrequency;

  @IsOptional()
  @IsISO8601({ strict: true })
  endDate?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  totalPrice?: number;
}
