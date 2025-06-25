// src/users/dto/user-profile.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client'; // Removido Client, Provider, Address, Prisma, ProviderService, Service, Review pois não são usados diretamente aqui
import { IsString, IsEnum, IsDate, ValidateNested, IsOptional, IsNumber, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientDetailsDto } from '../../clients/dto/client-details.dto';
import { ProviderDetailsDto } from '../../providers/dto/provider-details.dto';

// === IMPORTANDO OS TIPOS DE SERVIÇO DEFINITIVOS ===
// Certifique-se de que estes caminhos e nomes de tipo estão corretos nos seus serviços
import { ProviderWithIncludes } from '../../providers/providers.service'; // <<-- IMPORTADO
import { ClientWithIncludes } from '../../clients/clients.service'; // <<-- VOCÊ PRECISARÁ VERIFICAR O NOME EXATO E CAMINHO DO SEU TIPO NO CLIENTS.SERVICE.TS

// =========================================================================
// CORREÇÃO: Usando os tipos de serviço já definidos
// =========================================================================

// Agora usamos os tipos mais completos diretamente
// type UserProfileProviderWithRelations = ProviderWithIncludes; // Não é mais necessário, usaremos ProviderWithIncludes diretamente
// type UserProfileClientWithRelations = ClientWithIncludes; // Não é mais necessário, usaremos ClientWithIncludes diretamente


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
  avatarUrl?: string | null; // <--- Adicionado para UserProfileDto

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

  constructor(
    user: User & { // O objeto user precisa ter o avatarUrl agora
      avatarUrl?: string | null; // Adicionado ao User no schema.prisma, então ele deve estar aqui também
      client?: ClientWithIncludes; // <<-- USANDO O TIPO COMPLETO DO CLIENTS.SERVICE
      provider?: ProviderWithIncludes; // <<-- USANDO O TIPO COMPLETO DO PROVIDERS.SERVICE
    }
  ) {
    this.id = user.id;
    this.email = user.email;
    this.avatarUrl = user.avatarUrl; // <--- Mapeando avatarUrl
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;

    if (user.role === UserRole.CLIENT && user.client) {
      this.fullName = user.client.fullName;
      this.phone = user.client.phone;
      this.clientDetails = new ClientDetailsDto(user.client);
    } else if (user.role === UserRole.PROVIDER && user.provider) {
      this.fullName = user.provider.fullName;
      this.phone = user.provider.phone;
      this.providerDetails = new ProviderDetailsDto(user.provider); // <--- Agora user.provider é ProviderWithIncludes
    }
  }
}