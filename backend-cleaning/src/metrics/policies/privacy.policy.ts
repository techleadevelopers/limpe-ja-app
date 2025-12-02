// src/metrics/policies/privacy.policy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class PrivacyPolicy {
  /**
   * Garante que o usuário autenticado (userId) está tentando acessar seus próprios dados.
   * @param authenticatedUserId O ID do usuário obtido do token JWT.
   * @param requestedUserId O ID do usuário cujos dados estão sendo solicitados (se aplicável).
   * @throws UnauthorizedException se os IDs não corresponderem.
   */
  ensureUserAccess(
    authenticatedUserId: string,
    requestedUserId?: string,
  ): void {
    if (requestedUserId && authenticatedUserId !== requestedUserId) {
      throw new UnauthorizedException(
        'Você não tem permissão para acessar os dados deste usuário.',
      );
    }
    // Se requestedUserId não for fornecido, assume-se que a operação é sobre os dados do próprio authenticatedUserId
  }

  // Outras regras de privacidade podem ser adicionadas aqui, como anonimização, retenção, etc.
}
