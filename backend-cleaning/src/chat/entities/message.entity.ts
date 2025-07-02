// src/chat/entities/message.entity.ts
import { Message as PrismaMessage } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Message implements PrismaMessage {
  @ApiProperty({ description: 'ID da mensagem', example: 'uuid-da-mensagem' })
  id: string;

  @ApiProperty({ description: 'ID da conversa', example: 'uuid-da-conversa' })
  chatId: string;

  @ApiProperty({ description: 'ID do remetente', example: 'uuid-do-remetente' })
  senderId: string;

  @ApiProperty({ description: 'ID do destinatário', example: 'uuid-do-destinatario' })
  receiverId: string;

  @ApiProperty({ description: 'Conteúdo da mensagem', example: 'Olá, tudo bem?' })
  content: string;

  @ApiProperty({ description: 'Timestamp da mensagem', example: '2025-06-01T10:00:00.000Z' })
  timestamp: Date;

  @ApiProperty({ description: 'Status de leitura da mensagem', example: false })
  isRead: boolean;

  // Propriedades adicionadas para alinhar com o PrismaMessage
  @ApiProperty({ description: 'Data e hora de criação da mensagem', example: '2025-06-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'URL de destino para a notificação associada à mensagem', example: '/app/messages/chatId', nullable: true })
  targetUrl: string | null;

  // Propriedades de relação (não incluídas diretamente no construtor para simplicidade, mas presentes no tipo Prisma)
  // sender: User;
  // receiver: User;

  constructor(partial: Partial<PrismaMessage>) {
    Object.assign(this, partial);
  }
}
