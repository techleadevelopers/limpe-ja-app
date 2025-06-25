// src/reviews/dto/review.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

// DTO para o cliente que fez a avaliação (se você quiser incluir os dados dele)
class ClientReviewerDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional() // Mark as optional if avatarUrl is not always present
  @IsString()
  @IsOptional()
  avatarUrl?: string; // Client's avatar URL
}

export class ReviewDto {
  @ApiProperty({ description: 'ID da avaliação.' })
  @IsString()
  id: string; // Assuming ID is a string (UUID)

  @ApiProperty({ description: 'ID do agendamento ao qual a avaliação se refere.' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'ID do cliente que fez a avaliação.' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'ID do provedor avaliado.' })
  @IsString()
  providerId: string;

  @ApiProperty({ description: 'Pontuação da avaliação (1-5).' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário da avaliação.', required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ description: 'Data de criação da avaliação.' })
  createdAt: Date; // Assuming this is a Date object from Prisma

  @ApiProperty({ description: 'Data de atualização da avaliação.' })
  updatedAt: Date; // Assuming this is a Date object from Prisma

  @ApiProperty({ type: ClientReviewerDto, description: 'Detalhes do cliente que fez a avaliação.' })
  client: ClientReviewerDto; // Include client details for display (e.g., from Prisma's `include`)
}