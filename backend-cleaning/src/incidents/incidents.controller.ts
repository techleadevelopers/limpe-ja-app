import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { IncidentsService } from './incidents.service';
import { CreateIncidentClaimDto } from './dto/create-incident.dto';
import { Request as ExpressRequest } from 'express';

type RequestWithUser = ExpressRequest & {
  user?: {
    id?: string;
    role?: UserRole;
  };
};

@ApiBearerAuth()
@ApiTags('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  @ApiOperation({ summary: 'Abre um sinistro de seguro para um agendamento concluído.' })
  async createClaim(
    @Body() payload: CreateIncidentClaimDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.incidentsService.createClaim(userId, payload);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Recupera o sinistro solicitado (seguro).' })
  async getClaim(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    const userRole = req.user?.role ?? UserRole.CLIENT;
    return this.incidentsService.getClaim(id, userId, userRole);
  }
}
