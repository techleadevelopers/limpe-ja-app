// src/reviews/entities/review.entity.ts
import { Review as PrismaReview, Booking, Client, Provider } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Importe as entidades/DTOs dos módulos correspondentes
// Assumindo que você tem essas entidades definidas
import { BookingEntity } from '../../bookings/entities/booking.entity'; // Ajuste o caminho conforme sua estrutura
import { ClientEntity } from '../../clients/entities/client.entity';   // Ajuste o caminho conforme sua estrutura
import { ProviderEntity } from '../../providers/entities/provider.entity'; // Ajuste o caminho conforme sua estrutura

export class ReviewEntity implements PrismaReview {
  @ApiProperty({ description: 'ID único da avaliação', example: 'uuid-da-avaliacao' })
  id: string;

  @ApiProperty({ description: 'ID do agendamento avaliado', example: 'uuid-do-agendamento' })
  bookingId: string;

  @ApiProperty({ description: 'ID do cliente que fez a avaliação', example: 'uuid-do-cliente' })
  clientId: string;

  @ApiProperty({ description: 'ID do provedor avaliado', example: 'uuid-do-provedor' })
  providerId: string;

  @ApiProperty({ description: 'Pontuação da avaliação (1 a 5)', example: 5 })
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário da avaliação', example: 'Serviço excelente, muito profissional!' })
  comment: string | null;

  @ApiProperty({ description: 'Data e hora da criação da avaliação', example: '2025-06-01T10:00:00.000Z' })
  createdAt: Date;

  // Relações: Use o 'type' para referenciar a classe da entidade/DTO
  @ApiProperty({ type: () => BookingEntity, description: 'Dados do agendamento associado' })
  booking?: Booking; // O tipo do Prisma ainda é válido para a implementação
  
  @ApiProperty({ type: () => ClientEntity, description: 'Dados do cliente que avaliou' })
  client?: Client; // O tipo do Prisma ainda é válido para a implementação
  
  @ApiProperty({ type: () => ProviderEntity, description: 'Dados do provedor avaliado' })
  provider?: Provider; // O tipo do Prisma ainda é válido para a implementação

  constructor(partial: Partial<ReviewEntity>) {
    Object.assign(this, partial);
  }
}