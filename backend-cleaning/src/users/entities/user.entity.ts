// src/users/entities/user.entity.ts
import { User as PrismaUser, UserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Usa Omit para criar uma nova interface que exclui a propriedade 'passwordHash'
export class UserEntity implements Omit<PrismaUser, 'passwordHash'> {
  @ApiProperty({ description: 'ID único do usuário', example: 'uuid-do-usuario' })
  id: string;

  @ApiProperty({ description: 'Endereço de e-mail do usuário', example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Número de telefone do usuário', example: '11999998888' })
  phone: string | null;

  @ApiProperty({ description: 'Nome completo do usuário', example: 'João da Silva' })
  fullName: string;

  @ApiProperty({ description: 'Função do usuário no sistema', enum: UserRole, example: 'CLIENT' })
  role: UserRole;

  @ApiPropertyOptional({ description: 'URL do avatar do usuário', example: 'http://example.com/avatar.jpg' })
  avatarUrl: string | null;

  @ApiPropertyOptional({ description: 'ID do usuário no Firebase', example: 'firebase-uid-exemplo' })
  firebaseUid: string | null;

  @ApiPropertyOptional({ description: 'Token de notificação do Firebase Cloud Messaging', example: 'fcm-token-exemplo' })
  fcmToken: string | null;

  @ApiProperty({ description: 'Indica se o telefone foi verificado', example: true })
  isPhoneVerified: boolean;

  @ApiProperty({ description: 'Status de verificação geral do usuário', example: true })
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'Data e hora de agendamento de exclusão da conta (LGPD)', example: '2023-01-01T10:00:00.000Z' })
  deletionScheduledAt: Date | null;

  @ApiProperty({ description: 'Data de criação do usuário', example: '2023-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do usuário', example: '2023-01-01T10:00:00.000Z' })
  updatedAt: Date;

  // Os campos otpCode e otpExpiresAt não fazem parte do seu schema atual e foram removidos para evitar erros.

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
