// src/common/dto/create-address.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, Length, IsAlphanumeric } from 'class-validator'; // Importe Length e IsAlphanumeric

export class CreateAddressDto {
  @ApiProperty({ description: 'CEP', example: '01001000' })
  @IsString({ message: 'O CEP deve ser uma string.' })
  @IsNotEmpty({ message: 'O CEP é obrigatório.' })
  @Length(8, 9, { message: 'O CEP deve ter 8 ou 9 caracteres (com ou sem hífen).' }) // Validação para 8 ou 9 caracteres
  cep: string;

  @ApiProperty({ description: 'Rua', example: 'Praça da Sé' })
  @IsString({ message: 'A rua deve ser uma string.' })
  @IsNotEmpty({ message: 'A rua é obrigatória.' })
  street: string;

  @ApiProperty({ description: 'Número', example: '100' })
  @IsString({ message: 'O número deve ser uma string.' })
  @IsNotEmpty({ message: 'O número é obrigatório.' })
  number: string;

  @ApiPropertyOptional({ description: 'Complemento', example: 'Apto 10' })
  @IsOptional()
  @IsString({ message: 'O complemento deve ser uma string.' })
  @Length(0, 100, { message: 'O complemento deve ter no máximo 100 caracteres.' }) // Validação de comprimento para complemento
  complement?: string;

  @ApiProperty({ description: 'Bairro', example: 'Sé' })
  @IsString({ message: 'O bairro deve ser uma string.' })
  @IsNotEmpty({ message: 'O bairro é obrigatório.' })
  neighborhood: string;

  @ApiProperty({ description: 'Cidade', example: 'São Paulo' })
  @IsString({ message: 'A cidade deve ser uma string.' })
  @IsNotEmpty({ message: 'A cidade é obrigatória.' })
  city: string;

  @ApiProperty({ description: 'Estado (UF)', example: 'SP' })
  @IsString({ message: 'O estado deve ser uma string.' })
  @IsNotEmpty({ message: 'O estado é obrigatório.' })
  @Length(2, 2, { message: 'O estado deve ter 2 caracteres (UF).' }) // Validação para 2 caracteres
  @IsAlphanumeric('pt-BR', { message: 'O estado deve conter apenas letras e números, mas para UF geralmente são apenas letras.' }) // Opcional, para garantir que seja alfanumérico
  state: string;
}