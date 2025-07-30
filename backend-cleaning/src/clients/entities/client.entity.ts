// src/clients/entities/client.entity.ts
import { Client as PrismaClient, User, Address, Booking, Review } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity'; // Caminho para UserEntity
import { AddressEntity } from '../../common/entities/address.entity'; // Caminho para AddressEntity

export class ClientEntity implements PrismaClient {
  @ApiProperty({ description: 'ID único do cliente', example: 'uuid-do-cliente' })
  id: string;

  @ApiProperty({ description: 'ID do usuário associado', example: 'uuid-do-usuario' })
  userId: string;

  @ApiProperty({ description: 'Nome completo do cliente', example: 'Maria da Silva' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Número de telefone do cliente', example: '11987654321' })
  phone: string | null;

  // Propriedade CPF adicionada para alinhar com o schema.prisma
  @ApiPropertyOptional({ description: 'CPF do cliente', example: '123.456.789-00' })
  cpf: string | null; // Adicionado, pode ser null se for opcional no DB

  // Propriedades createdAt e updatedAt conforme o schema.prisma
  @ApiProperty({ description: 'Data de criação do cliente', example: '2023-01-01T10:00:00.000Z' })
  createdAt: Date; 

  @ApiProperty({ description: 'Data da última atualização do cliente', example: '2023-01-01T10:00:00.000Z' })
  updatedAt: Date; 

  // NOVO: completedBookingsCount para programa de fidelidade
  @ApiProperty({ description: 'Contagem de agendamentos concluídos pelo cliente', example: 10 })
  completedBookingsCount: number;

  // Relações
  // Usamos `type: () => UserEntity` para referenciar a classe da entidade User para o Swagger
  @ApiProperty({ type: () => UserEntity, description: 'Dados do usuário associado ao cliente' })
  user?: User; // O tipo do Prisma ainda é válido para a implementação interna

  // Usamos `type: () => AddressEntity` para referenciar a classe da entidade Address para o Swagger
  @ApiPropertyOptional({ type: () => AddressEntity, description: 'Endereço do cliente' })
  address?: Address | null; // O tipo do Prisma ainda é válido para a implementação interna

  // As relações `bookings` e `reviewsMade` são coleções e geralmente não são incluídas
  // diretamente na entidade para evitar payloads grandes e dependências circulares em DTOs de retorno.
  // Elas são incluídas aqui para implementar a interface PrismaClient.
  bookings: Booking[];
  reviewsMade: Review[];

  constructor(partial: Partial<ClientEntity>) {
    Object.assign(this, partial);
  }
}