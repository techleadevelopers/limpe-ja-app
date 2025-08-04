// backend-cleaning/src/referrals/dto/create-referral.dto.ts
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReferralDto {
  @ApiProperty({
    description: 'O ID do usuário que está sendo indicado.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  referredUserId: string;

  @ApiProperty({
    description: 'O ID do usuário que fez a indicação.',
    example: 'f0e9d8c7-b6a5-4321-0987-fedcba987654',
  })
  @IsUUID()
  @IsNotEmpty()
  referrerUserId: string;

  @ApiProperty({
    description: 'Código de indicação utilizado (opcional).',
    example: 'LIMPEJA123',
    required: false,
  })
  @IsOptional()
  @IsString()
  referralCode?: string;
}