import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  @Post('events')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Recebe eventos de analytics (no-op em dev)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Evento recebido.' })
  // Mantém assinatura simples; não armazena nada por padrão
  async receiveEvent(@Body() _body: any): Promise<void> {
    return; // no-op
  }
}

