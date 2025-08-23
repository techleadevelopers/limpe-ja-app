// src/missions/dto/claim-mission.dto.ts
import { IsUUID } from 'class-validator';

export class ClaimMissionDto {
  @IsUUID()
  missionId!: string;
}
