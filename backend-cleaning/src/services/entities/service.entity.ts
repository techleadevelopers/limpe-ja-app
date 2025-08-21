// src/services/entities/service.entity.ts
import { Service as PrismaService, Prisma, PricingType } from '@prisma/client'; // ADICIONADO: PricingType

export class ServiceEntity implements PrismaService {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  price: Prisma.Decimal;
  defaultPricingType: PricingType | null; // ADICIONADO: Propriedade que faltava

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ServiceEntity>) {
    Object.assign(this, partial);

    if (partial.price !== undefined && partial.price !== null) {
        this.price = new Prisma.Decimal(partial.price);
    } else {
        this.price = new Prisma.Decimal(0);
    }

    // O Object.assign(this, partial) já deve lidar com defaultPricingType, createdAt e updatedAt
    // se eles estiverem presentes em 'partial'.
    // As verificações abaixo são redundantes se Object.assign for suficiente,
    // mas são mantidas para garantir a conversão para Date se o input for string.

    if (partial.createdAt && typeof partial.createdAt === 'string') {
      this.createdAt = new Date(partial.createdAt);
    } else if (!this.createdAt) { // Se não veio no partial ou não era string, e não foi inicializado
      this.createdAt = new Date();
    }

    if (partial.updatedAt && typeof partial.updatedAt === 'string') {
      this.updatedAt = new Date(partial.updatedAt);
    } else if (!this.updatedAt) { // Se não veio no partial ou não era string, e não foi inicializado
      this.updatedAt = new Date();
    }
  }
}