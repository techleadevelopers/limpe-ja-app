// app/services/earningsService.ts

// CORREÃ‡ÃƒO: As tipagens de saque sÃ£o do mÃ³dulo de pagamentos
import { RequestWithdrawalDto } from '../types/backend/payments';
// CORREÃ‡ÃƒO: A tipagem de ganhos Ã© do mÃ³dulo de provedores, onde EarningsResponseDto foi definida
import { EarningsResponseDto, ProviderTransaction } from '../types/backend/providers';
import { WithdrawalResponseDto } from '../types/backend/earning';

// Outras importaÃ§Ãµes
import { api } from './api'; // Supondo que 'api' Ã© sua instÃ¢ncia configurada do axios

/**
 * Busca todos os dados de ganhos do provedor logado.
 * Corresponde ao `GET /providers/me/earnings` do backend.
 * O tipo de retorno esperado Ã© EarningsResponseDto.
 * @returns Uma Promise que resolve para um objeto EarningsResponseDto.
 */
export async function getMyProviderEarnings(): Promise<EarningsResponseDto> {
    try {
        // A resposta da API deve corresponder Ã  estrutura de EarningsResponseDto
        const response = await api.get<EarningsResponseDto>('/providers/me/earnings');
        return response.data;
    } catch (error: any) {
        console.error("[earningsService] Erro ao buscar ganhos:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
}

/**
 * Envia uma solicitaÃ§Ã£o de saque para o provedor logado.
 * Corresponde ao `POST /payments/withdrawal` do backend.
 * @param withdrawalDto Os detalhes da solicitaÃ§Ã£o de saque.
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

