// src/bookings/dto/booking-details.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Booking, BookingStatus, Client, Provider, ProviderService, Service, User, Prisma, Address } from '@prisma/client';
import { IsString, IsNumber, IsDate, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { CreateAddressDto } from '../../common/dto/create-address.dto';

// Define um tipo auxiliar para a estrutura completa do Booking com suas relações
// que será recebida do Prisma para construir o DTO.
type BookingWithRelations = Booking & {
  client: Client & { user: User };
  provider: Provider & { user: User };
  providerService: ProviderService & { service: Service };
  address?: Address | null;
};

export class BookingDetailsDto {
  @ApiProperty({ description: 'ID do agendamento', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'ID do cliente', example: 'client-uuid' })
  @IsString()
  clientId: string; // Adicionado para garantir que esteja sempre no DTO

  @ApiProperty({ description: 'ID do provedor', example: 'provider-uuid' })
  @IsString()
  providerId: string; // Adicionado para garantir que esteja sempre no DTO

  @ApiProperty({ description: 'Nome completo do cliente', example: 'João da Silva' })
  @IsString()
  clientFullName: string;

  @ApiProperty({ description: 'Email do cliente', example: 'joao.silva@example.com' })
  @IsEmail()
  clientEmail: string;

  @ApiProperty({ description: 'Nome completo do provedor', example: 'Maria de Souza' })
  @IsString()
  providerFullName: string;

  @ApiProperty({ description: 'Email do provedor', example: 'maria.souza@example.com' })
  @IsEmail()
  providerEmail: string;

  @ApiProperty({ description: 'Nome do serviço agendado', example: 'Limpeza Padrão' })
  @IsString()
  serviceName: string;

  @ApiProperty({ description: 'Preço do serviço agendado', example: 150.00 })
  @IsNumber()
  servicePrice: number;

  @ApiProperty({ description: 'Duração estimada do serviço em minutos', example: 180 })
  @IsNumber()
  serviceDurationMinutes: number;

  @ApiPropertyOptional({ description: 'Descrição específica do serviço oferecido pelo provedor', example: 'Limpeza completa de 3h.' })
  @IsOptional()
  @IsString()
  providerServiceDescription?: string | null;

  @ApiProperty({ description: 'Data agendada para o serviço (ISO 8601)', example: '2025-06-15T00:00:00.000Z' })
  @IsDate()
  scheduledDate: Date;

  @ApiProperty({ description: 'Horário agendado para o serviço (HH:mm)', example: '10:00' })
  @IsString()
  scheduledTime: string;

  @ApiProperty({ enum: BookingStatus, description: 'Status atual do agendamento', example: BookingStatus.PENDING })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiProperty({ description: 'Preço total do agendamento', example: 150.00 })
  @IsNumber()
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Observações adicionais para o agendamento', example: 'Focar na limpeza da cozinha.' })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ description: 'Data de criação do agendamento', example: '2025-06-10T10:00:00.000Z' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do agendamento', example: '2025-06-10T10:00:00.000Z' })
  @IsDate()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => CreateAddressDto, description: 'Endereço onde o serviço será realizado' })
  @IsOptional()
  address?: CreateAddressDto | null;

  constructor(booking: BookingWithRelations) {
    this.id = booking.id;
    this.clientId = booking.clientId; // Popula o clientId
    this.providerId = booking.providerId; // <<<< LINHA QUE FALTAVA: POPULA O providerId >>>>
    this.clientFullName = booking.client.fullName;
    this.clientEmail = booking.client.user.email;
    this.providerFullName = booking.provider.fullName;
    this.providerEmail = booking.provider.user.email;
    this.serviceName = booking.providerService.service.name;
    this.servicePrice = booking.providerService.price.toNumber();
    this.serviceDurationMinutes = booking.providerService.durationMinutes;
    this.providerServiceDescription = booking.providerService.description;
    this.scheduledDate = booking.scheduledDate;
    this.scheduledTime = booking.scheduledTime;
    this.status = booking.status;
    this.totalPrice = booking.totalPrice.toNumber();
    this.notes = booking.notes;
    this.createdAt = booking.createdAt;
    this.updatedAt = booking.updatedAt;
    if (booking.address) {
      this.address = new CreateAddressDto();
      Object.assign(this.address, booking.address);
    } else {
      this.address = null;
    }
  }
}