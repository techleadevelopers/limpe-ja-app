// src/metrics/metrics.controller.ts

import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assumindo que você tem este guard
import { MetricsService } from './metrics.service';
import { CustomerMetricsQueryDto } from './dto/customer-metrics.query.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('me/summary')
  @ApiOperation({
    summary: 'Obtém um resumo das métricas do cliente autenticado',
  })
  async getCustomerSummaryMetrics(
    @Request() req,
    @Query() query: CustomerMetricsQueryDto,
  ) {
    const userId = req.user.id; // Assumindo que o ID do usuário está no token JWT
    return this.metricsService.getCustomerSummary(userId, query);
  }

  @Get('me/timeseries')
  @ApiOperation({
    summary: 'Obtém métricas do cliente autenticado em série temporal',
  })
  async getCustomerTimeseriesMetrics(
    @Request() req,
    @Query() query: CustomerMetricsQueryDto,
  ) {
    const userId = req.user.id;
    return this.metricsService.getCustomerTimeseries(userId, query);
  }

  @Get('me/funnel')
  @ApiOperation({
    summary: 'Obtém dados do funil de conversão do cliente autenticado',
  })
  async getCustomerFunnelMetrics(@Request() req) {
    const userId = req.user.id;
    return this.metricsService.getCustomerFunnel(userId);
  }
}
