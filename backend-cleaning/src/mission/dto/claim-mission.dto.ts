import { IsNotEmpty, IsUUID } from 'class-validator';

export class ClaimMissionDto {
  @IsUUID()
  @IsNotEmpty()
  missionId!: string;
}
