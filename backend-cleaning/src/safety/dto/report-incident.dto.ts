// backend-cleaning/src/safety/dto/report-incident.dto.ts
import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsUrl,
} from 'class-validator';
import { IncidentType } from '../entities/incident.entity'; // Assuming entity defines enum

export class ReportIncidentDto {
  @IsEnum(IncidentType)
  type: IncidentType;

  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true }) // CORREÇÃO: Uso correto do @IsUUID com { each: true }
  involvedUsers?: string[]; // Array of user IDs (client/provider)

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true }) // Assuming attachments are URLs after upload
  attachments?: string[];
}
