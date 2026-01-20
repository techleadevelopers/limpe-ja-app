import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const ALLOWED_PERCENT_VALUES = [5, 10, 15, 20];

export class UpdateProviderPromotionDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(ALLOWED_PERCENT_VALUES, {
    message: `percentOff deve ser um dos valores: ${ALLOWED_PERCENT_VALUES.join(', ')}`,
  })
  percentOff?: number;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
