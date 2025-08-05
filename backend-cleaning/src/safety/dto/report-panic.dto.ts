// backend-cleaning/src/safety/dto/report-panic.dto.ts
import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { PanicType } from '../entities/panic-alert.entity'; // Assuming entity defines enum

export class ReportPanicDto {
  @IsEnum(PanicType)
  type: PanicType;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  message?: string;
}