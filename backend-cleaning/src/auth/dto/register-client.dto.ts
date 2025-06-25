// src/auth/dto/register-client.dto.ts
import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional, ValidateNested, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAddressDto } from '../../common/dto/create-address.dto'; // AJUSTE O CAMINHO CONFORME ONDE VOCÊ CRIOU create-address.dto.ts

export class RegisterClientDto {
  @ApiProperty({ description: 'Endereço de e-mail do cliente', example: 'cliente@example.com' })
  @IsEmail({}, { message: 'O email deve ser um endereço de e-mail válido.' })
  @IsNotEmpty({ message: 'O email é obrigatório.' })
  email: string;

  @ApiProperty({ description: 'Senha do cliente', example: 'SenhaSegura123' })
  @IsNotEmpty({ message: 'A senha é obrigatório.' })
  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;

  @ApiProperty({ description: 'Nome completo do cliente', example: 'João da Silva' })
  @IsNotEmpty({ message: 'O nome completo é obrigatório.' })
  @IsString({ message: 'O nome completo deve ser uma string.' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Telefone do cliente', example: '11999999999' })
  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string.' })
  @Length(10, 11, { message: 'O telefone deve ter 10 ou 11 dígitos.' })
  phone?: string;

  @ApiProperty({ type: () => CreateAddressDto, description: 'Dados do endereço do cliente' })
  @IsNotEmpty({ message: 'Os dados de endereço são obrigatórios.' })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto; // <<--- ESTA LINHA É CRÍTICA!
}