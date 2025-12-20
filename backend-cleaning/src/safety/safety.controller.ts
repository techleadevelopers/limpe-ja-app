// backend-cleaning/src/safety/safety.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { SafetyService } from './safety.service';
import { ReportPanicDto } from './dto/report-panic.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming JWT guard
import { RolesGuard } from '../auth/guards/roles.guard'; // Assuming Roles guard
import { Roles } from '../auth/decorators/roles.decorator'; // Assuming Roles decorator
import { UserRole } from '@prisma/client'; // Assuming Prisma enum for roles
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger'; // Importações adicionadas para Swagger
import { Request as ExpressRequest } from 'express';

type RequestWithUser = ExpressRequest & {
  user?: {
    id?: string;
    role?: UserRole;
  };
};

@ApiBearerAuth() // Adiciona o cabeçalho de autenticação Bearer para Swagger
@ApiTags('safety') // Agrupa endpoints sob a tag 'safety' no Swagger
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('panic')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Both clients and providers can report panic
  @ApiOperation({ summary: 'Reporta um incidente de pânico' }) // Descrição para Swagger
  @ApiResponse({
    status: 201,
    description: 'Incidente de pânico reportado com sucesso.',
  })
  async reportPanic(
    @Body() reportPanicDto: ReportPanicDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new NotFoundException('Dados de usuário ausentes na requisição.');
    }
    return this.safetyService.reportPanic(userId, reportPanicDto);
  }

  @Post('incident')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Both clients and providers can report incidents
  @ApiOperation({ summary: 'Reporta um incidente de segurança' }) // Descrição para Swagger
  @ApiResponse({
    status: 201,
    description: 'Incidente de segurança reportado com sucesso.',
  })
  async reportIncident(
    @Body() reportIncidentDto: ReportIncidentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new NotFoundException('Dados de usuário ausentes na requisição.');
    }
    return this.safetyService.reportIncident(userId, reportIncidentDto);
  }

  @Get('me/incidents')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Users can list their own incidents
  @ApiOperation({
    summary: 'Lista os incidentes de segurança reportados pelo usuário logado',
  }) // Descrição para Swagger
  @ApiResponse({
    status: 200,
    description: 'Lista de incidentes do usuário retornada com sucesso.',
  })
  async getIncidentsForUser(@Req() req: RequestWithUser) {
    const userId = req.user?.id;
    if (!userId) {
      throw new NotFoundException('Dados de usuário ausentes na requisição.');
    }
    return this.safetyService.getIncidentsForUser(userId);
  }

  // NOVO ENDPOINT: Para administradores listarem todos os incidentes
  @Get('incidents') // Caminho específico para listar todos os incidentes
  @Roles(UserRole.ADMIN) // Apenas administradores podem acessar
  @ApiOperation({
    summary:
      'Lista todos os incidentes de segurança (apenas para administradores)',
  }) // Descrição para Swagger
  @ApiResponse({
    status: 200,
    description: 'Lista de todos os incidentes retornada com sucesso.',
  })
  async getAllIncidents() {
    return this.safetyService.listAllIncidents(); // Você precisará implementar este método no SafetyService
  }

  @Patch('incident/:id/status')
  @Roles(UserRole.ADMIN) // Only admins can update incident status
  @ApiOperation({
    summary:
      'Atualiza o status de um incidente de segurança (apenas para administradores)',
  }) // Descrição para Swagger
  @ApiResponse({
    status: 200,
    description: 'Status do incidente atualizado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Incidente não encontrado.' })
  async updateIncidentStatus(
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new NotFoundException('Dados de usuário ausentes na requisição.');
    }
    return this.safetyService.updateIncidentStatus(
      id,
      updateIncidentDto,
      userId,
    );
  }

  // NOVO: Listar alertas de pânico (admin)
  @Get('panic-alerts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lista todos os alertas de pânico (apenas administradores)',
  })
  @ApiResponse({ status: 200, description: 'Lista de alertas de pânico.' })
  async listPanicAlerts(@Req() req: RequestWithUser) {
    const rawStatus = req.query?.status;
    const status = typeof rawStatus === 'string' ? rawStatus : undefined;
    return this.safetyService.listPanicAlerts(status);
  }

  // NOVO: Atualizar status de alerta de pânico (admin)
  @Patch('panic-alerts/:id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Atualiza o status de um alerta de pânico (apenas administradores)',
  })
  @ApiResponse({ status: 200, description: 'Status do alerta atualizado.' })
  async updatePanicStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.safetyService.updatePanicAlertStatus(id, body?.status);
  }
}
