import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionProgressService } from './progress.service';
import { ClaimMissionDto } from './dto/claim-mission.dto';

@Controller('missions')
export class MissionsController {
  constructor(
    private readonly missionsService: MissionsService,
    private readonly missionProgressService: MissionProgressService,
  ) {}

  /**
   * Lista todas as missões disponíveis
   */
  @Get()
  async getAllMissions() {
    return this.missionsService.findAll();
  }

  /**
   * Busca detalhes de uma missão específica
   */
  @Get(':id')
  async getMission(@Param('id') id: string) {
    return this.missionsService.findById(id);
  }

  /**
   * Usuário "reivindica" uma missão
   */
  @Post('claim')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async claimMission(@Body() dto: ClaimMissionDto) {
    // Aqui você pode pegar o userId do request (JWT, sessão, etc.)
    const userId = 'mock-user-id'; // 👉 depois substitua por req.user.id ou equivalente
    return this.missionProgressService.claimMission(userId, dto.missionId);
  }
}
