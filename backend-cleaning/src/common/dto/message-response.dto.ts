// src/common/dto/message-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensagem de resposta',
    example: 'Operação realizada com sucesso.',
  })
  message: string;
}
