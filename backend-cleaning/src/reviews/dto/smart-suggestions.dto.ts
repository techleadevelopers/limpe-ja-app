
import { ApiProperty } from '@nestjs/swagger';

export class SmartSuggestionDto {
  @ApiProperty({ 
    description: 'Tipo da sugestão',
    enum: ['pricing', 'availability', 'service_improvement', 'marketing']
  })
  type: 'pricing' | 'availability' | 'service_improvement' | 'marketing';

  @ApiProperty({ description: 'Título da sugestão' })
  title: string;

  @ApiProperty({ description: 'Descrição detalhada da sugestão' })
  description: string;

  @ApiProperty({ 
    description: 'Impacto esperado',
    enum: ['high', 'medium', 'low']
  })
  impact: 'high' | 'medium' | 'low';

  @ApiProperty({ description: 'Se a sugestão é acionável' })
  actionable: boolean;

  @ApiProperty({ description: 'Dados adicionais da sugestão', required: false })
  data?: any;
}

export class DetailedRatingBreakdownDto {
  @ApiProperty({ description: 'Avaliação geral' })
  overall: number;

  @ApiProperty({ description: 'Avaliação de pontualidade' })
  punctuality: number;

  @ApiProperty({ description: 'Avaliação de qualidade' })
  quality: number;

  @ApiProperty({ description: 'Avaliação de comunicação' })
  communication: number;

  @ApiProperty({ description: 'Avaliação de custo-benefício' })
  value: number;

  @ApiProperty({ description: 'Total de avaliações' })
  totalReviews: number;

  @ApiProperty({ 
    description: 'Tendência recente',
    enum: ['improving', 'declining', 'stable']
  })
  recentTrend: 'improving' | 'declining' | 'stable';

  @ApiProperty({ description: 'Taxa de satisfação em porcentagem' })
  satisfactionRate: number;

  @ApiProperty({ description: 'Tempo médio de resposta em minutos' })
  responseTime: number;
}
