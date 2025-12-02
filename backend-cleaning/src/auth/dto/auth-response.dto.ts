// src/auth/dto/auth-response.dto.ts
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../users/dto/user-profile.dto'; // VERIFIQUE ESTE CAMINHO!

export class AuthResponseDto {
  @ApiProperty({ description: 'O token JWT de acesso' })
  @IsString()
  accessToken: string;

  @ApiProperty({
    type: () => UserProfileDto,
    description: 'O perfil do usuário autenticado',
  })
  @ValidateNested()
  @Type(() => UserProfileDto)
  user: UserProfileDto;

  // REMOVIDO: isNewUser (era específico do fluxo de OTP)
  // @ApiProperty({ description: 'Indica se um novo usuário foi criado durante o processo de autenticação por OTP', example: false, required: false })
  // isNewUser?: boolean;
}
