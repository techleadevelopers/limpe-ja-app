// src/bookings/dto/booking-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus, Prisma } from '@prisma/client';
import { AddressDetailsDto } from '../../common/dto/address-details.dto'; // <<-- IMPORTANTE: Importe AddressDetailsDto AQUI
import { Decimal } from '@prisma/client/runtime/library'; // Explicitamente importar Decimal para verificação de tipo

// Função auxiliar (type guard) para verificar se um valor é uma instância de Prisma.Decimal
function isDecimal(value: any): value is Decimal {
  return value instanceof Decimal;
}

export class BookingDetailsDto {
  @ApiProperty({ description: 'ID do agendamento', example: 'uuid-do-agendamento' })
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

  @ApiProperty({ description: 'ID do serviço oferecido pelo provedor', example: 'uuid-do-provider-service' })
  @IsString()
  @IsUUID()
  providerServiceId: string;

  @ApiProperty({ description: 'Data agendada', example: '2025-07-01T09:00:00.000Z' })
  @IsString()
  scheduledDate: string;

  @ApiProperty({ description: 'Hora agendada (HH:mm)', example: '09:00' })
  @IsString()
  scheduledTime: string;

  @ApiProperty({ enum: BookingStatus, description: 'Status atual do agendamento', example: BookingStatus.PENDING })
  @IsString()
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiProperty({ description: 'Preço total do serviço', example: 120.50 })
  @IsNumber()
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Notas adicionais sobre o agendamento', example: 'Limpeza pesada na cozinha.' })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ description: 'Data de criação do agendamento', example: '2025-07-01T08:00:00.000Z' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Data da última atualização do agendamento', example: '2025-07-01T08:30:00.000Z' })
  @IsString()
  updatedAt: string;

  @ApiPropertyOptional({ description: 'ID do endereço do agendamento', example: 'uuid-do-endereco' })
  @IsOptional()
  @IsUUID()
  addressId?: string | null;

  @ApiPropertyOptional({ type: AddressDetailsDto, description: 'Detalhes do endereço do agendamento' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDetailsDto) // <-- AGORA REFERENCIA AddressDetailsDto
  address?: AddressDetailsDto | null; // <-- TIPO CORRIGIDO AQUI

  @ApiPropertyOptional({ description: 'ID do cupom aplicado, se houver', example: 'uuid-do-cupom' })
  @IsOptional()
  @IsUUID()
  couponId?: string | null;

  @ApiPropertyOptional({ description: 'Código do cupom aplicado', example: 'DESCONTO10' })
  @IsOptional()
  @IsString()
  couponCode?: string | null;

  @ApiPropertyOptional({ description: 'Valor do desconto aplicado pelo cupom', example: 10.50 })
  @IsOptional()
  @IsNumber()
  discountAmount?: number | null; // <<-- ADICIONADO

  // Campos achatados do cliente/provedor/serviço para facilitar o consumo no frontend
  @ApiPropertyOptional({ description: 'Nome completo do cliente', example: 'Nome do Cliente' })
  @IsOptional()
  @IsString()
  clientFullName?: string;

  @ApiPropertyOptional({ description: 'E-mail do cliente', example: 'cliente@email.com' })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiPropertyOptional({ description: 'URL do avatar do cliente', example: 'http://avatar.com/cliente.jpg' })
  @IsOptional()
  @IsString()
  clientAvatarUrl?: string | null;

  @ApiPropertyOptional({ description: 'Nome completo do provedor', example: 'Nome do Provedor' })
  @IsOptional()
  @IsString()
  providerFullName?: string;

  @ApiPropertyOptional({ description: 'E-mail do provedor', example: 'provedor@email.com' })
  @IsOptional()
  @IsString()
  providerEmail?: string;

  @ApiPropertyOptional({ description: 'URL do avatar do provedor', example: 'http://avatar.com/provedor.jpg' })
  @IsOptional()
  @IsString()
  providerAvatarUrl?: string | null;

  @ApiPropertyOptional({ description: 'Nome do serviço', example: 'Limpeza Residencial' })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({ description: 'Preço do serviço', example: 100.00 })
  @IsOptional()
  @IsNumber()
  servicePrice?: number;

  @ApiPropertyOptional({ description: 'Duração do serviço em minutos', example: 120 })
  @IsOptional()
  @IsNumber()
  serviceDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Descrição do serviço pelo provedor', example: 'Limpeza com produtos ecológicos.' })
  @IsOptional()
  @IsString()
  providerServiceDescription?: string | null;

  @ApiPropertyOptional({ description: 'Data e hora agendadas combinadas (ISO 8601)', example: '2025-07-01T09:00:00Z' })
  @IsOptional()
  @IsString()
  scheduledDateTime?: string;

  constructor(data: {
    id: string;
    clientId: string;
    providerId: string;
    providerServiceId: string;
    scheduledDate: Date | string;
    scheduledTime: string;
    status: BookingStatus;
    totalPrice: Decimal | number; // Aceita Decimal ou number
    notes?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    addressId?: string | null;
    couponId?: string | null; // NOVO
    coupon?: { code: string } | null; // NOVO: Inclui código do cupom
    discountAmount?: Decimal | number | null; // Aceita Decimal ou number
    // O construtor espera um objeto que tenha o 'id' e as outras propriedades do Address do Prisma
    address?: {
      id?: string; // ID pode ser opcional ao construir a partir de um objeto parcial
      cep: string; street: string; number: string;
      complement?: string | null; // CORREÇÃO: Tornar complement opcional aqui
      neighborhood: string; city: string; state: string;
      latitude: Decimal | number; // Aceita Decimal ou number
      longitude: Decimal | number; // Aceita Decimal ou number
    } | null; // <-- Tipo no construtor para o que vem do Prisma

    client?: { user?: { avatarUrl?: string | null; }; fullName: string; email?: string; };
    provider?: { user?: { avatarUrl?: string | null; }; fullName: string; email?: string; };
    providerService?: { service: { name: string; price: Decimal; }; durationMinutes: number; description?: string | null; }; // Aceita Decimal para preço do serviço
  }) {
    this.id = data.id;
    this.clientId = data.clientId;
    this.providerId = data.providerId;
    this.providerServiceId = data.providerServiceId;
    this.scheduledDate = data.scheduledDate instanceof Date ? data.scheduledDate.toISOString().split('T')[0] : (data.scheduledDate as string).split('T')[0];
    this.scheduledTime = data.scheduledTime;
    this.status = data.status;

    // Converte totalPrice de Decimal para number, se necessário
    let convertedTotalPrice: number;
    if (isDecimal(data.totalPrice)) {
      convertedTotalPrice = data.totalPrice.toNumber();
    } else {
      convertedTotalPrice = data.totalPrice;
    }
    this.totalPrice = convertedTotalPrice;

    this.notes = data.notes === undefined ? null : data.notes;
    
    this.createdAt = data.createdAt instanceof Date ? data.createdAt.toISOString() : data.createdAt;
    this.updatedAt = data.updatedAt instanceof Date ? data.updatedAt.toISOString() : data.updatedAt;

    this.addressId = data.addressId === undefined ? null : data.addressId;
    // CORREÇÃO FINAL: Mapeia o objeto 'address' do Prisma para uma nova instância de AddressDetailsDto
    this.address = data.address ? new AddressDetailsDto({
      ...data.address,
      latitude: isDecimal(data.address.latitude) ? data.address.latitude.toNumber() : data.address.latitude,
      longitude: isDecimal(data.address.longitude) ? data.address.longitude.toNumber() : data.address.longitude,
    }) : null; 

    this.couponId = data.couponId === undefined ? null : data.couponId; // NOVO
    this.couponCode = data.coupon?.code || null; // NOVO
    // Converte discountAmount de Decimal para number, se necessário
    let convertedDiscountAmount: number | null;
    if (data.discountAmount === null || data.discountAmount === undefined) {
      convertedDiscountAmount = null;
    } else if (isDecimal(data.discountAmount)) {
      convertedDiscountAmount = data.discountAmount.toNumber();
    } else {
      convertedDiscountAmount = data.discountAmount;
    }
    this.discountAmount = convertedDiscountAmount; // <<-- ADICIONADO

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
      this.serviceName = data.providerService.service.name;
      // Converte servicePrice de Decimal para number, se necessário
      let convertedServicePrice: number;
      if (isDecimal(data.providerService.service.price)) {
        convertedServicePrice = data.providerService.service.price.toNumber();
      } else {
        convertedServicePrice = data.providerService.service.price;
      }
      this.servicePrice = convertedServicePrice;
      this.serviceDurationMinutes = data.providerService.durationMinutes;
      this.providerServiceDescription = data.providerService.description;
    }
    this.scheduledDateTime = `${this.scheduledDate}T${this.scheduledTime}:00Z`;
  }
}