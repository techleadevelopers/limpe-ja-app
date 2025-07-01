// src/providers/dto/update-provider-profile.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsUrl,
  IsDateString,
  IsPhoneNumber,
  ValidateNested // Adicionei ValidateNested aqui, se não estava
} from 'class-validator';
import { Type } from 'class-transformer'; // Adicionei Type aqui, se não estava
import { CreateAddressDto } from '../../common/dto/create-address.dto'; // Reutilize o DTO de endereço
import { VerificationStatus } from '@prisma/client'; // Importar VerificationStatus para tipagem


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

  // Removi `verified?: boolean;` e adicionei `verificationStatus?: VerificationStatus;`
  // O seu modelo Provider no Prisma usa 'verificationStatus' com um Enum, não um booleano 'verified'.
  @ApiPropertyOptional({
    enum: VerificationStatus,
    description: 'Status de verificação do provedor',
    example: VerificationStatus.PENDING_INITIAL_REVIEW
  })
  @IsOptional()
  @IsString() // Validar como string, pois é um enum string no DTO
  // @IsEnum(VerificationStatus) // Se você quiser uma validação mais rigorosa para o enum
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Biografia do provedor', example: 'Profissional dedicada à limpeza...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Chave PIX do provedor', example: 'meu.pix@email.com' })
  @IsOptional()
  @IsString()
  pixKey?: string; // <-- ADICIONADO AQUI

  @ApiPropertyOptional({ type: CreateAddressDto, description: 'Informações de endereço do provedor' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}