// src/availability/availability.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { GetAvailabilityDto } from './dto/get-availability.dto';
import { Availability, BookingStatus } from '@prisma/client';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getAvailability(providerId: string, query: GetAvailabilityDto): Promise<{ available: Availability[], occupiedTimes: string[] }> {
    const { date } = query;

    console.log(`[AvailabilityService] getAvailability chamado para providerId: ${providerId}, date: ${date}`); // LOG 1

    const providerExists = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!providerExists) {
      throw new NotFoundException(`Provedor com ID "${providerId}" não encontrado.`);
    }

    if (!date) {
        throw new BadRequestException("O parâmetro 'date' é obrigatório para buscar a disponibilidade.");
    }

    // <<<< CORREÇÃO CRÍTICA AQUI >>>>
    // Crie a data usando UTC para garantir que o dia da semana seja sempre o correto,
    // independentemente do fuso horário do servidor.
    const [year, month, day] = date.split('-').map(Number);
    // month - 1 porque os meses em JavaScript são de 0 a 11.
    const selectedDateObjUTC = new Date(Date.UTC(year, month - 1, day));
    // <<<< FIM DA CORREÇÃO CRÍTICA >>>>

    const actualDayOfWeek = selectedDateObjUTC.getUTCDay(); // <<<< Use getUTCDay() para obter o dia da semana em UTC (0=Dom, 1=Seg...)

    console.log(`[AvailabilityService] Data selecionada (UTC): ${selectedDateObjUTC.toISOString().split('T')[0]}, Dia da Semana Calculado (UTC): ${actualDayOfWeek}`); // LOG 2
    console.log(`[AvailabilityService] Dia da semana esperado (Para 10 de junho de 2025, deve ser 2 - Terça-feira): ${actualDayOfWeek}`); // LOG 2.1 (Para depuração, remova depois)

    const whereAvailability: any = {
        providerId: providerId,
        dayOfWeek: actualDayOfWeek, // <<<< Filtrando EXATAMENTE pelo dia da semana da data
    };

    console.log("[AvailabilityService] Condição WHERE para disponibilidade configurada:", whereAvailability); // LOG 3

    // 1. Buscar todos os slots de disponibilidade CONFIGURADOS para aquele provedor e dia da semana.
    const configuredAvailability = await this.prisma.availability.findMany({
      where: whereAvailability, // Usa a condição construída acima
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    console.log("[AvailabilityService] Resultado da consulta de disponibilidade configurada:", configuredAvailability); // LOG 4

    // 2. Buscar agendamentos CONFIRMADOS para o provedor na DATA ESPECÍFICA fornecida.
    let occupiedTimes: string[] = [];
    const bookingsOnDate = await this.prisma.booking.findMany({
        where: {
            providerId: providerId,
            // A data agendada no Prisma também é tratada como um ponto no tempo.
            // Para comparar apenas a data, podemos usar gte e lte do início ao fim do dia em UTC.
            scheduledDate: {
                gte: new Date(Date.UTC(year, month - 1, day, 0, 0, 0)), // Início do dia em UTC
                lte: new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)), // Fim do dia em UTC
            },
            status: {
                in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.IN_PROGRESS], // Include IN_PROGRESS
            },
        },
        select: {
            scheduledTime: true,
        },
    });
    occupiedTimes = bookingsOnDate.map(b => b.scheduledTime);

    console.log("[AvailabilityService] Horários ocupados por agendamentos:", occupiedTimes); // LOG 5

    return { available: configuredAvailability, occupiedTimes };
  }

  async updateAvailability(providerId: string, updateAvailabilityDtos: UpdateAvailabilityDto[]): Promise<Availability[]> {
    const providerExists = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!providerExists) {
      throw new NotFoundException(`Provedor com ID "${providerId}" não encontrado.`);
    }

    const updatedRecords: Availability[] = [];

    for (const dto of updateAvailabilityDtos) {
      const { id, dayOfWeek, startTime, endTime, isAvailable } = dto;

      if (id) {
        if (isAvailable === false) {
          try {
            await this.prisma.availability.delete({
              where: { id, providerId },
            });
          } catch (error) {
            if (error.code === 'P2025') {
              throw new NotFoundException(`Slot de disponibilidade com ID "${id}" não encontrado para o provedor "${providerId}".`);
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
              throw new NotFoundException(`Slot de disponibilidade com ID "${id}" não encontrado para o provedor "${providerId}".`);
            }
            throw error;
          }
        }
      } else {
        const existingSlot = await this.prisma.availability.findFirst({
          where: { providerId, dayOfWeek, startTime, endTime },
        });
        if (existingSlot) {
          throw new ConflictException(`Um slot de disponibilidade para ${dayOfWeek} das ${startTime} às ${endTime} já existe.`);
        }
        const newSlot = await this.prisma.availability.create({
          data: { providerId, dayOfWeek, startTime, endTime, isAvailable: true },
        });
        updatedRecords.push(newSlot);
      }
    }
    return updatedRecords;
  }

  async createAvailability(providerId: string, createDto: UpdateAvailabilityDto): Promise<Availability> {
    const providerExists = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!providerExists) {
      throw new NotFoundException(`Provedor com ID "${providerId}" não encontrado.`);
    }

    const { dayOfWeek, startTime, endTime } = createDto;

    const existingSlot = await this.prisma.availability.findFirst({
      where: { providerId, dayOfWeek, startTime, endTime },
    });

    if (existingSlot) {
      throw new ConflictException(`Um slot de disponibilidade para ${dayOfWeek} das ${startTime} às ${endTime} já existe para este provedor.`);
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

  async deleteAvailability(availabilityId: string, providerId: string): Promise<void> {
    try {
      await this.prisma.availability.delete({
        where: { id: availabilityId, providerId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Slot de disponibilidade com ID "${availabilityId}" não encontrado para o provedor "${providerId}".`);
      }
      throw error;
    }
  }
}