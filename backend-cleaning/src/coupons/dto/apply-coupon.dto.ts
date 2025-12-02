// backend-cleaning/src/coupons/dto/apply-coupon.dto.ts
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsUUID,
  IsNumber,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Dados mínimos do agendamento usados para validar/aplicar o cupom.
 * Esses campos devem refletir os que o serviço de cupons utiliza
 * para checagens de alvo (serviço específico, provedor específico, etc.).
 */
export class BookingDataForCouponDto {
  @IsOptional()
  @IsUUID()
  clientId?: string; // Cliente que está usando o cupom (opcional; normalmente inferido por userId do JWT)

  @IsOptional()
  @IsUUID()
  providerServiceId?: string; // Serviço sendo agendado

  @IsOptional()
  @IsUUID()
  providerId?: string; // Provedor selecionado

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  originalPrice?: number; // Preço antes do desconto

  @IsOptional()
  @IsISO8601()
  scheduledDate?: string; // Data do agendamento (ISO 8601)
}

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ValidateNested()
  @Type(() => BookingDataForCouponDto)
  bookingData!: BookingDataForCouponDto;
}

/**
 * Resultado da aplicação de cupom retornado pelo service.
 * Mantemos 'coupon' como any para evitar dependência direta do tipo Prisma aqui.
 */
export interface CouponApplicationResult {
  discountAmount: number;
  newTotalPrice: number;
  message: string;
  coupon?: any; // objeto do cupom aplicado (quando aplicável)
}
