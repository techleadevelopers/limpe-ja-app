// utils/timeSlots.ts
import { ProviderAvailability } from '../types/backend/providers';

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

// Janela e intervalo padrão compartilhados (30min das 08:00 às 20:00)
export const SLOT_INTERVAL_MINUTES = 30 as const;
export const DEFAULT_DAILY_WINDOW = {
  startHour: 8,
  endHour: 20, // exclusivo; último slot visível é 19:30
} as const;

// Gera todos os horários possíveis conforme janela/intervalo
export const generateAllPossibleSlots = (
  startHour: number = DEFAULT_DAILY_WINDOW.startHour,
  endHour: number = DEFAULT_DAILY_WINDOW.endHour,
  intervalMinutes: number = SLOT_INTERVAL_MINUTES,
): string[] => {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
};

/**
 * Gera uma lista de slots de tempo para um dia específico,
 * considerando a configuração do provedor e horários já ocupados.
 */
export const generateDailySlots = (
  selectedDate: Date,
  providerConfiguredSlots: ProviderAvailability[],
  occupiedTimesFromBackend: string[],
): TimeSlot[] => {
  const dayOfWeekSelected = selectedDate.getDay(); // 0 (Dom) a 6 (Sáb)

  const configuredStartTimesForSelectedDay = new Set(
    providerConfiguredSlots
      .filter((configSlot) => configSlot.dayOfWeek === dayOfWeekSelected)
      .map((configSlot) => configSlot.startTime),
  );

  const allDisplayableTimes: string[] = generateAllPossibleSlots();

  const finalDisplaySlots: TimeSlot[] = allDisplayableTimes.map((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(hours, minutes, 0, 0);

    const isPast = slotDateTime.getTime() < new Date().getTime();
    const isConfiguredByProvider = configuredStartTimesForSelectedDay.has(time);
    const isSlotOccupied = occupiedTimesFromBackend.includes(time);

    return {
      time,
      isAvailable: isConfiguredByProvider && !isSlotOccupied && !isPast,
    };
  });

  return finalDisplaySlots;
};

