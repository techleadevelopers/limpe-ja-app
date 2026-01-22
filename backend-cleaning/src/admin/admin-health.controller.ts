import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AdminHealthSnapshot,
  AdminObservabilityService,
} from './admin-observability.service';

@ApiTags('admin/health')
@Controller('admin/health')
export class AdminHealthController {
  constructor(
    private readonly observabilityService: AdminObservabilityService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Retorna o estado de saúde do backend administrativo' })
  @ApiResponse({
    status: 200,
    description: 'Indica que o serviço administrativo está operacional.',
  })
  async getHealth(
    @Query('routeKey') routeKey?: string,
  ): Promise<AdminHealthSnapshot> {
    return this.observabilityService.getSnapshot(routeKey);
  }
}
