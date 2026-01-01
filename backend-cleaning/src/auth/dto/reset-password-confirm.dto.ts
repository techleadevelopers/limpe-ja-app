// src/auth/dto/reset-password-confirm.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordConfirmDto {
  @ApiProperty({
    description: 'Token utilizado para validar a redefinição de senha',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: 'O token de redefinição é obrigatório.' })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Nova senha do usuário (mínimo de 8 caracteres)',
    example: 'NovaSenha@123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'A nova senha é obrigatória.' })
  @IsString()
  @MinLength(8, {
    message: 'A nova senha deve ter pelo menos 8 caracteres.',
  })
  newPassword: string;
}
