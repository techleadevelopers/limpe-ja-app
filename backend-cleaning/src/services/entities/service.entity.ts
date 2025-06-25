// src/services/entities/service.entity.ts
import { Service as PrismaService, Prisma } from '@prisma/client'; // <--- CORREÇÃO AQUI: Importar 'Prisma'

export class ServiceEntity implements PrismaService {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;

  // As propriedades de data e price são parte do modelo Service do Prisma
  createdAt: Date;
  updatedAt: Date;
  price: Prisma.Decimal; // <--- AGORA 'Prisma' DEVE SER ENCONTRADO

  constructor(partial: Partial<ServiceEntity>) {
    Object.assign(this, partial);
    // Para campos como price (Decimal) que podem vir como number e o Prisma precisa de Decimal
    if (partial.price !== undefined) {
        this.price = new Prisma.Decimal(partial.price); // <--- AGORA 'Prisma' DEVE SER ENCONTRADO
    }
    // Prisma preenche createdAt e updatedAt automaticamente, mas é bom tê-los para tipagem
    if (partial.createdAt) this.createdAt = partial.createdAt;
    else this.createdAt = new Date(); // Fallback se não for fornecido no partial

    if (partial.updatedAt) this.updatedAt = partial.updatedAt;
    else this.updatedAt = new Date(); // Fallback
  }
}