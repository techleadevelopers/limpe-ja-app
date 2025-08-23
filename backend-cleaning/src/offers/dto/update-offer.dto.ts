// src/offers/dto/update-offer.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateOfferDto } from './create-offer.dto';

export class UpdateOfferDto extends PartialType(CreateOfferDto) {}