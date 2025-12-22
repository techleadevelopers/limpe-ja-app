// src/missions/missions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MissionsService } from './missions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ClaimMissionDto } from './dto/claim-mission.dto';
import { Request } from 'express';
import { MissionViewDto } from './dto/mission-view.dto';

@ApiTags('missions')
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Permitir que provedores também vejam suas missões
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista suas missões e progresso' })
  async myMissions(@Req() req: Request): Promise<MissionViewDto[]> {
    const userId = req.user['userId'];
    return this.missionsService.getMyMissions(
      userId,
      req.user['role'] as UserRole,
    ); // Passar o role
  }

  @Post('claim')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Permitir que provedores também resgatem missões
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resgata a recompensa de uma missão COMPLETED' })
  async claim(@Req() req: Request, @Body() dto: ClaimMissionDto) {
    const userId = req.user['userId'];
    const result = await this.missionsService.claimMission(
      userId,
      dto.missionId,
    );
    if (!result) {
      throw new BadRequestException('Missão não está disponível para resgate.');
    }
    return result; // { mission, reward: { type: 'COUPON'|'POINTS', ... } }
  }
}
