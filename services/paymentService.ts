// LimpeJaApp/app/services/paymentService.ts
import axios from 'axios';
import { api } from './api';

import { MessageResponseDto } from '../types/backend/auth';
import { CreatePixChargeDto, PixChargeResponseDto, RequestWithdrawalDto, PaymentIntent } from '../types/backend/payments';

export const createPixCharge = async (clientUserId: string, data: CreatePixChargeDto): Promise<PixChargeResponseDto> => {
  try {
    const response = await api.post<PixChargeResponseDto>('/payments/pix-charge', data);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar cobrança PIX:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao criar cobrança PIX.');
    }
    throw new Error('Erro de rede ou servidor ao criar cobrança PIX.');
  }
};

export const requestWithdrawal = async (data: RequestWithdrawalDto): Promise<MessageResponseDto> => {
  try {
    const response = await api.post<MessageResponseDto>('/payments/withdrawal', data);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao solicitar saque:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao solicitar saque.');
    }
    throw new Error('Erro de rede ou servidor ao solicitar saque.');
  }
};

export const fetchPaymentIntent = async (bookingId: string): Promise<PaymentIntent> => {
  try {
    const response = await api.get<PaymentIntent>(`/payments/intent/${bookingId}`, {
      headers: { 'x-silent': '1' },
    });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar PaymentIntent:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar PaymentIntent.');
    }
    throw new Error('Erro de rede ao buscar PaymentIntent.');
  }
};
