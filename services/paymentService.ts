// LimpeJaApp/app/services/paymentService.ts
import axios from 'axios'; // Importar axios para isAxiosError
import api from './api'; // Importa a instância centralizada do Axios

// Importar DTOs de pagamento
import { MessageResponseDto } from '../types/backend/auth';
import { CreatePixChargeDto, PixChargeResponseDto, RequestWithdrawalDto } from '../types/backend/payments'; // CORREÇÃO AQUI: Adicionado RequestWithdrawalDto

/**
 * @function createPixCharge
 * Cria uma cobrança PIX.
 * @param clientUserId O ID do usuário cliente logado (vem do useAuth).
 * @param data DTO com os detalhes da cobrança.
 * @returns Promessa com os dados da cobrança PIX.
 */
export const createPixCharge = async (clientUserId: string, data: CreatePixChargeDto): Promise<PixChargeResponseDto> => {
  try {
    // O 'data' já conterá o 'providerId' e outros campos conforme o CreatePixChargeDto atualizado.
    // O clientUserId será extraído do token JWT no backend, então não precisa ser enviado no body.
    // A resposta será automaticamente mapeada para PixChargeResponseDto atualizado.
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

/**
 * @function requestWithdrawal
 * Solicita um saque de ganhos do provedor.
 * @param data DTO com o valor do saque.
 * @returns Promessa com a mensagem de resposta.
 */
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
