import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LiveStatusService } from './live-status.service';
import type { LiveStatusPayload } from './live-status.service';

@ApiTags('live-status')
@Controller('live-status')
export class LiveStatusController {
  constructor(private readonly liveStatusService: LiveStatusService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Agrega provedores e bookings para o Live Tracking',
  })
  @ApiResponse({
    status: 200,
    description:
      'Payload unificado de provedores ativos e agendamentos confirmados/iniciados.',
  })
  async getLiveStatus(): Promise<LiveStatusPayload> {
    return this.liveStatusService.getLiveStatus();
  }
}
