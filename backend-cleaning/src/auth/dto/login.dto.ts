// src/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // <<-- IMPORTANTE: Adicionar esta importação

export class LoginDto {
  @ApiProperty({ description: 'Endereço de e-mail do usuário', example: 'usuario@example.com' }) // <<-- ADICIONADO
  @IsEmail({}, { message: 'O email deve ser um endereço de email válido.' })
  @IsNotEmpty({ message: 'O email é obrigatório.' })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'SuaSenhaSegura123!' }) // <<-- ADICIONADO
  @IsString({ message: 'A senha deve ser uma string.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;
}