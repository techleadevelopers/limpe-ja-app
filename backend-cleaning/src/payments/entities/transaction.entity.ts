// src/payments/entities/transaction.entity.ts
import { Transaction as PrismaTransaction, TransactionType, Prisma } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PixKeyType } from '@prisma/client'; // Corrigido: importar diretamente do Prisma

export class TransactionEntity implements PrismaTransaction {
  @ApiProperty({ description: 'ID da transação', example: 'uuid-da-transacao' })
  id: string;

  @ApiProperty({ description: 'ID do provedor envolvido na transação', example: 'uuid-do-provedor' })
  providerId: string;

  @ApiProperty({ description: 'Valor da transação', example: 150.75 })
  amount: Prisma.Decimal;

  @ApiProperty({ enum: TransactionType, description: 'Tipo da transação (PAGAMENTO, SAQUE, COMISSÃO)', example: TransactionType.PAYMENT })
  type: TransactionType;

  @ApiProperty({ description: 'Status da transação (e.g., PENDING, PROCESSING, COMPLETED, FAILED)', example: 'COMPLETED' })
  status: string;

  @ApiPropertyOptional({ description: 'Descrição da transação', example: 'Pagamento de serviço de limpeza' })
  description: string | null;

  @ApiProperty({ description: 'Data e hora de criação da transação', example: '2025-06-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'ID do agendamento associado à transação (se houver)', example: 'uuid-do-agendamento', nullable: true })
  bookingId: string | null;

  // Propriedades para integração com gateway de pagamento
  @ApiPropertyOptional({ description: 'ID da transação no gateway de pagamento (PagSeguro, Stripe, etc.)', example: 'pagseguro-txn-12345', nullable: true })
  gatewayTransactionId: string | null;

  @ApiPropertyOptional({ description: 'URL do QR Code gerado pelo gateway de pagamento (se aplicável)', example: 'https://example.com/qrcode.png', nullable: true })
  qrCodeUrl: string | null;

  // NOVO: Referência interna para transações (ex: recorrentes)
  @ApiPropertyOptional({ description: 'Referência interna para transações (ex: ID da assinatura para pagamentos recorrentes)', example: 'recurring_sub_123', nullable: true })
  transactionRef: string | null;

  // CORREÇÃO: Adicionado couponId
  @ApiPropertyOptional({ description: 'ID do cupom associado à transação (se houver)', example: 'uuid-do-cupom', nullable: true })
  couponId: string | null;

  // NOVO: Campos para chave PIX em transações de saque
  @ApiPropertyOptional({ description: 'Tipo da chave PIX utilizada para o saque', enum: PixKeyType, example: PixKeyType.CPF, nullable: true })
  pixKeyType: PixKeyType | null;

  @ApiPropertyOptional({ description: 'Chave PIX utilizada para o saque', example: '123.456.789-00', nullable: true })
  pixKey: string | null;

  @ApiPropertyOptional({ description: 'Chave PIX mascarada para exibição', example: '123****-00', nullable: true })
  pixKeyMasked: string | null;

  constructor(partial: Partial<PrismaTransaction>) {
    Object.assign(this, partial);
  }
}
