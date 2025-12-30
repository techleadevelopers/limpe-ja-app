import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsUrl,
} from 'class-validator';

export class CreateIncidentClaimDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  description: string;

  @IsInt()
  @Min(0)
  amountCents: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  attachments?: string[];

  @IsOptional()
  @IsString()
  type?: string;
}
