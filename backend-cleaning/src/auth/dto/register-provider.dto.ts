// src/auth/dto/register-provider.dto.ts
import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional, ValidateNested, IsNumber, IsDateString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAddressDto } from '../../common/dto/create-address.dto'; // AJUSTE O CAMINHO CONFORME ONDE VOCÊ CRIOU create-address.dto.ts

export class RegisterProviderDto {
  @ApiProperty({ description: 'Endereço de e-mail do provedor', example: 'provedor@example.com' })
  @IsEmail({}, { message: 'O email deve ser um endereço de e-mail válido.' })
  @IsNotEmpty({ message: 'O email é obrigatório.' })
  email: string;

  @ApiProperty({ description: 'Senha do provedor', example: 'SenhaSegura123' })
  @IsNotEmpty({ message: 'A senha é obrigatório.' })
  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;

  @ApiProperty({ description: 'Nome completo do provedor', example: 'Maria da Silva' })
  @IsNotEmpty({ message: 'O nome completo é obrigatório.' })
  @IsString({ message: 'O nome completo deve ser uma string.' })
  fullName: string; // Adicionado fullName para provedor também

  @ApiProperty({ description: 'CPF do provedor', example: '12345678900' })
  @IsNotEmpty({ message: 'O CPF é obrigatório.' })
  @IsString({ message: 'O CPF deve ser uma string.' })
  @Length(11, 14, { message: 'O CPF deve ter entre 11 e 14 caracteres (com ou sem formatação).' })
  cpf: string;

  @ApiProperty({ description: 'Data de nascimento do provedor (ISO 8601)', example: '1990-01-01' })
  @IsNotEmpty({ message: 'A data de nascimento é obrigatória.' })
  @IsDateString({}, { message: 'A data de nascimento deve ser uma string de data válida (ISO 8601).' })
  dateOfBirth: string;

  @ApiPropertyOptional({ description: 'Telefone do provedor', example: '11999999999' })
  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string.' })
  @Length(10, 11, { message: 'O telefone deve ter 10 ou 11 dígitos.' })
  phone?: string;

  @ApiProperty({ type: () => CreateAddressDto, description: 'Dados do endereço do provedor' })
  @IsNotEmpty({ message: 'Os dados de endereço são obrigatórios.' })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto; // <<--- ESTA LINHA É CRÍTICA!

  @ApiPropertyOptional({ description: 'Anos de experiência do provedor', example: 5 })
  @IsOptional()
  @IsNumber({}, { message: 'Anos de experiência deve ser um número.' })
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'URL do avatar do provedor', example: 'http://example.com/avatar.jpg' })
  @IsOptional()
  @IsString({ message: 'A URL do avatar deve ser uma string.' })
  avatarUrl?: string;
}