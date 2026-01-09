import { Availability as PrismaAvailability } from '@prisma/client';

export class AvailabilityEntity implements PrismaAvailability {
  id: string;
  providerId: string;
  dayOfWeek: number;
  // Ajuste de tipagem para compatibilidade com o novo Prisma
  startTime: string | any; 
  endTime: string | any;
  isAvailable: boolean;
  createdAt: Date; // O Prisma costuma exigir esses campos na interface
  updatedAt: Date;

  constructor(partial: Partial<AvailabilityEntity>) {
    Object.assign(this, partial);
    
    // Garantia de que, se vierem como Date do banco, 
    // a Entity possa tratar ou converter se necessário
    if (partial.startTime instanceof Date) {
      this.startTime = partial.startTime.toISOString();
    }
    if (partial.endTime instanceof Date) {
      this.endTime = partial.endTime.toISOString();
    }
  }
}