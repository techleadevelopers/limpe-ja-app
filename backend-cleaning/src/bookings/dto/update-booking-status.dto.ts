// src/bookings/dto/update-booking-status.dto.ts
import { IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client'; // Importar BookingStatus do Prisma

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus) // O status deve ser do tipo BookingStatus
  status: BookingStatus;
}