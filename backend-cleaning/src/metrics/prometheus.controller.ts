import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { register } from 'prom-client';
import { MetricsServiceTokenGuard } from './guards/service-token.guard';

@Controller('metrics')
@UseGuards(MetricsServiceTokenGuard)
export class PrometheusController {
  @Get('prometheus')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
