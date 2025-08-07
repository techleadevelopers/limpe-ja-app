// LimpeJaApp/services/couponService.ts
import api from './api'; // Assuming you have an api.ts for Axios instance
import { CouponApplicationResult } from '../types/backend/coupons'; // Certifique-se de que CouponApplicationResult está atualizado
import { CreateBookingDto } from '../types/backend/bookings'; // Assuming booking DTO exists - Certifique-se de que CreateBookingDto inclui couponCode
import axios from 'axios'; // <-- Adicione esta linha para importar a biblioteca axios

// CORREÇÃO: Ajustado ApplyCouponPayload para refletir o que o backend espera no método applyCoupon
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
    // O backend espera um payload como { code: string, userId: string, bookingData: { ... } }
    // O userId será extraído do token JWT no backend.
    // O bookingData deve ser passado conforme a estrutura esperada pelo backend.
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