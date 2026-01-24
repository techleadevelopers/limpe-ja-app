// src/availability/availability.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Availability, BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { GetAvailabilityDto } from './dto/get-availability.dto';
import {
  getSaoPauloDayRangeFromDateString,
  getSaoPauloDayRangeFromTimestamp,
  SAO_PAULO_TIMEZONE_OFFSET_MS,
} from './timezone';
import {
  formatScheduledTime,
  scheduledTimeToMinutes,
} from '../bookings/booking-time.utils';
import { BLOCKED_BOOKING_STATUSES } from '../bookings/bookings.constants';

// Garante que os horários configurados sejam sempre "cheios" (ex.: 09:00, 10:00)
const assertFullHour = (label: string, time: string) => {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);

  if (!Number.isInteger(h) || !Number.isInteger(m) || m !== 0) {
    throw new BadRequestException(
      `${label} deve ser um horário redondo (ex: 09:00, 10:00, 14:00).`,
    );
  }
};

const DEFAULT_SLOT_HOLD_STRIKE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SLOT_HOLD_STRIKE_THRESHOLD = 2;

const parsePositiveNumber = (value: string | undefined, fallback: number) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
};

const SLOT_HOLD_STRIKE_WINDOW_MS = parsePositiveNumber(
  process.env.SLOT_HOLD_STRIKE_WINDOW_MS,
  DEFAULT_SLOT_HOLD_STRIKE_WINDOW_MS,
);
const SLOT_HOLD_STRIKE_THRESHOLD = Math.max(
  1,
  parsePositiveNumber(
    process.env.SLOT_HOLD_STRIKE_THRESHOLD,
    DEFAULT_SLOT_HOLD_STRIKE_THRESHOLD,
  ),
);

const CONFLICT_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.CONFIRMED,
  BookingStatus.STARTED,
  BookingStatus.FINISHED,
];

const TIME_ONLY_REGEX = /^\d{2}:\d{2}$/;

const normalizeSlotTime = (value?: string | null): string | null => {
  if (!value) return null;
  const [candidate] = value.split('-');
  const trimmed = candidate?.trim();
  if (!trimmed) return null;
  const formatted = formatScheduledTime(trimmed);
  return TIME_ONLY_REGEX.test(formatted) ? formatted : null;
};

interface SanitizedConfiguredSlot {
  [key: string]: any;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  // Converte HH:mm (ou Date) para minutos desde 00:00
  private toMinutes(time?: string | Date | null): number {
    return scheduledTimeToMinutes(time);
  }

  async getAvailability(
    providerId: string,
    query: GetAvailabilityDto,
  ): Promise<any> {
    const { date } = query;

    const providerExists = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!providerExists) {
      throw new NotFoundException(
        `Provedor com ID "${providerId}" não encontrado.`,
      );
    }

    if (!date) {
      throw new BadRequestException(
        "O parâmetro 'date' é obrigatório para buscar a disponibilidade.",
      );
    }

    const requestedDateKey = date.split('T')[0];
    const {
      start: rangeStart,
      end: rangeEnd,
      dayOfWeek: rawDayOfWeek,
    } = getSaoPauloDayRangeFromDateString(requestedDateKey);
    const actualDayOfWeek = Number(rawDayOfWeek);
    console.log(
      '[AvailabilityService] buscando disponibilidade',
      requestedDateKey,
      'dia da semana:',
      actualDayOfWeek,
      'Tipo:',
      typeof actualDayOfWeek,
    );

    // ✅ CORREÇÃO CRÍTICA: Usando queryRaw para forçar a conversão de Timestamp para String (HH:mm)
    // Isso evita o erro "Error converting field startTime" do Prisma
    const configuredAvailability: any[] = await this.prisma.$queryRaw`
      SELECT 
        id, 
        "providerId", 
        "dayOfWeek", 
        TRIM(TO_CHAR("startTime"::time, 'HH24:MI'))::text as "startTime",
        TRIM(TO_CHAR("endTime"::time, 'HH24:MI'))::text as "endTime",
        "isAvailable"
      FROM "Availability"
      WHERE "providerId" = ${providerId} 
      AND "dayOfWeek" = ${actualDayOfWeek}
      AND "isAvailable" = true
      ORDER BY "startTime" ASC
    `;
    const sanitizedAvailability = configuredAvailability
      .map((slot): SanitizedConfiguredSlot | null => {
        const startTime = normalizeSlotTime(slot.startTime);
        const endTime = normalizeSlotTime(slot.endTime);
        if (!startTime || !endTime) {
          console.warn(
            '[AvailabilityService] ignorando slot com horA!rio invA!lido',
            slot,
          );
          return null;
        }
        return {
          ...slot,
          startTime,
          endTime,
          isAvailable: Boolean(slot.isAvailable),
        };
      })
      .filter((slot): slot is SanitizedConfiguredSlot => Boolean(slot));

