// backend-cleaning/src/guarantee/dto/update-claim.dto.ts
import { IsEnum, IsOptional, IsString, IsNumber, Min, IsPositive } from 'class-validator';
import { ClaimStatus } from '../entities/guarantee-claim.entity'; // Assuming entity defines enum

export class UpdateClaimDto {
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  resolvedValue?: number;
}