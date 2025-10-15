// src/bookings/entities/booking.entity.ts
import {
  Booking as PrismaBooking,
  Client,
  Provider,
  ProviderService,
  Review,
  Prisma, // <-- Importe Prisma para o tipo Decimal
  BookingStatus // <-- Importe o enum BookingStatus COMPLETO
} from '@prisma/client';

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
  // CORREÇÃO AQUI: status deve ser do tipo BookingStatus COMPLETO do Prisma
  status: BookingStatus; // <-- AGORA É BookingStatus, não um subconjunto
  totalPrice: Prisma.Decimal; // Tipo Prisma.Decimal para refletir o schema
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Auditoria de início/fim (alinhado ao schema)
  startedAt: Date | null;
  completedAt: Date | null;
  startedByUserId: string | null;
  completedByUserId: string | null;

  // CORREÇÃO AQUI: Propriedade addressId deve ser string | null
  addressId: string | null; // O tipo é string | null, conforme definido no schema.prisma (String?)
  // ADICIONADO: Relação address também pode ser null
  address?: {
    id?: string; // Adicionado id como opcional para o construtor
    cep: string; street: string; number: string;
    complement: string | null; neighborhood: string; city: string; state: string;
    // CORREÇÃO: Adicionado latitude e longitude à tipagem do Address
    latitude: Prisma.Decimal;
    longitude: Prisma.Decimal;
  } | null;

  // CORREÇÃO: Adicionado subscriptionId e couponId
  subscriptionId: string | null;
  couponId: string | null;
  discountAmount: Prisma.Decimal | null; // <<-- ADICIONADO: Para corresponder a PrismaBooking

  // Relações opcionais para tipagem mais completa ao carregar com `include`
  client?: Client;
  provider?: Provider;
  providerService?: ProviderService;
  review?: Review | null;

  // Construtor para facilitar a criação de instâncias (opcional, mas útil)
  constructor(partial: Partial<BookingEntity>) {
    Object.assign(this, partial);

    // CORREÇÃO: Assegurar que totalPrice seja Prisma.Decimal
    if (partial.totalPrice !== undefined && partial.totalPrice !== null) {
      this.totalPrice = new Prisma.Decimal(partial.totalPrice);
    } else {
      this.totalPrice = new Prisma.Decimal(0); // Valor padrão
    }

    // ADICIONADO: Assegurar que discountAmount seja Prisma.Decimal
    if (partial.discountAmount !== undefined && partial.discountAmount !== null) {
      this.discountAmount = new Prisma.Decimal(partial.discountAmount);
    } else {
      this.discountAmount = new Prisma.Decimal(0); // Valor padrão
    }

    // CORREÇÃO: Garanta que as datas sejam objetos Date
    if (partial.createdAt && typeof partial.createdAt === 'string') {
      this.createdAt = new Date(partial.createdAt);
    } else if (partial.createdAt instanceof Date) {
      this.createdAt = partial.createdAt;
    }

    if (partial.updatedAt && typeof partial.updatedAt === 'string') {
      this.updatedAt = new Date(partial.updatedAt);
    } else if (partial.updatedAt instanceof Date) {
      this.updatedAt = partial.updatedAt;
    }

    if (partial.scheduledDate && typeof partial.scheduledDate === 'string') {
      this.scheduledDate = new Date(partial.scheduledDate);
    } else if (partial.scheduledDate instanceof Date) {
      this.scheduledDate = partial.scheduledDate;
    }


    // O status é atribuído diretamente, o TS agora deve aceitar o enum completo
    // Se partial.status for undefined, o tipo inferido será BookingStatus | undefined
    this.status = partial.status as BookingStatus; // Força o cast, assumindo que partial.status é válido ou será tratado.

    // Garanta que addressId e address sejam null se não forem fornecidos ou se o tipo do prisma for null
    this.addressId = partial.addressId === undefined ? null : partial.addressId;
    this.address = partial.address === undefined ? null : partial.address;

    // CORREÇÃO: Inicializar subscriptionId e couponId
    this.subscriptionId = partial.subscriptionId === undefined ? null : partial.subscriptionId;
    this.couponId = partial.couponId === undefined ? null : partial.couponId;

    // Auditoria: parse de datas e FKs
    this.startedAt = partial.startedAt ? new Date(partial.startedAt as any) : null;
    this.completedAt = partial.completedAt ? new Date(partial.completedAt as any) : null;
    this.startedByUserId = partial.startedByUserId === undefined ? null : (partial.startedByUserId as any);
    this.completedByUserId = partial.completedByUserId === undefined ? null : (partial.completedByUserId as any);
  }
}
