import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingViewDto } from '../../bookings/dto/booking-view.dto'; // Importe BookingViewDto
import { ReviewDto } from '../../reviews/dto/review.dto'; // Importe o ReviewDto que você irá criar/ajustar

export class DashboardDto {
  @ApiProperty({
    description: 'Nome completo do provedor',
    example: 'Maria da Silva',
  })
  fullName: string;

  @ApiPropertyOptional({
    type: () => [BookingViewDto],
    description: 'Agendamentos próximos',
  })
  upcomingBookings?: BookingViewDto[];

  @ApiProperty({ description: 'Total de ganhos', example: 1000 })
  totalEarnings: number;

  @ApiProperty({ description: 'Saques pendentes', example: 200 })
  pendingWithdrawals: number;

  @ApiPropertyOptional({
    type: () => [ReviewDto],
    description: 'Lista das avaliações mais recentes do provedor.',
  })
  reviews?: ReviewDto[]; // Adicione esta propriedade para as avaliações

  @ApiProperty({
    description: 'Número de avaliações 5 estrelas recebidas',
    example: 42,
  })
  fiveStarReviewCount: number;

  @ApiProperty({
    description: 'Número de agendamentos concluídos no mês atual',
    example: 15,
  })
  monthlyBookingsCount: number;
}
