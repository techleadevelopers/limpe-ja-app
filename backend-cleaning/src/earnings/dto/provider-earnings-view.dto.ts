import { ApiProperty } from '@nestjs/swagger';

export class ProviderEarningsViewDto {
  @ApiProperty({
    description:
      'Indica se o módulo de ganhos deve ser exibido (há valores para mostrar).',
    example: true,
  })
  showEarnings: boolean;

  @ApiProperty({
    description: 'Indica se o provedor possui saldo disponível para saque.',
    example: true,
  })
  canWithdraw: boolean;

  constructor(totalGrossSales: number, availableForWithdrawal: number) {
    this.showEarnings = totalGrossSales > 0 || availableForWithdrawal > 0;
    this.canWithdraw = availableForWithdrawal > 0;
  }
}
