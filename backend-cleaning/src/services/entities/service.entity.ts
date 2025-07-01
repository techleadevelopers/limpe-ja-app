// src/services/entities/service.entity.ts
import { Service as PrismaService, Prisma } from '@prisma/client';

export class ServiceEntity implements PrismaService {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;

  createdAt: Date;
  updatedAt: Date;
  price: Prisma.Decimal;

  constructor(partial: Partial<ServiceEntity>) {
    Object.assign(this, partial);

    if (partial.price !== undefined && partial.price !== null) { // <-- Melhorar a verificação de nulo
        this.price = new Prisma.Decimal(partial.price);
    } else {
        this.price = new Prisma.Decimal(0); // <-- Valor padrão para garantir que seja Decimal
    }
    
    if (partial.createdAt) this.createdAt = new Date(partial.createdAt); // Converte para Date se for string
    else this.createdAt = new Date(); 

    if (partial.updatedAt) this.updatedAt = new Date(partial.updatedAt); // Converte para Date se for string
    else this.updatedAt = new Date();
  }
}