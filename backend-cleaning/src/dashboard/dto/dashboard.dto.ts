import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingEntity } from '../../bookings/entities/booking.entity'; // Importe BookingEntity
import { ReviewDto } from '../../reviews/dto/review.dto'; // Importe o ReviewDto que você irá criar/ajustar

export class DashboardDto {
  @ApiProperty({ description: 'Nome completo do provedor', example: 'Maria da Silva' })
  fullName: string;

  @ApiPropertyOptional({ type: () => [BookingEntity], description: 'Agendamentos próximos' })
  upcomingBookings?: BookingEntity[]; // Use BookingEntity aqui

  @ApiProperty({ description: 'Total de ganhos', example: 1000 })
  totalEarnings: number;

  @ApiProperty({ description: 'Saques pendentes', example: 200 })
  pendingWithdrawals: number;

  @ApiPropertyOptional({ type: () => [ReviewDto], description: 'Lista das avaliações mais recentes do provedor.' })
  reviews?: ReviewDto[]; // Adicione esta propriedade para as avaliações
}