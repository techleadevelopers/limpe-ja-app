// src/chat/dto/chat-details.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ChatDetailsDto {
  @ApiProperty({ description: 'ID único da conversa de chat', example: 'uuid-do-chat-gerado-ou-encontrado' })
  @IsString()
  @IsUUID() // Assumindo que o chatId gerado/encontrado será um UUID
  chatId: string;

  // Opcional: Se o backend retornar mais detalhes sobre o chat,
  // como os IDs dos participantes ou data de criação/atualização,
  // eles podem ser adicionados aqui. Por enquanto, focamos no chatId.
  // @ApiProperty({ description: 'ID do cliente participante do chat', example: 'uuid-do-cliente' })
  // @IsUUID()
  // clientId: string;

  // @ApiProperty({ description: 'ID do provedor participante do chat', example: 'uuid-do-provedor' })
  // @IsUUID()
  // providerId: string;

  constructor(chatId: string) {
    this.chatId = chatId;
  }
}