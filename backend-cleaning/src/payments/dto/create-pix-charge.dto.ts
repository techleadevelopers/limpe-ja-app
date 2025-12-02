// src/payments/dto/create-pix-charge.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentIntentResponseDto } from './payment-intent-response.dto';
import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  IsEnum,
} from 'class-validator';
// Remover IsDate se você não for validar a data diretamente aqui como um objeto Date.
// Remover Type se não houver transformações complexas necessárias para este DTO.

// O DTO de entrada para criar uma cobrança PIX
export class CreatePixChargeDto {
  @ApiProperty({ description: 'Valor da cobrança PIX', example: 150.75 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Descrição da cobrança PIX',
    example: 'Pagamento do serviço de limpeza',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'ID do agendamento relacionado a esta cobrança',
    example: 'uuid-do-agendamento',
  })
  @IsString()
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
  @ApiProperty({
    description: 'ID da ordem PagBank (ORDE_*)',
    example: 'ORDE_123',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'ID da cobran�a PagBank (CHAR_*)',
    example: 'CHAR_123',
  })
  @IsString()
  @IsNotEmpty()
  chargeId: string;

  @ApiProperty({
    enum: ['WAITING', 'PAID', 'EXPIRED', 'CANCELED', 'FAILED'],
    description: 'Status retornado pelo PagBank.',
    example: 'WAITING',
  })
  @IsEnum(['WAITING', 'PAID', 'EXPIRED', 'CANCELED', 'FAILED'])
  @IsNotEmpty()
  status: 'WAITING' | 'PAID' | 'EXPIRED' | 'CANCELED' | 'FAILED';

  @ApiProperty({
    description: 'C�digo PIX Copia e Cola (BR Code)',
    example: '00020126580014BR.GOV.BCB.PIX0136...',
  })
  @IsString()
  @IsNotEmpty()
  qrCodeText: string;

  @ApiProperty({
    description: 'URL da imagem do QR Code PIX',
    example: 'https://sandbox.api.pagseguro.com/qrcode/...',
  })
  @IsString()
  @IsNotEmpty()
  qrCodeImageUrl: string;

  @ApiProperty({
    description: 'Data e hora de expira��o da cobran�a no formato ISO 8601.',
    example: '2025-06-01T10:30:00.000Z',
  })
  @IsString()
  @IsNotEmpty()
  expiresAt: string;

  @ApiProperty({ description: 'Valor da cobran�a PIX', example: 150.75 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Descri��o da cobran�a PIX',
    example: 'Pagamento do servi�o de limpeza',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'ID do agendamento relacionado a esta cobran�a',
    example: 'uuid-do-agendamento',
  })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({
    description: 'ID do provedor que receber� o pagamento',
    example: 'uuid-do-provedor',
  })
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @ApiPropertyOptional({
    description: 'Payment Intent associado � cobran�a',
    type: () => PaymentIntentResponseDto,
  })
  @IsOptional()
  paymentIntent?: PaymentIntentResponseDto;
}
