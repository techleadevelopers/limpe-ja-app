// src/types/backend/earning.ts

import { ProviderTransaction } from './providers'; // Importar a tipagem da transação

/**
 * @interface EarningsResponseDto
 * DTO de resposta para o endpoint `GET /providers/me/earnings`.
 * Contém um resumo financeiro e a lista de transações recentes do provedor.
 */
export interface EarningsResponseDto {
  /**
   * O total de ganhos acumulados pelo provedor, em centavos.
   * @example 1500.50
   */
  totalEarnings: number;

  /**
   * O valor disponível para saque, em centavos.
   * @example 500.25
   */
  availableForWithdrawal: number;

  /**
   * Uma lista das transações recentes do provedor (ganhos e saques).
   */
  transactions: ProviderTransaction[];
}

/**
 * @interface GetMyProviderEarnings
 * Alias para EarningsResponseDto para maior clareza.
 */
export type GetMyProviderEarnings = EarningsResponseDto;