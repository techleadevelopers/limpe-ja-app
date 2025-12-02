// src/faqs/entities/faq-item.entity.ts
import { FAQItem } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FaqItemEntity implements FAQItem {
  @ApiProperty({ description: 'ID único do item de FAQ' })
  id: string;

  @ApiProperty({ description: 'A pergunta do FAQ' })
  question: string;

  @ApiProperty({ description: 'A resposta para a pergunta do FAQ' })
  answer: string;

  @ApiPropertyOptional({ description: 'Categoria do FAQ' })
  category: string | null;

  @ApiProperty({ description: 'Ordem de exibição do FAQ' })
  order: number;

  @ApiProperty({ description: 'Data de criação do item de FAQ' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do item de FAQ' })
  updatedAt: Date;

  constructor(partial: Partial<FaqItemEntity>) {
    Object.assign(this, partial);
  }
}
