import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '@prisma/client'; // Importa o enum do Prisma

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    description: 'Novo status do agendamento',
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;
}