// src/bookings/dto/booking-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus, PaymentIntentStatus } from '@prisma/client';
import { AddressDetailsDto } from '../../common/dto/address-details.dto';
import { Decimal } from '@prisma/client/runtime/library';

function isDecimal(value: any): value is Decimal {
  return value instanceof Decimal;
}

export class BookingDetailsDto {
  @ApiProperty({
    description: 'ID do agendamento',
    example: 'uuid-do-agendamento',
  })
  @IsString()
  id: string;

  @ApiProperty({ description: 'ID do cliente', example: 'uuid-do-cliente' })
  @IsString()
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'ID do provedor', example: 'uuid-do-provedor' })
  @IsString()
  @IsUUID()
  providerId: string;

  @ApiProperty({
    description: 'ID do serviço oferecido pelo provedor',
    example: 'uuid-do-provider-service',
  })
  @IsString()
  @IsUUID()
  providerServiceId: string;

  @ApiProperty({
    description: 'Data agendada',
    example: '2025-07-01T09:00:00.000Z',
  })
  @IsString()
  scheduledDate: string;

  @ApiProperty({ description: 'Hora agendada (HH:mm)', example: '09:00' })
  @IsString()
  scheduledTime: string;

  @ApiProperty({
    enum: BookingStatus,
    description: 'Status atual do agendamento',
    example: BookingStatus.PENDING,
  })
  @IsString()
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiPropertyOptional({
    description: 'Status do agendamento (PT-BR, amigável ao usuário)',
    example: 'Confirmado',
  })
  @IsOptional()
  @IsString()
  statusLabel?: string;

  @ApiProperty({ description: 'Preço total do serviço', example: 120.5 })
  @IsNumber()
  totalPrice: number;

  @ApiPropertyOptional({
    description: 'Notas adicionais sobre o agendamento',
    example: 'Limpeza pesada na cozinha.',
  })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({
    description: 'Data de criação do agendamento',
    example: '2025-07-01T08:00:00.000Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Data da última atualização do agendamento',
    example: '2025-07-01T08:30:00.000Z',
  })
  @IsString()
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'ID do endereço do agendamento',
    example: 'uuid-do-endereco',
  })
  @IsOptional()
  @IsUUID()
  addressId?: string | null;

  @ApiPropertyOptional({
    type: AddressDetailsDto,
    description: 'Detalhes do endereço do agendamento',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDetailsDto)
  address?: AddressDetailsDto | null;

  @ApiPropertyOptional({
    description: 'ID do cupom aplicado, se houver',
    example: 'uuid-do-cupom',
  })
  @IsOptional()
  @IsUUID()
  couponId?: string | null;

  @ApiPropertyOptional({
    description: 'Código do cupom aplicado',
    example: 'DESCONTO10',
  })
  @IsOptional()
  @IsString()
  couponCode?: string | null;

  @ApiPropertyOptional({
    description: 'Valor do desconto aplicado pelo cupom',
    example: 10.5,
  })
  @IsOptional()
  @IsNumber()
  discountAmount?: number | null;

  // Campos achatados do cliente/provedor/serviço para facilitar o consumo no frontend
  @ApiPropertyOptional({
    description: 'Nome completo do cliente',
    example: 'Nome do Cliente',
  })
  @IsOptional()
  @IsString()
  clientFullName?: string;

  @ApiPropertyOptional({
    description: 'E-mail do cliente',
    example: 'cliente@email.com',
  })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiPropertyOptional({
    description: 'URL do avatar do cliente',
    example: 'http://avatar.com/cliente.jpg',
  })
  @IsOptional()
  @IsString()
  clientAvatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Nome completo do provedor',
    example: 'Nome do Provedor',
  })
  @IsOptional()
  @IsString()
  providerFullName?: string;

  @ApiPropertyOptional({
    description: 'E-mail do provedor',
    example: 'provedor@email.com',
  })
  @IsOptional()
  @IsString()
  providerEmail?: string;

  @ApiPropertyOptional({
    description: 'URL do avatar do provedor',
    example: 'http://avatar.com/provedor.jpg',
  })
  @IsOptional()
  @IsString()
  providerAvatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Nome do serviço',
    example: 'Limpeza Residencial',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({ description: 'Preço do serviço', example: 100 })
  @IsOptional()
  @IsNumber()
  servicePrice?: number;

  @ApiPropertyOptional({
    description: 'Duração do serviço em minutos',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  serviceDurationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Descrição do serviço pelo provedor',
    example: 'Limpeza com produtos ecológicos.',
  })
  @IsOptional()
  @IsString()
  providerServiceDescription?: string | null;

  // Avaliação (se já realizada)
  @ApiPropertyOptional({
    description: 'ID da avaliação do booking',
    example: 'uuid-da-review',
  })
  @IsOptional()
  @IsString()
  reviewId?: string | null;

  @ApiPropertyOptional({ description: 'Nota da avaliação (1-5)', example: 5 })
  @IsOptional()
  @IsNumber()
  reviewRating?: number | null;

  @ApiPropertyOptional({
    description: 'Comentário da avaliação',
    example: 'Serviço excelente.',
  })
  @IsOptional()
  @IsString()
  reviewComment?: string | null;

  @ApiPropertyOptional({
    description: 'Indica se o booking já foi avaliado',
    example: true,
  })
  @IsOptional()
  isReviewed?: boolean;

  @ApiPropertyOptional({
    description: 'Data e hora agendadas combinadas (ISO 8601)',
    example: '2025-07-01T09:00:00Z',
  })
  @IsOptional()
  @IsString()
  scheduledDateTime?: string;

  @ApiPropertyOptional({
    description: 'Instante agendado combinado (ISO) já em timezone do backend',
    example: '2025-07-01T09:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  scheduledStart?: string | null;

  @ApiPropertyOptional({
    description: 'Duração do serviço em minutos',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number | null;

  @ApiPropertyOptional({
    description: 'Horário real de início (se iniciado)',
    example: '2025-07-01T09:05:00.000Z',
  })
  @IsOptional()
  @IsString()
  startedAt?: string | null;

  @ApiPropertyOptional({
    description: 'Horário real de conclusão (se finalizado)',
    example: '2025-07-01T13:05:00.000Z',
  })
  @IsOptional()
  @IsString()
  completedAt?: string | null;

  @ApiPropertyOptional({
    description: 'Horário estimado de término (calculado)',
    example: '2025-07-01T13:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  scheduledEndTime?: string | null;

  @ApiPropertyOptional({
    description: 'Status do pagamento (enum PaymentIntentStatus)',
    example: PaymentIntentStatus.PAID,
  })
  @IsOptional()
  @IsString()
  paymentStatus?: PaymentIntentStatus | null;

  @ApiPropertyOptional({
    description: 'Status do pagamento (PT-BR, amigável ao usuário)',
    example: 'Pago',
  })
  @IsOptional()
  @IsString()
  paymentStatusLabel?: string | null;

  constructor(data: {
    id: string;
    clientId: string;
    providerId: string;
    providerServiceId: string;
    scheduledDate: Date | string;
    scheduledTime: string;
    scheduledStart?: Date | string | null;
    durationMinutes?: number | null;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    status: BookingStatus;
    totalPrice: Decimal | number;
    notes?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    addressId?: string | null;
    couponId?: string | null;
    coupon?: { code: string } | null;
    discountAmount?: Decimal | number | null;
    review?: {
      id: string;
      rating: number | Decimal;
      comment?: string | null;
    } | null;
    address?: {
      id?: string;
      cep: string;
      street: string;
      number: string;
      complement?: string | null;
      neighborhood: string;
      city: string;
      state: string;
      latitude: Decimal | number;
      longitude: Decimal | number;
    } | null;
    client?: {
      user?: { avatarUrl?: string | null };
      fullName: string;
      email?: string;
    };
    provider?: {
      user?: { avatarUrl?: string | null };
      fullName: string;
      email?: string;
    };
    providerService?: {
      service: { name: string; price: Decimal | number };
      durationMinutes: number;
      description?: string | null;
    };
    paymentIntent?: {
      status?: PaymentIntentStatus;
    } | null;
  }) {
    const statusLabelMap: Record<string, string> = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      IN_PROGRESS: 'Em andamento',
      COMPLETED: 'Concluído',
      CANCELED: 'Cancelado',
      RESCHEDULED: 'Reagendado',
      PENDING_DISPUTE: 'Em disputa',
      REJECTED: 'Recusado',
      NO_SHOW: 'Não compareceu',
    };
    const paymentLabelMap: Record<string, string> = {
      PENDING: 'Pendente',
      PAID: 'Pago',
      EXPIRED: 'Expirado',
      REFUNDED: 'Reembolsado',
      CHARGEBACK: 'Chargeback',
    };

    this.id = data.id;
    this.clientId = data.clientId;
    this.providerId = data.providerId;
    this.providerServiceId = data.providerServiceId;
    this.scheduledDate =
      data.scheduledDate instanceof Date
        ? data.scheduledDate.toISOString().split('T')[0]
        : data.scheduledDate.split('T')[0];
    this.scheduledTime = data.scheduledTime;
    this.status = data.status;
    this.statusLabel = statusLabelMap[data.status] || data.status;
    this.scheduledStart = data.scheduledStart
      ? data.scheduledStart instanceof Date
        ? data.scheduledStart.toISOString()
        : data.scheduledStart
      : null;
    this.durationMinutes =
      data.durationMinutes !== undefined ? data.durationMinutes : null;
    this.startedAt = data.startedAt
      ? data.startedAt instanceof Date
        ? data.startedAt.toISOString()
        : data.startedAt
      : null;
    this.completedAt = data.completedAt
      ? data.completedAt instanceof Date
        ? data.completedAt.toISOString()
        : data.completedAt
      : null;

    this.totalPrice = isDecimal(data.totalPrice)
      ? data.totalPrice.toNumber()
      : data.totalPrice;
    this.notes = data.notes === undefined ? null : data.notes;
    this.createdAt =
      data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : data.createdAt;
    this.updatedAt =
      data.updatedAt instanceof Date
        ? data.updatedAt.toISOString()
        : data.updatedAt;

    this.addressId = data.addressId === undefined ? null : data.addressId;
    this.address = data.address
      ? new AddressDetailsDto({
          ...data.address,
          latitude: isDecimal(data.address.latitude)
            ? data.address.latitude.toNumber()
            : data.address.latitude,
          longitude: isDecimal(data.address.longitude)
            ? data.address.longitude.toNumber()
            : data.address.longitude,
        })
      : null;

    this.couponId = data.couponId === undefined ? null : data.couponId;
    this.couponCode = data.coupon?.code || null;
    this.discountAmount =
      data.discountAmount === null || data.discountAmount === undefined
        ? null
        : isDecimal(data.discountAmount)
          ? data.discountAmount.toNumber()
          : data.discountAmount;

    if (data.client) {
      this.clientFullName = data.client.fullName;
      this.clientEmail = data.client.email;
      this.clientAvatarUrl = data.client.user?.avatarUrl;
    }
    if (data.provider) {
      this.providerFullName = data.provider.fullName;
      this.providerEmail = data.provider.email;
      this.providerAvatarUrl = data.provider.user?.avatarUrl;
    }
    if (data.providerService) {
      const svcPrice = data.providerService.service.price as any;
      this.serviceName = data.providerService.service.name;
      this.servicePrice = isDecimal(svcPrice)
        ? svcPrice.toNumber()
        : (svcPrice ?? 0);
      this.serviceDurationMinutes = data.providerService.durationMinutes;
      this.providerServiceDescription =
        data.providerService.description ?? null;
    }

    // Payment labels (se paymentIntent vier no include)
    const payStatus = data.paymentIntent?.status;
    this.paymentStatus = payStatus ?? null;
    this.paymentStatusLabel = payStatus
      ? paymentLabelMap[payStatus] || payStatus
      : null;

    // Review mapping
    if (data.review) {
      this.reviewId = data.review.id;
      const ratingVal = data.review.rating as any;
      this.reviewRating = isDecimal(ratingVal)
        ? ratingVal.toNumber()
        : ratingVal;
      this.reviewComment = data.review.comment ?? null;
      this.isReviewed = true;
    } else {
      this.reviewId = null;
      this.reviewRating = null;
      this.reviewComment = null;
      this.isReviewed = false;
    }

    this.scheduledDateTime = `${this.scheduledDate}T${this.scheduledTime}:00Z`;
    // Estimativa de término: usa startedAt se houver, senão scheduledStart/durationMinutes
    const baseEnd = this.startedAt
      ? new Date(this.startedAt)
      : this.scheduledStart
        ? new Date(this.scheduledStart)
        : new Date(this.scheduledDateTime);
    const dur = this.durationMinutes ?? this.serviceDurationMinutes ?? null;
    if (baseEnd instanceof Date && !Number.isNaN(baseEnd.getTime()) && dur) {
      const end = new Date(baseEnd.getTime() + dur * 60000);
      this.scheduledEndTime = end.toISOString();
    } else {
      this.scheduledEndTime = null;
    }
  }
}