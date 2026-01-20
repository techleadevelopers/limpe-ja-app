import {
  Controller,
  Post,
  Get,
  Req,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ComplianceService } from './compliance.service';
import { RecordConsentDto } from './dto/record-consent.dto';
import { DataSubjectRequestDto } from './dto/data-subject-request.dto';

type AuthenticatedRequest = Request & { user?: { id?: string } };

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compliance')
export class ComplianceController {
  private readonly logger = new Logger(ComplianceController.name);

  constructor(private readonly complianceService: ComplianceService) {}

  @Post('consents')
  @ApiOperation({ summary: 'Registrar um consentimento do usuário' })
  @ApiResponse({ status: 201, description: 'Consentimento registrado.' })
  async recordConsent(
    @Req() req: AuthenticatedRequest,
    @Body() body: RecordConsentDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    this.logger.log(
      `[ComplianceController] recordConsent ${userId} ${body.consentType} ${body.version}`,
    );
    await this.complianceService.recordConsent(
      userId,
      body.consentType,
      body.version,
      {
        source: 'api',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        acceptedAt: body.acceptedAt ? new Date(body.acceptedAt) : undefined,
      },
    );
    return { success: true };
  }

  @Get('consents/me')
  @ApiOperation({ summary: 'Listar consentimentos do usuário logado' })
  @ApiResponse({ status: 200, description: 'Lista de consentimentos.' })
  async listConsents(@Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('Usuário não autenticado');
    }
    return this.complianceService.listUserConsents(req.user.id);
  }

  @Post('dsar')
  @ApiOperation({ summary: 'Solicitar acesso aos dados (DSAR)' })
  async requestAccess(
    @Req() req: AuthenticatedRequest,
    @Body() body: DataSubjectRequestDto,
  ) {
    if (!req.user?.id) {
      throw new Error('Usuário não autenticado');
    }
    this.logger.log(
      `[ComplianceController] DSAR requested for user=${req.user.id} reason=${body.reason}`,
    );
    return this.complianceService.processDataSubjectAccessRequest(req.user.id);
  }

  @Post('erasure')
  @ApiOperation({ summary: 'Solicitar exclusão/anonimização dos dados' })
  async requestErasure(
    @Req() req: AuthenticatedRequest,
    @Body() body: DataSubjectRequestDto,
  ) {
    if (!req.user?.id) {
      throw new Error('Usuário não autenticado');
    }
    this.logger.log(
      `[ComplianceController] Erasure requested for user=${req.user.id} reason=${body.reason}`,
    );
    return this.complianceService.processErasureRequest(req.user.id);
  }
}
