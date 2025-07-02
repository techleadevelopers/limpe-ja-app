// src/payments/dto/create-pix-charge.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsOptional, IsUUID, Min, IsDate, IsEnum } from 'class-validator'; // Adicionado IsDate, IsEnum
import { Type } from 'class-transformer'; // Adicionado Type

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

  @ApiPropertyOptional({ description: 'ID do agendamento relacionado a esta cobrança', example: 'uuid-do-agendamento' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'ID do provedor que receberá o pagamento (se aplicável)', example: 'uuid-do-provedor' })
  @IsOptional()
  @IsUUID()
  providerId?: string; // Opcional, se o pagamento for para a plataforma ou para um provedor específico
}

// DTO de resposta para a criação de uma cobrança PIX
export class PixChargeResponseDto {
  @ApiProperty({ description: 'ID da transação gerada', example: 'uuid-da-transacao' })
  @IsString() // Adicionado IsString para validação
  transactionId: string;

  @ApiProperty({ enum: ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'], description: 'Status da transação', example: 'PENDING' }) // Usar enum
  @IsString() // Status é string no seu caso
  @IsNotEmpty() // Status não deve ser vazio
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'; // Mais específico para o status

  @ApiProperty({ description: 'Código PIX Copia e Cola (BR Code)', example: '00020126580014BR.GOV.BCB.PIX0136...' })
  @IsString()
  @IsNotEmpty()
  brCode: string;

  @ApiProperty({ description: 'URL da imagem do QR Code PIX', example: 'https://api.example.com/pix/qrcode/uuid-da-transacao.png' })
  // CORREÇÃO: Removido IsOptional() e o '?' para tornar qrCodeImage requerido
  @IsString() // A URL é uma string
  qrCodeImage: string; // Agora é requerido

  @ApiProperty({ description: 'Data e hora de expiração da cobrança', example: '2025-06-01T10:30:00.000Z' })
  // CORREÇÃO: Alterado de Date para string e removido IsOptional() e o '?'
  @IsString() // A data de expiração é uma string ISO 8601
  expiresAt: string; // Agora é requerido e do tipo string

  @ApiProperty({ description: 'Valor da cobrança PIX', example: 150.75 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Descrição da cobrança PIX', example: 'Pagamento do serviço de limpeza' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'ID do agendamento relacionado a esta cobrança', example: 'uuid-do-agendamento' })
  @IsOptional()
  @IsUUID() // Se bookingId é um UUID
  bookingId?: string; // <<<<< CORREÇÃO: ADICIONADO A PROPRIEDADE AQUI >>>>>
  
  // Estes campos são extras no frontend DTO, mantidos como opcionais
  @ApiPropertyOptional({ description: 'Mensagem de erro do BR Code (se houver)', example: 'Código PIX inválido' })
  @IsOptional()
  @IsString()
  brCodeError?: string; 

  @ApiPropertyOptional({ description: 'Data de expiração em formato alternativo (se usado)', example: '2025-06-01T10:30:00.000Z' })
  @IsOptional()
  @IsString()
  expirationDate?: string; 
}
