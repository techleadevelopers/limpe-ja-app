// backend-cleaning/src/bookings/dto/create-booking.dto.ts
// backend-cleaning/src/bookings/dto/create-booking.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
  Matches,
  ValidateNested,
  IsInt,
  IsDefined,
  IsArray,
  IsIn,
} from 'class-validator'; // <-- Adicione IsDefined aqui!
import { Type } from 'class-transformer';
import { CreateAddressDto } from '../../common/dto/create-address.dto';
import { MIN_HOURLY_MINUTES } from '../../common/constants/pricing';
import {
  InsurancePlanId,
  INSURANCE_PLAN_IDS,
} from '../../insurance/insurance.constants';

class BookingAddonDto {
  @ApiProperty({
    description: 'ID do adicional',
    example: 'addon-cleaning',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: 'Quantidade do adicional',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID do provedor para quem o agendamento está sendo feito',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({
    description: 'ID do serviço específico oferecido pelo provedor',
    example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
  })
  @IsUUID()
  @IsNotEmpty()
  providerServiceId: string;

  @ApiProperty({
    description:
      'Data agendada para o serviço (formato ISO 8601, ex: 2025-06-15)',
    example: '2025-06-15',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiProperty({
    description: 'Horário agendado para o serviço (formato HH:mm)',
    example: '10:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'scheduledTime deve estar no formato HH:mm',
  })
  scheduledTime: string;

  @ApiProperty({ description: 'Preço total do agendamento', example: 150.0 })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiPropertyOptional({
    description: 'Observações adicionais para o agendamento',
    example: 'Focar na limpeza da cozinha.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Endereço onde o serviço será realizado' })
  @IsDefined({ message: 'O endereço é obrigatório.' }) // Adicione esta linha
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @ApiPropertyOptional({
    description: 'Duração solicitada em minutos (se o serviço for HOURLY)',
    example: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_HOURLY_MINUTES)
  requestedDurationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Metragem quadrada solicitada (se o serviço for BY_SIZE)',
    example: 80.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requestedSquareMeters?: number;

  @ApiPropertyOptional({
    description: 'Número de cômodos solicitados (se o serviço for BY_SIZE)',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  requestedRoomCount?: number;

  // PROPRIEDADE ADICIONADA PARA RESOLVER OS ERROS DO 'couponCode'
  @ApiPropertyOptional({
    description: 'Código do cupom de desconto, se aplicável',
    example: 'DESCONTO10',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Assinatura associada ao agendamento, quando aplicável',
    example: 'subscription-id',
  })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({
    description: 'Adicionais selecionados para o agendamento',
    type: [BookingAddonDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingAddonDto)
  addons?: BookingAddonDto[];

  @ApiPropertyOptional({
    description: 'Plano de seguro selecionado para o agendamento',
    enum: INSURANCE_PLAN_IDS,
  })
  @IsOptional()
  @IsIn(INSURANCE_PLAN_IDS)
  insurancePlanId?: InsurancePlanId;

  @ApiPropertyOptional({
    description: 'Quote ID retornado por /bookings/quote',
    example: 'quote-123',
  })
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiPropertyOptional({
    description: 'Hash determinístico da cotação utilizada',
    example: 'fc5e038d2f14b01b...',
  })
  @IsOptional()
  @IsString()
  quoteHash?: string;
}
