import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AnalyticsEventDto } from './dto/analytics-event.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  @Post('events')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Recebe eventos de analytics (no-op em dev)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Evento recebido.',
  })
  async receiveEvent(@Body() _body: AnalyticsEventDto): Promise<void> {
    return; // no-op
  }
}
