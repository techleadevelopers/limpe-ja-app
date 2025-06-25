// src/chat/dto/send-message.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'ID da conversa à qual a mensagem pertence', example: 'uuid-da-conversa' })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ description: 'ID do destinatário da mensagem', example: 'uuid-do-destinatario' })
  @IsString()
  @IsNotEmpty()
  receiverId: string; // O remetente será obtido do token JWT

  @ApiProperty({ description: 'Conteúdo da mensagem', example: 'Preciso reagendar o serviço para amanhã.' })
  @IsString()
  @IsNotEmpty()
  content: string;
}