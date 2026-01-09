// src/reviews/entities/review.entity.ts
import { Review as PrismaReview } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Importe as entidades/DTOs dos módulos correspondentes
// Assumindo que você tem essas entidades definidas
// ATENÇÃO: As entidades importadas aqui (BookingEntity, ClientEntity, ProviderEntity)
// DEVERIAM ser as que contêm APENAS os campos selecionados no Prisma Service,
// OU seus construtores devem ser capazes de aceitar objetos parciais.
// Para simplificar, vamos definir tipos mais específicos aqui para o que o Prisma REALMENTE retorna.

// Definindo tipos mais precisos para as relações, baseados nos 'select's do Prisma
type BookingRelationForReviewPayload = {
  scheduledDate: Date | string;
  scheduledTime: Date | string;
};

class BookingRelationForReview {
  @ApiProperty()
  scheduledDate: string;
  @ApiProperty()
  scheduledTime: string;
  // Se BookingEntity for mais complexo, você terá que ajustar o prisma.include ou este DTO

  constructor(data: BookingRelationForReviewPayload) {
    this.scheduledDate = BookingRelationForReview.normalizeDate(data.scheduledDate);
    this.scheduledTime = BookingRelationForReview.normalizeTime(data.scheduledTime);
  }

  private static normalizeDate(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      return value.includes('T') ? value.split('T')[0] : value;
    }
    return new Date(String(value)).toISOString().split('T')[0];
  }

  private static normalizeTime(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return value;
    }
    return new Date(String(value)).toISOString();
  }
}

class ClientRelationForReview {
  @ApiProperty()
  fullName: string;
  @ApiPropertyOptional()
  user?: {
    // Se o avatarUrl vem de 'user' dentro de 'client'
    avatarUrl?: string;
  };
}

class ProviderRelationForReview {
  @ApiProperty()
  fullName: string;
}

export class ReviewEntity implements PrismaReview {
  @ApiProperty({
    description: 'ID único da avaliação',
    example: 'uuid-da-avaliacao',
  })
  id: string;

  @ApiProperty({
    description: 'ID do agendamento avaliado',
    example: 'uuid-do-agendamento',
  })
  bookingId: string;

  @ApiProperty({
    description: 'ID do cliente que fez a avaliação',
    example: 'uuid-do-cliente',
  })
  clientId: string;

  @ApiProperty({
    description: 'ID do provedor avaliado',
    example: 'uuid-do-provedor',
  })
  providerId: string;

  @ApiProperty({ description: 'Pontuação da avaliação (1 a 5)', example: 5 })
  rating: number;

  @ApiPropertyOptional({
    description: 'Comentário da avaliação',
    example: 'Serviço excelente, muito profissional!',
  })
  comment: string | null;

  @ApiProperty({
    description: 'Data e hora da criação da avaliação',
    example: '2025-06-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data e hora da última atualização da avaliação',
    example: '2025-06-01T10:00:00.000Z',
  })
  updatedAt: Date; // <--- ADICIONADO AQUI!

  // Relações: Use o 'type' para referenciar a classe da entidade/DTO
  // ATENÇÃO: Os tipos aqui devem espelhar EXATAMENTE o que o Prisma retorna
  // com seus 'include's ou 'select's no ReviewsService.
  @ApiPropertyOptional({
    type: () => BookingRelationForReview,
    description: 'Dados parciais do agendamento associado',
  })
  booking?: BookingRelationForReview; // Use o tipo mais específico para o que é retornado do serviço

  @ApiPropertyOptional({
    type: () => ClientRelationForReview,
    description: 'Dados do cliente que avaliou (nome e avatar)',
  })
  client?: ClientRelationForReview; // Use o tipo mais específico para o que é retornado do serviço

  @ApiPropertyOptional({
    type: () => ProviderRelationForReview,
    description: 'Dados do provedor avaliado (nome)',
  })
  provider?: ProviderRelationForReview; // Use o tipo mais específico para o que é retornado do serviço

  // O construtor é o ponto chave para a compatibilidade de tipos.
  // Ele precisa aceitar um objeto que corresponda ao que o Prisma retorna.
  constructor(partial: Partial<ReviewEntity>) {
    Object.assign(this, partial);
    // Para garantir que `updatedAt` seja uma Date, se for uma string do BD por algum motivo
    if (typeof this.createdAt === 'string')
      this.createdAt = new Date(this.createdAt);
    if (typeof this.updatedAt === 'string')
      this.updatedAt = new Date(this.updatedAt);

    if (partial.booking) {
      this.booking = new BookingRelationForReview(
        partial.booking as BookingRelationForReviewPayload,
      );
    }
  }
}
