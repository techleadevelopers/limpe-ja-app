// backend-cleaning/src/bookings/dto/create-booking.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsOptional, IsUUID, Matches, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto } from '../../common/dto/create-address.dto'; // Importe CreateAddressDto

export class CreateBookingDto {
  @ApiProperty({ description: 'ID do provedor para quem o agendamento está sendo feito', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({ description: 'ID do serviço específico oferecido pelo provedor', example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210' })
  @IsUUID()
  @IsNotEmpty()
  providerServiceId: string;

  @ApiProperty({ description: 'Data agendada para o serviço (formato ISO 8601, ex: 2025-06-15)', example: '2025-06-15' })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiProperty({ description: 'Horário agendado para o serviço (formato HH:mm)', example: '10:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'scheduledTime deve estar no formato HH:mm' })
  scheduledTime: string;

  @ApiProperty({ description: 'Preço total do agendamento', example: 150.00 })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Observações adicionais para o agendamento', example: 'Focar na limpeza da cozinha.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Endereço onde o serviço será realizado' })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @ApiPropertyOptional({ description: 'Duração solicitada em minutos (se o serviço for HOURLY)', example: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  requestedDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Metragem quadrada solicitada (se o serviço for BY_SIZE)', example: 80.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requestedSquareMeters?: number;

  @ApiPropertyOptional({ description: 'Número de cômodos solicitados (se o serviço for BY_SIZE)', example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  requestedRoomCount?: number;

  // PROPRIEDADE ADICIONADA PARA RESOLVER OS ERROS DO 'couponCode'
  @ApiPropertyOptional({ description: 'Código do cupom de desconto, se aplicável', example: 'DESCONTO10' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}