    console.log(
      '[AvailabilityService] normalizedAvailability',
      requestedDateKey,
      sanitizedAvailability.map(
        (slot) => `${slot.startTime}-${slot.endTime} (${slot.isAvailable})`,
      ),
    );

    // 2. Buscar agendamentos ocupados na data real (2026...)
    const bookingsOnDate = await this.prisma.booking.findMany({
      where: {
        providerId: providerId,
        status: {
          in: BLOCKED_BOOKING_STATUSES,
        },
        scheduledStart: {
          lt: rangeEnd,
        },
        scheduledEnd: {
          gt: rangeStart,
        },
      },
      select: {
        scheduledTime: true,
      },
    });

    const occupiedTimes: string[] = bookingsOnDate.map((b) => {
      return formatScheduledTime(b.scheduledTime);
    });

    // Retornamos o objeto que o calendário e o ProvidersService esperam
    return {
      requestedDate: requestedDateKey,
      available: sanitizedAvailability,
      occupiedTimes,
    };
  }

  async updateAvailability(
    providerId: string,
    updateAvailabilityDtos: UpdateAvailabilityDto[],
  ): Promise<Availability[]> {
    const providerExists = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!providerExists) {
      throw new NotFoundException(
        `Provedor com ID "${providerId}" não encontrado.`,
      );
    }

    const updatedRecords: Availability[] = [];
    const nowTimestamp = Date.now();
    const currentDayRange = getSaoPauloDayRangeFromTimestamp(nowTimestamp);
    const nowInTimeZone = new Date(nowTimestamp + SAO_PAULO_TIMEZONE_OFFSET_MS);
    const minutesNow =
      nowInTimeZone.getUTCHours() * 60 + nowInTimeZone.getUTCMinutes();
    const todayDow = currentDayRange.dayOfWeek;
    const nowStartDay = currentDayRange.start;

    const futureBookings = await this.prisma.booking.findMany({
      where: {
        providerId,
        status: {
          in: CONFLICT_BOOKING_STATUSES,
        },
        scheduledDate: { gte: nowStartDay },
      },
      select: {
        scheduledDate: true,
        scheduledTime: true,
      },
    });

    for (const dto of updateAvailabilityDtos) {
      const { id, dayOfWeek, startTime, endTime, isAvailable } = dto;

      if (startTime) {
        assertFullHour('startTime', startTime);
      }
      if (endTime) {
        assertFullHour('endTime', endTime);
      }
      const startMin = this.toMinutes(startTime);
      const endMin = this.toMinutes(endTime);
      if (startMin >= endMin) {
        throw new BadRequestException(
          `Intervalo inválido: ${startTime} deve ser menor que ${endTime}.`,
        );
      }

      if (dayOfWeek === todayDow && endMin <= minutesNow) {
        throw new BadRequestException(
          'Não é permitido alterar slot já passado.',
        );
      }

      const overlappingBooking = futureBookings.find((booking) => {
        const bookingDow = getSaoPauloDayRangeFromTimestamp(
          booking.scheduledDate.getTime(),
        ).dayOfWeek;
        const bookMin = this.toMinutes(booking.scheduledTime);
        return (
          bookingDow === dayOfWeek && bookMin < endMin && bookMin >= startMin
        );
      });

      if (overlappingBooking) {
        throw new ConflictException(
          'Conflito com agendamento existente neste horário.',
        );
      }

      const otherSlots = await this.prisma.availability.findMany({
        where: {
          providerId,
          dayOfWeek,
          id: id ? { not: id } : undefined,
        },
      });
      const overlapsSlot = otherSlots.some((slot) => {
        const s = this.toMinutes(slot.startTime);
        const e = this.toMinutes(slot.endTime);
        return startMin < e && endMin > s;
      });
      if (overlapsSlot) {
        throw new ConflictException(
          `Conflito com outro slot de disponibilidade no mesmo dia.`,
        );
      }

      if (id) {
        if (isAvailable === false) {
          try {
            await this.prisma.availability.delete({
              where: { id, providerId },
            });
          } catch (error) {
            if (error.code === 'P2025') {
              throw new NotFoundException(
                `Slot de disponibilidade não encontrado.`,
              );
            }
            throw error;
          }
        } else {
          try {
            const updated = await this.prisma.availability.update({
              where: { id, providerId },
              data: { dayOfWeek, startTime, endTime, isAvailable: true },
            });
            updatedRecords.push(updated);
          } catch (error) {
            if (error.code === 'P2025') {
              throw new NotFoundException(
                `Slot de disponibilidade não encontrado.`,
              );
            }
            throw error;
          }
        }
      } else {
        const existingSlot = await this.prisma.availability.findFirst({
          where: { providerId, dayOfWeek, startTime, endTime },
        });
        if (existingSlot) {
          throw new ConflictException(`Um slot de disponibilidade já existe.`);
        }
        const newSlot = await this.prisma.availability.create({
          data: {
            providerId,
            dayOfWeek,
            startTime,
            endTime,
            isAvailable: true,
          },
        });
        updatedRecords.push(newSlot);
      }
    }
    return updatedRecords;
  }

  async createAvailability(
    providerId: string,
    createDto: UpdateAvailabilityDto,
  ): Promise<Availability> {
    const providerExists = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!providerExists) {
      throw new NotFoundException(
        `Provedor com ID "${providerId}" não encontrado.`,
      );
    }

    const { dayOfWeek, startTime, endTime } = createDto;

    assertFullHour('startTime', startTime);
    assertFullHour('endTime', endTime);
    const startMin = this.toMinutes(startTime);
    const endMin = this.toMinutes(endTime);
    if (startMin >= endMin) {
      throw new BadRequestException(
        `Intervalo inválido: ${startTime} deve ser menor que ${endTime}.`,
      );
    }
    const nowTimestamp = Date.now();
    const dayRange = getSaoPauloDayRangeFromTimestamp(nowTimestamp);
    const nowInTimeZone = new Date(nowTimestamp + SAO_PAULO_TIMEZONE_OFFSET_MS);
    const minutesNow =
      nowInTimeZone.getUTCHours() * 60 + nowInTimeZone.getUTCMinutes();
    if (dayOfWeek === dayRange.dayOfWeek && endMin <= minutesNow) {
      throw new BadRequestException('Não é permitido criar slot já passado.');
    }

    const existingSlot = await this.prisma.availability.findFirst({
      where: { providerId, dayOfWeek, startTime, endTime },
    });

    if (existingSlot) {
      throw new ConflictException(
        `Um slot de disponibilidade para ${dayOfWeek} das ${startTime} às ${endTime} já existe.`,
      );
    }

    const futureBookings = await this.prisma.booking.findMany({
      where: {
        providerId,
        status: {
          in: CONFLICT_BOOKING_STATUSES,
        },
        scheduledDate: { gte: dayRange.start },
      },
      select: {
        scheduledDate: true,
        scheduledTime: true,
      },
    });
    const overlappingBooking = futureBookings.find((booking) => {
      const bookingDow = getSaoPauloDayRangeFromTimestamp(
        booking.scheduledDate.getTime(),
      ).dayOfWeek;
      const bookMin = this.toMinutes(booking.scheduledTime);
      return (
        bookingDow === dayOfWeek && bookMin < endMin && bookMin >= startMin
      );
    });
    if (overlappingBooking) {
      throw new ConflictException(
        'Conflito com agendamento existente neste horário.',
      );
    }

    return this.prisma.availability.create({
      data: {
        providerId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: true,
      },
    });
  }

  async canHoldSlot(
    providerId: string,
    clientId: string,
    start: Date,
    options?: { prisma?: Prisma.TransactionClient },
  ): Promise<void> {
    const db = options?.prisma ?? this.prisma;
    const slotStart = start instanceof Date ? start : new Date(start);
    if (Number.isNaN(slotStart.getTime())) {
      throw new BadRequestException('Horário inválido.');
    }

    const windowStart = new Date(Date.now() - SLOT_HOLD_STRIKE_WINDOW_MS);
    const strikeCount = await db.slotHoldStrike.count({
      where: {
        clientId,
        providerId,
        start: slotStart,
        createdAt: { gte: windowStart },
      },
    });

    if (strikeCount >= SLOT_HOLD_STRIKE_THRESHOLD) {
      throw new BadRequestException('Cancelamentos excessivos para este slot.');
    }
  }

  async deleteAvailability(
    availabilityId: string,
    providerId: string,
  ): Promise<void> {
    try {
      await this.prisma.availability.delete({
        where: { id: availabilityId, providerId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Slot não encontrado.`);
      }
      throw error;
    }
  }
}
