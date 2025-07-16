// app/services/earningsService.ts
// CORREÇÃO: Importar a instância 'api' como default export ou com chaves, dependendo de como ela é exportada.
// A mensagem de erro "Você quis dizer 'importar api de "./api"' em vez disso?" indica que 'api'
// pode ser o default export, ou que está faltando chaves. Vamos tentar com chaves primeiro,
// pois é mais comum para instâncias de axios nomeadas.
import api from './api'; // Se o seu 'api.ts' exporta 'export const api = axios.create(...);'
// OU:
// import api from './api'; // Se o seu 'api.ts' exporta 'export default axios.create(...);'

// CORREÇÃO: As tipagens estão em '../types/backend/providers.ts'
import {
  EarningsResponseDto,
  WithdrawalRequestDto,
  WithdrawalResponseDto,
} from '../app/types/backend/providers';

/**
 * Busca todos os dados de ganhos do provedor logado.
 * Corresponde ao `GET /providers/me/earnings` do backend.
 * @returns Uma Promise que resolve para um objeto EarningsResponseDto.
 */
export async function getMyProviderEarnings(): Promise<EarningsResponseDto> {
  try {
    const response = await api.get<EarningsResponseDto>('/providers/me/earnings');
    return response.data;
  } catch (error: any) {
    // É importante lançar o erro para que o componente que chamou possa tratá-lo
    // loga o erro para depuração
    console.error("[earningsService] Erro ao buscar ganhos:", error.response?.data || error.message);
    throw error.response?.data || error; // Lança o erro para ser tratado pelo chamador
  }
}

/**
 * Envia uma solicitação de saque para o provedor logado.
 * Corresponde ao `POST /payments/withdrawal` do backend.
 * @param withdrawalDto Os detalhes da solicitação de saque.
 * @returns Uma Promise que resolve para um objeto WithdrawalResponseDto.
 */
export async function requestWithdrawal(withdrawalDto: WithdrawalRequestDto): Promise<WithdrawalResponseDto> {
  try {
    const response = await api.post<WithdrawalResponseDto>('/payments/withdrawal', withdrawalDto);
    return response.data;
  } catch (error: any) {
    // É importante lançar o erro para que o componente que chamou possa tratá-lo
    // loga o erro para depuração
    console.error("[earningsService] Erro ao solicitar saque:", error.response?.data || error.message);
    throw error.response?.data || error; // Lança o erro para ser tratado pelo chamador
  }
}