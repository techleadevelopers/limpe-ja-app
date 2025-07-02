// src/payments/dto/create-pix-charge.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsOptional, IsUUID, Min, IsEnum } from 'class-validator';
// Remover IsDate se você não for validar a data diretamente aqui como um objeto Date.
// Remover Type se não houver transformações complexas necessárias para este DTO.

// O DTO de entrada para criar uma cobrança PIX
export class CreatePixChargeDto {
  @ApiProperty({ description: 'Valor da cobrança PIX', example: 150.75 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Descrição da cobrança PIX', example: 'Pagamento do serviço de limpeza' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'ID do agendamento relacionado a esta cobrança',
    example: 'uuid-do-agendamento',
  })
  @IsUUID()
  @IsNotEmpty() // Tornando bookingId obrigatório, pois o serviço o usa para consulta e atualização.
  bookingId: string; // Removido '?' para indicar que é obrigatório

  @ApiProperty({
    description: 'ID do provedor que receberá o pagamento (se aplicável)',
    example: 'uuid-do-provedor',
  })
  @IsUUID()
  @IsNotEmpty() // Tornando providerId obrigatório, pois o serviço o valida.
  providerId: string; // Removido '?' para indicar que é obrigatório
}

// DTO de resposta para a criação de uma cobrança PIX
// Este DTO representa o que a API *retornará* para o cliente após a criação da cobrança.
export class PixChargeResponseDto {
  @ApiProperty({ description: 'ID da transação gerada', example: 'uuid-da-transacao' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  // Use um enum real se os status forem fixos e mapeados
  // Caso contrário, use string e documente os possíveis valores.
  @ApiProperty({
    enum: ['PENDING', 'COMPLETED', 'CANCELED', 'EXPIRED'], // Alinhar com os status do PagSeguro e do seu sistema
    description: 'Status da transação. Reflete o estado inicial da cobrança.',
    example: 'PENDING',
  })
  @IsEnum(['PENDING', 'COMPLETED', 'CANCELED', 'EXPIRED']) // Valida contra os valores do enum
  @IsNotEmpty()
  status: 'PENDING' | 'COMPLETED' | 'CANCELED' | 'EXPIRED'; // Tipo mais específico

  @ApiProperty({ description: 'Código PIX Copia e Cola (BR Code)', example: '00020126580014BR.GOV.BCB.PIX0136...' })
  @IsString()
  @IsNotEmpty()
  brCode: string;

  @ApiProperty({ description: 'URL da imagem do QR Code PIX', example: 'https://api.example.com/pix/qrcode/uuid-da-transacao.png' })
  @IsString()
  @IsNotEmpty() // A URL do QR Code é sempre esperada na resposta de sucesso
  qrCodeImage: string;

  @ApiProperty({
    description: 'Data e hora de expiração da cobrança no formato ISO 8601.',
    example: '2025-06-01T10:30:00.000Z',
  })
  @IsString() // O serviço retorna string (toISOString())
  @IsNotEmpty()
  expiresAt: string;

  @ApiProperty({ description: 'Valor da cobrança PIX', example: 150.75 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Descrição da cobrança PIX', example: 'Pagamento do serviço de limpeza' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'ID do agendamento relacionado a esta cobrança', example: 'uuid-do-agendamento' })
  @IsOptional() // Mantido opcional se a transação puder existir sem um bookingId em outros contextos
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ description: 'ID do provedor que receberá o pagamento', example: 'uuid-do-provedor' })
  @IsUUID()
  @IsNotEmpty()
  providerId: string; // Adicionado aqui, pois é uma informação importante na resposta.

  // Estes campos são extras para o DTO de resposta do frontend (como você indicou antes)
  // Se não forem retornados pela API, considere removê-los ou movê-los para um DTO específico do frontend.
  @ApiPropertyOptional({ description: 'Mensagem de erro do BR Code (se houver, para depuração/exibição)', example: 'Código PIX inválido' })
  @IsOptional()
  @IsString()
  brCodeError?: string;

  @ApiPropertyOptional({ description: 'Data de expiração em formato alternativo (se usado internamente)', example: '2025-06-01T10:30:00.000Z' })
  @IsOptional()
  @IsString()
  expirationDate?: string;
}