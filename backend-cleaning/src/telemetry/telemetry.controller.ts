import { Controller, Logger, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TelemetryService } from './telemetry.service';

@ApiTags('admin/telemetry')
@Controller('admin/telemetry')
export class TelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('force-logout/:userId')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Forçar logout de um usuário identificado pela telemetria.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário marcado para logout forçado por tempo limitado.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  async forceLogout(
    @Param('userId') userId: string,
  ): Promise<{ message: string; userId: string }> {
    this.logger.warn(
      `[TelemetryController] forceLogout: usuário ${userId} marcado para logout forçado`,
    );
    await this.telemetryService.markForceLogout(userId);
    return {
      message:
        'Usuário marcado para logout forçado. A sessão será bloqueada nos próximos segundos.',
      userId,
    };
  }
}
