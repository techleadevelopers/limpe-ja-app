import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ConversationRequestDto {
  @ApiProperty({
    description: 'ID do agendamento vinculado ao chat solicitado',
    example: 'uuid-do-agendamento',
  })
  @IsUUID()
  bookingId: string;

  constructor(bookingId: string) {
    this.bookingId = bookingId;
  }
}
