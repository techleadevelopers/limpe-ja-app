// LimpeJaApp/services/couponService.ts
import { api } from './api';
import { createLocalConsole } from './logging';
const console = createLocalConsole();
import { CouponApplicationResult } from '../types/backend/coupons';
import { CreateBookingDto } from '../types/backend/bookings';
import axios from 'axios';

// Lista de cupons do usuário logado (para a tela "Meus Cupons")
export type MyCouponListItem = {
  id: string;
  code: string;
  description?: string;
  validUntil: string;
  value: number;
  valueType: 'PERCENT' | 'FIXED' | 'PERCENTAGE' | 'FIXED_AMOUNT' | string;
  status?: string; // e.g., ACTIVE, USED, EXPIRED, USED_UP, INACTIVE
  minOrderValue?: number;
  imageUrl?: string;
};

export const getMyCoupons = async (): Promise<MyCouponListItem[]> => {
  try {
    // Backend expõe GET /coupons/me (não /coupons/my)
    const response = await api.get<MyCouponListItem[]>('/coupons/me');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao listar cupons do usuário:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Não foi possível carregar seus cupons.');
    }
    throw new Error('Erro de rede ou servidor ao carregar cupons.');
  }
};

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

export const resolveCoupon = async (
  code: string,
  bookingData?: { originalPrice?: number; providerServiceId?: string; providerId?: string; scheduledDate?: string }
) => {
  try {
    const params: Record<string, any> = {
      originalPrice: bookingData?.originalPrice,
      providerServiceId: bookingData?.providerServiceId,
      providerId: bookingData?.providerId,
      scheduledDate: bookingData?.scheduledDate,
    };
    const response = await api.get<CouponApplicationResult>(`/coupons/resolve/${encodeURIComponent(code)}`, { params });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao resolver cupom:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Não foi possível validar o cupom.');
    }
    throw new Error('Erro de rede ou servidor ao validar cupom.');
  }
};
