// backend-cleaning/src/bookings/dto/create-booking.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsOptional, IsUUID, Matches, ValidateNested } from 'class-validator'; // ADICIONE ValidateNested
import { Type } from 'class-transformer'; // ADICIONE Type
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

  // ESTA PROPRIEDADE É CRUCIAL E DEVE SER ADICIONADA:
  @ApiProperty({ description: 'Endereço onde o serviço será realizado' })
  @ValidateNested() // Valida o objeto aninhado
  @Type(() => CreateAddressDto) // Ajuda o class-transformer a instanciar o objeto correto
  address: CreateAddressDto;
}