import { Availability as PrismaAvailability } from '@prisma/client';

export class AvailabilityEntity implements PrismaAvailability {
  id: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;

  constructor(partial: Partial<AvailabilityEntity>) {
    Object.assign(this, partial);
  }
}