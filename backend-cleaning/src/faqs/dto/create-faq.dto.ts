// src/faqs/dto/create-faq.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ description: 'A pergunta do FAQ', example: 'Como faço para agendar um serviço?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: 'A resposta para a pergunta do FAQ', example: 'Você pode agendar um serviço diretamente pelo aplicativo, selecionando o tipo de serviço e o provedor.' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ description: 'Categoria do FAQ (ex: Geral, Pagamentos, Serviços)', example: 'Geral' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Ordem de exibição do FAQ', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}