// app/services/earningsService.ts

// CORREÇÃO: As tipagens de saque são do módulo de pagamentos
import { RequestWithdrawalDto, PixChargeResponseDto } from '../types/backend/payments';
// CORREÇÃO: A tipagem de ganhos é do módulo de ganhos
import { EarningsResponseDto } from '../types/backend/earning';
// CORREÇÃO: A tipagem de transações é do módulo de provedores
import { ProviderTransaction } from '../types/backend/providers';

// Outras importações
import api from './api';

/**
 * Interface que representa a resposta completa do endpoint de ganhos.
 * Como o backend não tem um EarningsResponseDto explícito na sua documentação,
 * vamos construir um tipo aqui para ser compatível com a estrutura esperada.
 * Geralmente, inclui um resumo e a lista de transações.
 */
interface EarningsResponse {
    totalEarnings: number;
    pendingWithdrawals: number;
    transactions: ProviderTransaction[];
}

/**
 * Busca todos os dados de ganhos do provedor logado.
 * Corresponde ao `GET /providers/me/earnings` do backend.
 * @returns Uma Promise que resolve para um objeto EarningsResponse.
 */
export async function getMyProviderEarnings(): Promise<EarningsResponse> {
    try {
        const response = await api.get<EarningsResponse>('/providers/me/earnings');
        return response.data;
    } catch (error: any) {
        console.error("[earningsService] Erro ao buscar ganhos:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}

/**
 * Envia uma solicitação de saque para o provedor logado.
 * Corresponde ao `POST /payments/withdrawal` do backend.
 * @param withdrawalDto Os detalhes da solicitação de saque.
 * @returns Uma Promise que resolve para um objeto de resposta de saque.
 */
export async function requestWithdrawal(withdrawalDto: RequestWithdrawalDto): Promise<PixChargeResponseDto> {
    try {
        const response = await api.post<PixChargeResponseDto>('/payments/withdrawal', withdrawalDto);
        return response.data;
    } catch (error: any) {
        console.error("[earningsService] Erro ao solicitar saque:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}