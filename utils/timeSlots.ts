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
  requiredDurationMin?: number | null,
  intervalMinutes: number = SLOT_INTERVAL_MINUTES,
): TimeSlot[] => {
  const dayOfWeekSelected = selectedDate.getDay(); // 0 (Dom) a 6 (Sáb)

  // Normalize occupied times to a Set for quick lookup
  const occupiedSet = new Set(occupiedTimesFromBackend || []);

  // Expand provider availability blocks into discrete start times for the selected day
  const startCandidates: string[] = [];
  const blocksForDay = providerConfiguredSlots.filter(
    (b) => b.dayOfWeek === dayOfWeekSelected && typeof b.startTime === 'string' && typeof b.endTime === 'string'
  );

  for (const block of blocksForDay) {
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    const startTotal = sh * 60 + sm;
    const endTotal = eh * 60 + em;

    // Generate candidate starts within [start, end)
    for (let t = startTotal; t + intervalMinutes <= endTotal; t += intervalMinutes) {
      const h = Math.floor(t / 60).toString().padStart(2, '0');
      const m = (t % 60).toString().padStart(2, '0');
      startCandidates.push(`${h}:${m}`);
    }
  }

  // Remove duplicates and sort
  const uniqueCandidates = Array.from(new Set(startCandidates)).sort();

  const now = new Date();

  const isWithinAnyBlock = (timeMinutes: number): boolean => {
    return blocksForDay.some((b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = eh * 60 + em;
      return timeMinutes >= startTotal && timeMinutes < endTotal;
    });
  };

  const hasContiguousWindow = (startMinutes: number): boolean => {
    if (!requiredDurationMin || requiredDurationMin <= 0) return true; // no extra constraint
    const steps = Math.ceil(requiredDurationMin / intervalMinutes);
    for (let i = 0; i < steps; i++) {
      const t = startMinutes + i * intervalMinutes;
      // Must stay within configured blocks
      if (!isWithinAnyBlock(t)) return false;
      const hh = Math.floor(t / 60).toString().padStart(2, '0');
      const mm = (t % 60).toString().padStart(2, '0');
      const key = `${hh}:${mm}`;
      // Cannot collide with a booked start
      if (occupiedSet.has(key)) return false;
    }
    return true;
  };

  const finalDisplaySlots: TimeSlot[] = uniqueCandidates.map((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(hours, minutes, 0, 0);

    const isPast = slotDateTime.getTime() < now.getTime();
    const startMinutes = hours * 60 + minutes;
    const isSlotOccupied = occupiedSet.has(time);
    const fitsWindow = hasContiguousWindow(startMinutes);

    return {
      time,
      isAvailable: !isPast && !isSlotOccupied && fitsWindow,
    };
  });

  return finalDisplaySlots;
};

