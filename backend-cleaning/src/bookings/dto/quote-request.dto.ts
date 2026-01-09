import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  Matches,
  IsOptional,
  IsInt,
  Min,
  IsNumber,
  ValidateNested,
  IsString,
  IsArray,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InsurancePlanId,
  INSURANCE_PLAN_IDS,
} from '../../insurance/insurance.constants';

class BookingQuoteAddonDto {
  @ApiProperty({ description: 'ID do item adicional', example: 'addon-cleaning' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ description: 'Quantidade do adicional', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

class BookingQuoteAddressDto {
  @ApiProperty({ description: 'Latitude do endereço', example: -23.55052 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude do endereço', example: -46.633308 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'Cidade do endereço', example: 'São Paulo' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Estado do endereço (UF)', example: 'SP' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ description: 'CEP', example: '01001000' })
  @IsOptional()
  @IsString()
  cep?: string;
}

export class BookingQuoteRequestDto {
  @ApiProperty({
    description: 'ID do provedor que será cotado',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  providerId: string;

  @ApiPropertyOptional({
    description: 'ID do serviço (podendo ser usado quando providerServiceId estiver ausente)',
    example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({
    description: 'ID da oferta do provedor que será cotada',
    example: 'gatewa1-service345',
  })
  @IsUUID()
  providerServiceId: string;

  @ApiProperty({
    description: 'Data agendada (formato ISO 8601, ex: 2025-06-15)',
    example: '2025-06-15',
  })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({
    description: 'Hora agendada (HH:mm)',
    example: '10:00',
  })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  scheduledTime: string;

  @ApiPropertyOptional({
    description: 'Duração solicitada em minutos (para serviços HOURLY)',
    example: 180,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Código de cupom', example: 'LIMPEJA10' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'ID da assinatura vinculada',
    example: 'subscription-123',
  })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({
    description: 'Adicionais selecionados',
    type: [BookingQuoteAddonDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingQuoteAddonDto)
  addons?: BookingQuoteAddonDto[];

  @ApiPropertyOptional({
    description: 'Plano de seguro desejado para incluir na cotação',
    example: 'ESSENCIAL',
    enum: INSURANCE_PLAN_IDS,
  })
  @IsOptional()
  @IsIn(INSURANCE_PLAN_IDS)
  insurancePlanId?: InsurancePlanId | null;

  @ApiProperty({
    description: 'Endereço do atendimento (precisa de latitude/longitude)',
    type: BookingQuoteAddressDto,
  })
  @ValidateNested()
  @Type(() => BookingQuoteAddressDto)
  address: BookingQuoteAddressDto;
}
