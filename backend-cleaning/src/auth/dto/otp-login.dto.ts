import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Número de telefone com DDD (apenas números)',
    example: '11999999999',
  })
  @IsNotEmpty({ message: 'O número de telefone é obrigatório.' })
  @IsString({ message: 'O número de telefone deve ser uma string.' })
  @Length(11, 11, { message: 'O número de telefone deve ter 11 dígitos.' })
  @Matches(/^[1-9][1-9]\d{9}$/, { message: 'Formato de telefone inválido.' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Número de telefone com DDD (apenas números)',
    example: '11999999999',
  })
  @IsNotEmpty({ message: 'O número de telefone é obrigatório.' })
  @IsString({ message: 'O número de telefone deve ser uma string.' })
  @Length(11, 11, { message: 'O número de telefone deve ter 11 dígitos.' })
  @Matches(/^[1-9][1-9]\d{9}$/, { message: 'Formato de telefone inválido.' })
  phone: string;

  @ApiProperty({
    description: 'Código OTP de 6 dígitos',
    example: '123456',
  })
  @IsNotEmpty({ message: 'O código OTP é obrigatório.' })
  @IsString({ message: 'O código OTP deve ser uma string.' })
  @Length(6, 6, { message: 'O código OTP deve ter 6 dígitos.' })
  @Matches(/^\d{6}$/, { message: 'O código OTP deve conter apenas números.' })
  otpCode: string;
}
