import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client'; // Importar Prisma para Decimal
import { ProviderEarningsViewDto } from './provider-earnings-view.dto';

// Exemplo de uma entidade de transação simples para fins de tipagem no DTO
// Ajustado para refletir o schema.prisma anterior
class TransactionDto {
  @ApiProperty({ description: 'ID da transação', example: 'trans_123' })
  id: string;

  @ApiProperty({ description: 'Valor da transação', example: 50.75 })
  amount: number; // Ou string, se representar Prisma.Decimal no frontend

  // AJUSTADO: Tipos do enum TransactionType do schema.prisma anterior
  @ApiProperty({
    description: 'Tipo da transação (pagamento, saque, comissão)',
    example: 'PAYMENT',
  })
  type: 'PAYMENT' | 'WITHDRAWAL' | 'COMMISSION';

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Serviço de Limpeza ABN123',
  })
  description: string;

  @ApiProperty({
    description: 'Data/hora de criação da transação',
    example: '2025-06-07T10:00:00Z',
  })
  createdAt: string;
}

export class EarningsResponseDto {
  @ApiProperty({
    description: 'Total de ganhos acumulados do provedor',
    example: 5000.0,
  })
  totalEarnings: number;

  @ApiProperty({ description: 'Valor disponível para saque', example: 1200.5 })
  availableForWithdrawal: number;

  @ApiProperty({
    description: 'Valor total de saques pendentes',
    example: 200.0,
  })
  pendingWithdrawals: number;

  @ApiPropertyOptional({
    description:
      'Soma de agendamentos pagos (PIX confirmado) ainda não concluídos',
    example: 350.0,
  })
  preApprovedEarnings?: number;

  @ApiPropertyOptional({
    type: [TransactionDto],
    description: 'Lista das transações mais recentes (para gráficos e lista)',
  })
  recentTransactions?: TransactionDto[];

  @ApiPropertyOptional({
    description:
      'Breakdown dos ganhos por período (ex: mensal, semanal) para gráficos',
    example: { 'Jan 2025': 1500, 'Fev 2025': 2000, 'Mar 2025': 1800 },
  })
  earningsBreakdown?: { [period: string]: number }; // Para o EarningsChartSection

  @ApiProperty({
    description:
      'Recomendações de visualização para o módulo de ganhos (mostrar botões, CTA, etc).',
    type: () => ProviderEarningsViewDto,
  })
  earningsView: ProviderEarningsViewDto;
}

export class WithdrawalRequestDto {
  @ApiProperty({ description: 'Valor a ser sacado', example: 100.0 })
  amount: number;

  @ApiPropertyOptional({
    description: 'Informações da conta bancária para saque (ex: chave PIX)',
    example: 'minhachavepix@email.com',
  })
  withdrawalAccountInfo?: string; // Ou um DTO mais complexo para detalhes bancários
}

export class WithdrawalResponseDto {
  @ApiProperty({ description: 'Status da solicitação de saque', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem de retorno sobre a solicitação',
    example:
      'Solicitação de saque de R$ 100.00 enviada com sucesso. Processamento em até 2 dias úteis.',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'ID da transação de saque gerada',
    example: 'withdrawal_abc123',
  })
  transactionId?: string;
}
