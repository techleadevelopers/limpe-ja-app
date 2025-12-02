import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsNumber,
  IsArray,
  IsOptional,
} from 'class-validator';
import { BookingEntity } from '../../bookings/entities/booking.entity'; // Assumindo que você terá esta entidade
import { ReviewEntity } from '../../reviews/entities/review.entity'; // Assumindo que você terá esta entidade

// Exemplo de DTO para um item de serviço popular (ajuste conforme a necessidade)
class PopularServiceDto {
  @ApiProperty({ description: 'Nome do serviço', example: 'Limpeza Padrão' })
  name: string;
  @ApiProperty({
    description: 'Número de vezes que foi agendado',
    example: 150,
  })
  bookingsCount: number;
}

export class ClientDashboardDto {
  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'Maria da Silva',
  })
  fullName: string;

  @ApiProperty({ description: 'Número de agendamentos pendentes', example: 2 })
  pendingBookingsCount: number;

  @ApiProperty({
    description: 'Número de agendamentos concluídos',
    example: 10,
  })
  completedBookingsCount: number;

  @ApiPropertyOptional({
    description: 'Próximo agendamento (opcional)',
    type: () => BookingEntity,
  })
  nextBooking?: BookingEntity;

  @ApiPropertyOptional({
    description: 'Lista de agendamentos recentes',
    type: () => [BookingEntity],
  })
  recentBookings?: BookingEntity[];

  @ApiPropertyOptional({
    description: 'Lista de serviços populares',
    type: () => [PopularServiceDto],
  })
  popularServices?: PopularServiceDto[];

  @ApiPropertyOptional({
    description: 'Avaliações pendentes para o cliente',
    type: () => [ReviewEntity],
  })
  pendingReviews?: ReviewEntity[];

  // Adicione outras propriedades relevantes para o dashboard do cliente
}
