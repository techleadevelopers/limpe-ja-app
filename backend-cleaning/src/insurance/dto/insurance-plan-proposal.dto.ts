import { ApiProperty } from '@nestjs/swagger';
import { InsurancePlanProposal } from '../insurance.service';
import { InsurancePlanId } from '../insurance.constants';

export class InsurancePlanProposalDto implements InsurancePlanProposal {
  @ApiProperty({ description: 'Identificador do plano', example: InsurancePlanId.ESSENCIAL })
  id: InsurancePlanId;

  @ApiProperty({ description: 'Nome exibido do plano', example: 'Essencial' })
  name: string;

  @ApiProperty({ description: 'Preço base em centavos', example: 2490 })
  basePriceCents: number;

  @ApiProperty({ description: 'Cobertura máxima em centavos', example: 70000 })
  coverageCents: number;

  @ApiProperty({ description: 'Franquia em centavos', example: 20000 })
  deductibleCents: number;

  @ApiProperty({ description: 'Se prova é exigida', example: false })
  proofRequired: boolean;

  @ApiProperty({ description: 'Preço final com risco aplicado', example: 2990 })
  finalPriceCents: number;

  @ApiProperty({ description: 'Elegibilidade do plano', example: true })
  eligible: boolean;

  @ApiProperty({ description: 'Razões de ineligibilidade', example: [] })
  reasons: string[];

  @ApiProperty({ description: 'Multiplicador de risco em bps', example: 400 })
  riskMultiplierBps: number;

  constructor(source: InsurancePlanProposal) {
    Object.assign(this, source);
  }
}
