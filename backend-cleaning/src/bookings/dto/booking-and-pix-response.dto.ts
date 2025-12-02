// src/bookings/dto/booking-and-pix-response.dto.ts
import { BookingDetailsDto } from './booking-details.dto'; // Seu DTO existente
import { PixChargeResponseDto } from '../../payments/dto/create-pix-charge.dto'; // Seu DTO existente
import { ApiProperty } from '@nestjs/swagger';

export class BookingAndPixResponseDto {
  @ApiProperty({ description: 'Detalhes do agendamento criado' })
  booking: BookingDetailsDto;

  @ApiProperty({ description: 'Dados da cobrança PIX gerada' })
  pixCharge: PixChargeResponseDto;
}
