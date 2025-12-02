// src/auth/dto/register-client.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  ValidateNested,
  IsOptional,
  Matches,
  Length,
} from 'class-validator'; // Adicionado Length
import { Type } from 'class-transformer';
import { CreateAddressDto } from '../../common/dto/create-address.dto'; // Assumindo o caminho correto

export class RegisterClientDto {
  @ApiProperty({
    description: 'Endereço de e-mail do cliente',
    example: 'novo.cliente@example.com',
  })
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @ApiProperty({
    description:
      'Senha do cliente (mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial)',
    example: 'Senha@123',
  })
  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.',
    },
  )
  @IsNotEmpty({ message: 'A senha é obrigatório.' })
  password: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João da Silva',
  })
  @IsString({ message: 'O nome completo deve ser uma string.' })
  @IsNotEmpty({ message: 'O nome completo é obrigatório.' })
  fullName: string;

  @ApiPropertyOptional({
    description: 'Número de telefone do cliente',
    example: '11987654321',
  })
  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string.' })
  @Length(10, 11, { message: 'O telefone deve ter 10 ou 11 dígitos.' }) // Adicionado Length para validação de telefone
  phone?: string;

  // CORREÇÃO: Adicionado o campo CPF
  @ApiProperty({ description: 'CPF do cliente', example: '12345678900' })
  @IsString({ message: 'O CPF deve ser uma string.' })
  @IsNotEmpty({ message: 'O CPF é obrigatório.' })
  @Length(11, 11, { message: 'O CPF deve ter exatamente 11 dígitos.' }) // Adicionado Length para CPF
  // Você pode adicionar uma validação de CPF mais robusta aqui, se desejar
  // @Matches(/^\d{11}$/, { message: 'O CPF deve conter apenas dígitos e ter 11 caracteres.' })
  cpf: string;

  @ApiProperty({
    type: () => CreateAddressDto,
    description: 'Endereço do cliente',
  })
  @IsNotEmpty({ message: 'Os dados de endereço são obrigatórios.' }) // Adicionado IsNotEmpty para address
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @ApiPropertyOptional({
    description: 'Código de indicação, se houver',
    example: 'ABC123XYZ',
  })
  @IsOptional()
  @IsString()
  referralCode?: string; // <<-- ADICIONADO
}
