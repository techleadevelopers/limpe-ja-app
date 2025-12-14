// app/services/earningsService.ts

// CORREÇÃO: As tipagens de saque são do modulo de pagamentos
import { RequestWithdrawalDto } from '../types/backend/payments';
// CORREÇÃO: A tipagem de ganhos é do módulo de provedores, onde EarningsResponseDto foi definida
import { EarningsResponseDto, ProviderTransaction } from '../types/backend/providers';
import { WithdrawalResponseDto } from '../types/backend/earning';

// Outras importações
import { api } from './api';
import { createLocalConsole } from './logging';
const console = createLocalConsole(); // Supondo que 'api' é sua instância configurada do axios

/**
 * Busca todos os dados de ganhos do provedor logado.
 * Corresponde ao `GET /providers/me/earnings` do backend.
 * O tipo de retorno esperado é EarningsResponseDto.
 * @returns Uma Promise que resolve para um objeto EarningsResponseDto.
 */
export async function getMyProviderEarnings(): Promise<EarningsResponseDto> {
    try {
        // A resposta da API deve corresponder à estrutura de EarningsResponseDto
        const response = await api.get<EarningsResponseDto>('/providers/me/earnings');
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
// Extensão do retorno para incluir dicas de UI (ex.: payoutId/eta)
export type WithdrawalResponseWithHints = WithdrawalResponseDto & {
    uiHints?: {
        payoutId?: string;
        eta?: string; // Ex.: "24h" – UI decide como exibir/localizar
    };
};

export async function requestWithdrawal(withdrawalDto: RequestWithdrawalDto): Promise<WithdrawalResponseWithHints> {
    try {
        const response = await api.post<WithdrawalResponseDto>('/providers/me/earnings/withdrawal', withdrawalDto);
        const base = response.data;
        // Mapear transactionId -> payoutId (hint para UI) e fornecer ETA padrão
        return {
            ...base,
            uiHints: {
                payoutId: base.transactionId,
                eta: '24h',
            },
        };
    } catch (error: any) {
        console.error("[earningsService] Erro ao solicitar saque:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}


