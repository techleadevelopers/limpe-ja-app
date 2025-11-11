import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsString, IsNotEmpty, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TimeRangeDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @IsNotEmpty()
  end: string;
}

export class BulkDateRangesDto {
  @ApiProperty({ example: '2025-11-10', description: 'Data (UTC) no formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date: string;

  @ApiProperty({ type: [TimeRangeDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  ranges: TimeRangeDto[];
}

export class BulkAvailabilityDto {
  @ApiProperty({ type: [BulkDateRangesDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkDateRangesDto)
  dates: BulkDateRangesDto[];
}

