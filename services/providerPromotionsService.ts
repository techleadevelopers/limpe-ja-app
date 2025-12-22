import axios from 'axios';
import { api } from './api';
import {
  ProviderPromotionDto,
  CreateProviderPromotionPayload,
  UpdateProviderPromotionPayload,
} from '../types/backend/providerPromotions';

const BASE_PATH = '/provider/promotions';

export async function listProviderPromotions(): Promise<ProviderPromotionDto[]> {
  try {
    const response = await api.get<ProviderPromotionDto[]>(BASE_PATH);
    return response.data;
  } catch (error: unknown) {
    console.error('Erro ao buscar promoções do provedor:', (axios.isAxiosError(error) ? error.response?.data ?? error.message : error));
    throw error;
  }
}

export async function createProviderPromotion(
  payload: CreateProviderPromotionPayload,
): Promise<ProviderPromotionDto> {
  try {
    const response = await api.post<ProviderPromotionDto>(BASE_PATH, payload);
    return response.data;
  } catch (error: unknown) {
    console.error('Erro ao criar promoção do provedor:', (axios.isAxiosError(error) ? error.response?.data ?? error.message : error));
    throw error;
  }
}

export async function updateProviderPromotion(
  id: string,
  payload: UpdateProviderPromotionPayload,
): Promise<ProviderPromotionDto> {
  try {
    const response = await api.patch<ProviderPromotionDto>(`${BASE_PATH}/${id}`, payload);
    return response.data;
  } catch (error: unknown) {
    console.error('Erro ao atualizar promoção do provedor:', (axios.isAxiosError(error) ? error.response?.data ?? error.message : error));
    throw error;
  }
}
