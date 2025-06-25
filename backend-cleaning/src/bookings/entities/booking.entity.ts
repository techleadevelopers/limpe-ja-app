// src/bookings/entities/booking.entity.ts
import { Booking as PrismaBooking, Client, Provider, ProviderService, Review, Prisma } from '@prisma/client';

// Esta classe serve como uma representação da entidade Booking
// conforme definida no Prisma, incluindo as relações.
// Ela é útil para tipagem e para garantir consistência entre o ORM e o código.
export class BookingEntity implements PrismaBooking {
  id: string;
  clientId: string;
  providerId: string;
  providerServiceId: string;
  scheduledDate: Date;
  scheduledTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'RESCHEDULED';
  totalPrice: Prisma.Decimal; // Tipo Prisma.Decimal para refletir o schema
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // ADICIONADO: Propriedade addressId
  addressId: string | null; // O tipo é string | null, conforme definido no schema.prisma (String?)

  // Relações opcionais para tipagem mais completa ao carregar com `include`
  client?: Client;
  provider?: Provider;
  providerService?: ProviderService;
  review?: Review | null;

  // Construtor para facilitar a criação de instâncias (opcional, mas útil)
  constructor(partial: Partial<BookingEntity>) {
    Object.assign(this, partial);
  }
}