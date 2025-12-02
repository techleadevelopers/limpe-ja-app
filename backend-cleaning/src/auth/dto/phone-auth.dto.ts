// src/auth/dto/phone-auth.dto.ts
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckPhoneDto {
  @ApiProperty({
    description: 'Número de telefone com DDD (apenas números)',
    example: '11999999999',
  })
  @IsNotEmpty({ message: 'O número de telefone é obrigatório.' })
  @IsString({ message: 'O número de telefone deve ser uma string.' })
  @Length(11, 11, { message: 'O número de telefone deve ter 11 dígitos.' })
  @Matches(/^[1-9][1-9]\d{9}$/, { message: 'Formato de telefone inválido.' })
  phoneNumber: string;
}

export class LoginWithPhoneNumberAndPasswordDto {
  @ApiProperty({
    description: 'Número de telefone com DDD (apenas números)',
    example: '11999999999',
  })
  @IsNotEmpty({ message: 'O número de telefone é obrigatório.' })
  @IsString({ message: 'O número de telefone deve ser uma string.' })
  @Length(11, 11, { message: 'O número de telefone deve ter 11 dígitos.' })
  @Matches(/^[1-9][1-9]\d{9}$/, { message: 'Formato de telefone inválido.' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'SuaSenhaSegura123!',
  })
  @IsString({ message: 'A senha deve ser uma string.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  password: string;
}
