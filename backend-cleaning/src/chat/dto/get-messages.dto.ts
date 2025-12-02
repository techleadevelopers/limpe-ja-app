// src/chat/dto/get-messages.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumberString } from 'class-validator';

export class GetMessagesDto {
  @ApiPropertyOptional({
    description: 'Número de mensagens a serem puladas (offset para paginação)',
    example: 0,
  })
  @IsOptional()
  @IsNumberString()
  offset?: string;

  @ApiPropertyOptional({
    description:
      'Número máximo de mensagens a serem retornadas (limite para paginação)',
    example: 50,
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
