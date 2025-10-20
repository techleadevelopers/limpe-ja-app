// src/services/dto/create-service.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { PricingType } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  // Opcional: recomendação de modelo de cobrança (não vinculante)
  @IsOptional()
  @IsEnum(PricingType)
  defaultPricingType?: PricingType;
}

