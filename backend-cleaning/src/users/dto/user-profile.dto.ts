// src/users/dto/user-profile.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole, Prisma, Loyalty } from '@prisma/client'; // ADICIONADO: Loyalty
import { IsString, IsEnum, IsDate, ValidateNested, IsOptional, IsNumber, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
// Importe ClientDetailsDto se estiver em um arquivo separado, ou defina-o aqui
// import { ClientDetailsDto } from '../../clients/dto/client-details.dto';
import { ProviderDetailsDto } from '../../providers/dto/provider-details.dto';

// === IMPORTANDO OS TIPOS DE SERVIÇO DEFINITIVOS ===
// Importa o tipo mapeado para o frontend, que é o que ProviderDetailsDto espera
import { ProviderWithCalculatedRating } from '../../providers/providers.service';

// <<-- DEFINIÇÃO DE ClientWithIncludes -->>
// IDEALMENTE: Esta definição deveria ser movida para um arquivo em 'src/clients/' (ex: clients/clients.service.ts)
// e então importada aqui. Mantido aqui para compatibilidade com o código fornecido.
import { Address, Booking, Review } from '@prisma/client';

// CORREÇÃO: Removendo 'loyalty' de ClientWithIncludes, pois está na User
export type ClientWithIncludes = {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  cpf: string | null;
  dateOfBirth?: Date | null; // Adicionado do schema.prisma para precisão
  completedBookingsCount: number; // Adicionado do schema.prisma para precisão
  createdAt: Date;
  updatedAt: Date;
  user: User;
  address: Address | null;
  bookings: Booking[];
  reviewsMade: Review[];
  noShowCount: number; // Adicionado do schema.prisma para precisão
  cancellationCount: number; // Adicionado do schema.prisma para precisão
  // loyalty?: Loyalty | null; // <--- REMOVIDO: Relação com Loyalty (agora está diretamente no User)
  _count?: { bookings: number };
};

// =========================================================================
// CORREÇÃO: Usando os tipos de serviço já definidos
// =========================================================================

// CORREÇÃO: Atualizando ClientDetailsDto para incluir CPF (removendo loyaltyPoints)
// Assumindo que ClientDetailsDto está definido aqui ou em src/clients/dto/client-details.dto.ts
// Se estiver em um arquivo separado, certifique-se de que a definição lá seja a mesma.
export class ClientDetailsDto {
  @ApiProperty({ description: 'ID do cliente', example: 'uuid-do-cliente' })
  id: string;

  @ApiProperty({ description: 'ID do usuário associado', example: 'uuid-do-usuario' })
  userId: string;

  @ApiProperty({ description: 'Nome completo do cliente', example: 'Maria da Silva' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Número de telefone do cliente', example: '11987654321' })
  phone: string | null;

  @ApiPropertyOptional({ description: 'CPF do cliente', example: '123.456.789-00' })
  cpf: string | null;

  @ApiProperty({ description: 'Data de criação do cliente', example: '2023-01-01T10:00:00.000Z' })
  createdAt: Date; 

  @ApiProperty({ description: 'Data da última atualização do cliente', example: '2023-01-01T10:00:00.000Z' })
  updatedAt: Date; 

  // @ApiPropertyOptional({ description: 'Pontos de fidelidade do cliente', example: 100 })
  // @IsOptional()
  // @IsNumber()
  // loyaltyPoints?: number | null; // <--- REMOVIDO: Campo para pontos de fidelidade (agora no UserProfileDto)

  constructor(partial: Partial<ClientWithIncludes>) { // Alterado para Partial<ClientWithIncludes>
    Object.assign(this, partial);
    // this.loyaltyPoints = partial.loyalty?.currentPoints ?? null; // <--- REMOVIDO: Mapeamento dos pontos
  }
}


export class UserProfileDto {
  @ApiProperty({ description: 'ID único do usuário', example: 'uuid-do-usuario' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Endereço de e-mail do usuário', example: 'usuario@example.com' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: 'URL do avatar do usuário', example: 'http://example.com/user_avatar.jpg' })
  @IsOptional()
  @IsString() // Ou IsUrl se você validar o formato da URL
  avatarUrl?: string | null;

  @ApiProperty({ enum: UserRole, description: 'Papel do usuário na aplicação', example: UserRole.CLIENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'Data de criação do usuário', example: '2023-01-01T10:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do usuário', example: '2023-01-01T10:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Nome completo do usuário (do Client ou Provider associado)', example: 'João da Silva' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Telefone do usuário (do Client ou Provider associado)', example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: () => ClientDetailsDto, description: 'Detalhes do perfil do cliente' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientDetailsDto)
  clientDetails?: ClientDetailsDto;

  @ApiPropertyOptional({ type: () => ProviderDetailsDto, description: 'Detalhes do perfil do provedor' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderDetailsDto)
  providerDetails?: ProviderDetailsDto;

  @ApiPropertyOptional({ description: 'Pontos de fidelidade do usuário', example: 100 })
  @IsOptional()
  @IsNumber()
  loyaltyPoints?: number | null; // <--- ADICIONADO AQUI: Campo de pontos de fidelidade no UserProfileDto

  constructor(
    user: User & {
      avatarUrl?: string | null;
      client?: ClientWithIncludes;
      provider?: ProviderWithCalculatedRating;
      loyalty?: Loyalty | null; // <--- ADICIONADO AQUI: Para tipagem correta do objeto 'user' recebido
    }
  ) {
    this.id = user.id;
    this.email = user.email;
    this.avatarUrl = user.avatarUrl;
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;

    if (user.role === UserRole.CLIENT && user.client) {
      this.fullName = user.client.fullName;
      this.phone = user.client.phone;
      this.clientDetails = new ClientDetailsDto(user.client); // Passando user.client
    } else if (user.role === UserRole.PROVIDER && user.provider) {
      this.fullName = user.provider.fullName;
      this.phone = user.provider.phone;
      this.providerDetails = new ProviderDetailsDto(user.provider);
    }

    // Mapeamento dos pontos de fidelidade diretamente do objeto User
    this.loyaltyPoints = user.loyalty?.currentPoints ?? null; // <--- Mapeamento CORRIGIDO
  }
}