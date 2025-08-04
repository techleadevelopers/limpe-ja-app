// src/chat/dto/conversation-item.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ConversationItemDto {
  @ApiProperty({ description: 'ID do chat', example: 'uuid-do-chat-123' })
  id: string;

  @ApiProperty({ description: 'ID do outro participante da conversa', example: 'uuid-do-usuario-456' })
  otherUserId: string;

  @ApiProperty({ description: 'Nome do outro participante da conversa', example: 'João da Silva' })
  otherUserName: string;

  @ApiProperty({ description: 'URL do avatar do outro participante (opcional)', required: false, example: 'https://example.com/avatar.jpg' })
  otherUserAvatarUrl?: string;

  @ApiProperty({ description: 'Conteúdo da última mensagem', example: 'Olá, tudo bem?' })
  lastMessage: string;

  @ApiProperty({ description: 'Timestamp da última mensagem (ISO 8601)', example: '2023-10-27T10:00:00.000Z' })
  lastMessageTimestamp: string;

  @ApiProperty({ description: 'Número de mensagens não lidas', example: 3 })
  unreadCount: number;
}