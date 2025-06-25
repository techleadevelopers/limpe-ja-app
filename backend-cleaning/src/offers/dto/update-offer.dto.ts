// src/offers/dto/update-offer.dto.ts
import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOfferDto } from './create-offer.dto';
import { IsString, IsOptional } from 'class-validator';

// PartialType torna todas as propriedades de CreateOfferDto opcionais
export class UpdateOfferDto extends PartialType(CreateOfferDto) {
  @ApiPropertyOptional({ description: 'ID da oferta a ser atualizada', example: 'uuid-da-oferta' })
  @IsOptional()
  @IsString()
  id?: string; // Embora o ID venha do @Param, é bom ter no DTO para consistência se necessário
}