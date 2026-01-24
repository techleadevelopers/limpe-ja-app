import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

const parseLimit = (value: unknown) => {
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (typeof value === 'number') {
    return value;
  }
  return undefined;
};

export class ListAuditActivitiesDto {
  @IsOptional()
  @Transform(({ value }) => parseLimit(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
