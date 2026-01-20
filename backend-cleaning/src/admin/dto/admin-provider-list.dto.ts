import { ApiProperty } from '@nestjs/swagger';
import { ProviderViewDto } from '../../providers/dto/provider-view.dto';

export class AdminProviderListDto {
  @ApiProperty({
    type: () => [ProviderViewDto],
    description: 'Lista paginada de provedores formatada para o painel administrativo.',
  })
  items: ProviderViewDto[];

  @ApiProperty({
    description: 'Quantidade total de provedores encontrados (sem paginar).',
  })
  totalCount: number;

  @ApiProperty({
    description: 'PÁgina atual (1-indexada).',
  })
  page: number;

  @ApiProperty({
    description: 'Limite de itens por página utilizado nesta resposta.',
  })
  limit: number;

  constructor(items: ProviderViewDto[], totalCount: number, page: number, limit: number) {
    this.items = items;
    this.totalCount = totalCount;
    this.page = page;
    this.limit = limit;
  }
}
