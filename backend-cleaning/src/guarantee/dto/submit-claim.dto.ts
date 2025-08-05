// backend-cleaning/src/guarantee/dto/submit-claim.dto.ts
import { IsString, IsUUID, IsOptional, IsArray, IsUrl, IsNumber, IsPositive, Min } from 'class-validator';

export class SubmitClaimDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true }) // Assuming attachments are URLs after upload
  attachments?: string[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  estimatedValue?: number;
}