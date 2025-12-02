// src/support/dto/update-ticket.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    description: 'Corpo da mensagem a ser adicionada ao ticket',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  body?: string;

  @ApiPropertyOptional({ description: 'URLs de novos anexos (para mensagens)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
