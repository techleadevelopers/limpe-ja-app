// src/providers/dto/update-provider-profile.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsUrl, IsDateString, IsBoolean, ValidateNested, IsPhoneNumber } from 'class-validator'; // Removi IsUUID e IsNotEmpty, pois não são estritamente necessários aqui para propriedades opcionais
import { Type } from 'class-transformer';
import { CreateAddressDto } from '../../common/dto/create-address.dto'; // Reutilize o DTO de endereço

export class UpdateProviderProfileDto {
  @ApiPropertyOptional({ description: 'Nome completo do provedor' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'CPF do provedor (apenas números)', example: '12345678900' })
  @IsOptional()
  @IsString()
  // @IsCPF() // Se você tiver um validador de CPF customizado
  cpf?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento do provedor (formato ISO 8601)', example: '1990-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Telefone do provedor', example: '+5511987654321' })
  @IsOptional()
  @IsPhoneNumber('BR') // Valida como número de telefone brasileiro
  phone?: string;

  @ApiPropertyOptional({ description: 'URL do avatar do provedor' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Anos de experiência do provedor' })
  @IsOptional()
  @IsInt()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Status de verificação do provedor' })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Biografia do provedor', example: 'Profissional dedicada à limpeza...' })
  @IsOptional()
  @IsString()
  bio?: string; // <-- ADICIONADO AQUI

  @ApiPropertyOptional({ type: CreateAddressDto, description: 'Informações de endereço do provedor' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}