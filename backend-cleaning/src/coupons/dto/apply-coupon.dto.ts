// backend-cleaning/src/coupons/dto/apply-coupon.dto.ts
import { IsString, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUUID, IsNumber, IsISO8601 } from 'class-validator';

// A minimal DTO to represent booking data needed for coupon validation
// This should match the relevant fields of your CreateBookingDto
class BookingDataForCouponDto {
  @IsOptional()
  @IsUUID()
  clientId?: string; // Client applying the coupon

  @IsOptional()
  @IsUUID()
  providerServiceId?: string; // Service being booked

  @IsOptional()
  @IsUUID()
  providerId?: string; // Provider selected

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  originalPrice?: number; // The price before coupon application

  @IsOptional()
  @IsISO8601()
  scheduledDate?: string; // Date of the booking
}

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @ValidateNested()
  @Type(() => BookingDataForCouponDto)
  bookingData: BookingDataForCouponDto; // Data about the booking attempt
}

export interface CouponApplicationResult {
  discountAmount: number;
  newTotalPrice: number;
  message: string;
  coupon?: any; // The applied coupon object (optional)
}