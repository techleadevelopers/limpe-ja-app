import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class ConversationResponseDto {
  @ApiProperty({
    description: 'ID da conversa criada ou encontrada',
    example: 'uuid-do-chat',
  })
  @IsString()
  @IsUUID()
  chatId: string;

  @ApiProperty({
    description: 'ID do agendamento relacionado',
    example: 'uuid-do-agendamento',
  })
  @IsString()
  @IsUUID()
  bookingId: string;

  @ApiProperty({
    description: 'ID do provedor participante',
    example: 'uuid-do-provedor',
  })
  @IsString()
  @IsUUID()
  providerId: string;

  @ApiProperty({
    description: 'ID do usuário do provedor',
    example: 'user-123',
  })
  @IsString()
  providerUserId: string;

  @ApiProperty({
    description: 'Nome completo do provedor',
    example: 'Ana Prestadora',
  })
  @IsString()
  providerFullName: string;

  @ApiPropertyOptional({
    description: 'Avatar do provedor (URL)',
    example: 'https://.../avatar.jpg',
  })
  @IsOptional()
  @IsString()
  providerAvatarUrl?: string | null;

  @ApiProperty({
    description: 'ID do usuário do cliente',
    example: 'user-456',
  })
  @IsString()
  clientUserId: string;

  constructor(data: {
    chatId: string;
    bookingId: string;
    providerId: string;
    providerUserId: string;
    providerFullName: string;
    providerAvatarUrl?: string | null;
    clientUserId: string;
  }) {
    this.chatId = data.chatId;
    this.bookingId = data.bookingId;
    this.providerId = data.providerId;
    this.providerUserId = data.providerUserId;
    this.providerFullName = data.providerFullName;
    this.providerAvatarUrl = data.providerAvatarUrl ?? null;
    this.clientUserId = data.clientUserId;
  }
}
