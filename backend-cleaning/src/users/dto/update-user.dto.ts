// src/users/dto/update-user.dto.ts

import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Se você estiver usando Swagger para documentação da API

export class UpdateUserDto {
  @ApiProperty({ example: 'novo.email@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Paulo Silva', required: false })
  @IsOptional()
  @IsString()
  fullName?: string; // Adicionado

  @ApiProperty({ example: '+5511987654321', required: false })
  @IsOptional()
  @IsString()
  phone?: string; // Adicionado

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string; // Adicionado

  // Adicione outras propriedades que podem ser atualizadas, se houver
}