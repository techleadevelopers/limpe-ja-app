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
  // >>> CORREÇÃO AQUI: scheduledDate pode ser Date ou null vindo do Prisma,
  // mesmo que o schema defina como Date em alguns casos (se não for explicitamente non-nullable).
  // A tipagem reflete o que pode vir na prática.
  scheduledDate: Date | null;
};

export class BookingDetailsDto {
  @ApiProperty({ description: 'ID do agendamento', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'ID do cliente', example: 'client-uuid' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'ID do provedor', example: 'provider-uuid' })
  @IsString()
  providerId: string;

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

  @ApiProperty({ description: 'Data e hora agendadas para o serviço (ISO 8601)', example: '2025-06-15T10:00:00.000Z' })
  @IsDate()
  scheduledDateTime: Date; // NOVO CAMPO: Contém data e hora combinadas

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
    this.clientId = booking.clientId;
    this.providerId = booking.providerId;
    this.clientFullName = booking.client.fullName;
    this.clientEmail = booking.client.user.email;
    this.providerFullName = booking.provider.fullName;
    this.providerEmail = booking.provider.user.email;
    this.serviceName = booking.providerService.service.name;
    this.servicePrice = booking.providerService.price.toNumber();
    this.serviceDurationMinutes = booking.providerService.durationMinutes;
    this.providerServiceDescription = booking.providerService.description;
    
    // ***** INÍCIO DOS LOGS DEFENSIVOS E COMBINAÇÃO *****
    console.log("[BookingDetailsDto - DEBUG] booking.scheduledDate:", booking.scheduledDate, " (Tipo:", typeof booking.scheduledDate, ")");
    console.log("[BookingDetailsDto - DEBUG] booking.scheduledTime:", booking.scheduledTime, " (Tipo:", typeof booking.scheduledTime, ")");

    let datePart: string;
    // Verifica se scheduledDate é uma instância de Date E se é uma data válida.
    // Isso cobre casos de null/undefined e Date("Invalid Date")
    if (booking.scheduledDate instanceof Date && !isNaN(booking.scheduledDate.getTime())) {
        datePart = booking.scheduledDate.toISOString().split('T')[0];
    } else {
        // Loga o valor problemático e usa um fallback seguro.
        console.error("[BookingDetailsDto - ERROR] booking.scheduledDate inválido, nulo/indefinido ou não é um objeto Date válido. Valor recebido:", booking.scheduledDate);
        datePart = '1970-01-01'; // Fallback para garantir uma string de data
    }

    const timePart = booking.scheduledTime || '00:00'; // Garante que timePart não seja undefined ou null
    
    const combinedDateTimeString = `${datePart}T${timePart}:00`;
    console.log("[BookingDetailsDto - DEBUG] String combinada para Date:", combinedDateTimeString);

    try {
        this.scheduledDateTime = new Date(combinedDateTimeString);
        if (isNaN(this.scheduledDateTime.getTime())) {
            console.error("[BookingDetailsDto - ERROR] new Date() resultou em data inválida para:", combinedDateTimeString);
            this.scheduledDateTime = new Date(); // Fallback para data atual se a combinação for inválida
        }
        console.log("[BookingDetailsDto - DEBUG] scheduledDateTime FINAL (combinado):", this.scheduledDateTime.toISOString());
    } catch (e) {
        console.error("[BookingDetailsDto - ERROR] Erro ao criar Date a partir da string combinada:", combinedDateTimeString, e);
        this.scheduledDateTime = new Date(); // Fallback em caso de exceção
    }
    // ***** FIM DOS LOGS DEFENSIVOS E COMBINAÇÃO *****

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
