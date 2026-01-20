import {
  Client as PrismaClient,
  User,
  Address,
  Booking,
  Review,
  Subscription,
  GuaranteeClaim,
} from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity';
import { AddressEntity } from '../../common/entities/address.entity';

// Esta classe agora reflete o schema.prisma atualizado
export class ClientEntity implements PrismaClient {
  @ApiProperty({
    description: 'ID único do cliente',
    example: 'uuid-do-cliente',
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário associado',
    example: 'uuid-do-usuario',
  })
  userId: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'Maria da Silva',
  })
  fullName: string;

  @ApiPropertyOptional({
    description: 'Número de telefone do cliente',
    example: '11987654321',
  })
  phone: string | null;

  @ApiPropertyOptional({
    description: 'CPF do cliente',
    example: '123.456.789-00',
  })
  cpf: string | null;

  @ApiPropertyOptional({
    description: 'Data de nascimento do cliente',
    example: '1990-01-01T00:00:00.000Z',
  })
  dateOfBirth: Date | null; // Corrigido para ser opcional e aceitar 'Date | null'

  @ApiProperty({
    description: 'Data de criação do cliente',
    example: '2023-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do cliente',
    example: '2023-01-01T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Contagem de agendamentos concluídos pelo cliente',
    example: 10,
  })
  completedBookingsCount: number;

  @ApiProperty({
    description: 'Contagem de não comparecimentos do cliente',
    example: 0,
  })
  noShowCount: number;

  @ApiProperty({
    description: 'Contagem de cancelamentos do cliente',
    example: 0,
  })
  cancellationCount: number;

  @ApiPropertyOptional({
    description:
      'Timestamp até o qual o cliente está em cooldown de cancelamento',
    example: '2024-12-01T12:00:00.000Z',
  })
  cancellationCooldownUntil: Date | null;

  // Relações
  @ApiProperty({
    type: () => UserEntity,
    description: 'Dados do usuário associado ao cliente',
  })
  user?: User;

  @ApiPropertyOptional({
    type: () => AddressEntity,
    description: 'Endereço do cliente',
  })
  address?: Address | null;

  // As relações `bookings` e `reviewsMade` são coleções e geralmente não são incluídas
  // diretamente na entidade para evitar payloads grandes e dependências circulares em DTOs de retorno.
  // Elas são incluídas aqui para implementar a interface PrismaClient.
  bookings: Booking[];
  reviewsMade: Review[];

  // NOVO: Adicionando as relações dos novos módulos
  subscriptions: Subscription[];
  guaranteeClaims: GuaranteeClaim[];

  constructor(partial: Partial<ClientEntity>) {
    Object.assign(this, partial);
  }
}
