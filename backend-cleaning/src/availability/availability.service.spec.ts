import { ConflictException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AvailabilityService', () => {
  it('throws a ConflictException when a slot overlaps an existing booking', async () => {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1);
    const dayOfWeek = scheduledDate.getDay();

    const prismaMock = {
      provider: {
        findUnique: jest.fn().mockResolvedValue({ id: 'provider-1' }),
      },
      availability: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue({
          scheduledDate,
          scheduledTime: '10:00',
        }),
      },
    } as unknown as PrismaService;

    const service = new AvailabilityService(prismaMock);

    await expect(
      service.updateAvailability('provider-1', [
        {
          dayOfWeek,
          startTime: '09:00',
          endTime: '11:00',
          isAvailable: true,
        },
      ]),
    ).rejects.toThrow(ConflictException);
  });
});
