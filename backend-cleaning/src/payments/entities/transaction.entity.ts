// src/payments/entities/transaction.entity.ts
import { Transaction as PrismaTransaction, TransactionType, Prisma } from '@prisma/client'; // <-- Importar Prisma
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionEntity implements PrismaTransaction {
  @ApiProperty({ description: 'ID da transação', example: 'uuid-da-transacao' })
  id: string;

  @ApiProperty({ description: 'ID do provedor envolvido na transação', example: 'uuid-do-provedor' })
  providerId: string;

  @ApiProperty({ description: 'Valor da transação', example: 150.75 })
  amount: Prisma.Decimal;

  @ApiProperty({ enum: TransactionType, description: 'Tipo da transação (PAGAMENTO, SAQUE, COMISSÃO)', example: TransactionType.PAYMENT })
  type: TransactionType;

  @ApiProperty({ description: 'Status da transação (e.g., PENDING, COMPLETED, FAILED)', example: 'COMPLETED' })
  status: string;

  @ApiPropertyOptional({ description: 'Descrição da transação', example: 'Pagamento de serviço de limpeza' })
  description: string | null;

  @ApiProperty({ description: 'Data e hora de criação da transação', example: '2025-06-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'ID do agendamento associado à transação (se houver)', example: 'uuid-do-agendamento', nullable: true })
  bookingId: string | null; // Pode ser string ou null, conforme a definição do Prisma

  // Propriedades para integração com gateway de pagamento
  @ApiPropertyOptional({ description: 'ID da transação no gateway de pagamento (PagSeguro, Stripe, etc.)', example: 'pagseguro-txn-12345', nullable: true })
  gatewayTransactionId: string | null;

  @ApiPropertyOptional({ description: 'URL do QR Code gerado pelo gateway de pagamento (se aplicável)', example: 'https://example.com/qrcode.png', nullable: true })
  qrCodeUrl: string | null;

  // provider: Provider; // Relação, não incluída diretamente na entidade para DTO de saída

  constructor(partial: Partial<PrismaTransaction>) {
    Object.assign(this, partial);
  }
}