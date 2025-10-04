// LimpeJaApp/services/couponService.ts
import { api } from './api';
import { CouponApplicationResult } from '../types/backend/coupons';
import { CreateBookingDto } from '../types/backend/bookings';
import axios from 'axios';

interface ApplyCouponPayload {
  code: string;
  bookingData: {
    originalPrice?: number;
    clientId?: string;
    providerServiceId?: string;
    providerId?: string;
    scheduledDate?: string;
  };
}

export const applyCoupon = async (data: ApplyCouponPayload): Promise<CouponApplicationResult> => {
  try {
    const response = await api.post<CouponApplicationResult>('/coupons/apply', data);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao aplicar cupom:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Não foi possível aplicar o cupom.');
    }
    throw new Error('Erro de rede ou servidor ao aplicar cupom.');
  }
};