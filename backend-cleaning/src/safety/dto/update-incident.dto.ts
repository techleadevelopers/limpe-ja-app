// backend-cleaning/src/safety/dto/update-incident.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IncidentStatus } from '../entities/incident.entity';

export class UpdateIncidentDto {
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsString()
  resolution?: string; // Admin's notes on resolution
}
