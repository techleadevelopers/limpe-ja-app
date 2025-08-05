// LimpeJaApp/services/couponService.ts
import api from './api'; // Assuming you have an api.ts for Axios instance
import { CouponApplicationResult } from '../types/backend/coupons';
import { CreateBookingDto } from '../types/backend/bookings'; // Assuming booking DTO exists

interface ApplyCouponPayload {
  code: string;
  bookingData: Partial<CreateBookingDto>;
}

export const applyCoupon = async (data: ApplyCouponPayload): Promise<CouponApplicationResult> => {
  const response = await api.post<CouponApplicationResult>('/coupons/apply', data);
  return response.data;
};