import { useCallback, useMemo, useState } from 'react';
import {
  getMyProviderAvailability,
  updateMyProviderAvailability,
} from '../services/providerService';
import {
  DayAvailability,
  ProviderAvailability,
  UpdateAvailabilityData,
} from '../types/backend/providers';
import { getNowInBrazil, isPastSlotForDate, startOfDayBrazil } from '../utils/time';
import { useAuth } from './useAuth';

type PresetKey = 'morning' | 'afternoon' | 'evening' | 'fullday';

interface UseProviderAvailabilityOptions {
  preset?: PresetKey;
  getBookedSlotsForDay?: (dayOfWeek: number) => string[];
}

export const ALL_POSSIBLE_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 4; h <= 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 19 && m > 0) continue;
      const hh = h < 10 ? `0${h}` : `${h}`;
      const mm = m < 10 ? `0${m}` : `${m}`;
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
})();

const applyPresetSlots = (preset: PresetKey): string[] => {
  if (preset === 'morning') return generateTimeSlots(8, 12, 30);
  if (preset === 'afternoon') return generateTimeSlots(13, 17, 30);
  if (preset === 'evening') return generateTimeSlots(18, 21, 30);
  return generateTimeSlots(8, 18, 30);
};

const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number = 30): string[] => {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      if (h === endHour && m > 0) continue;
      const hour = h < 10 ? `0${h}` : `${h}`;
      const minute = m < 10 ? `0${m}` : `${m}`;
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
};

const convertSlotsToBlocks = (slots: string[]) => {
  if (slots.length === 0) return [];
  const sortedSlots = [...slots].sort();
  const blocks: { startTime: string; endTime: string }[] = [];
  let currentBlockStart = sortedSlots[0];
  let currentBlockEnd = sortedSlots[0];
  for (let i = 0; i < sortedSlots.length; i++) {
    const currentSlot = sortedSlots[i];
    const [currentHour, currentMinute] = currentSlot.split(':').map(Number);
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    if (i === sortedSlots.length - 1) {
      const [endHour, endMinute] = currentBlockEnd.split(':').map(Number);
      const finalEndTotalMinutes = endHour * 60 + endMinute + 30;
      const finalEndHour = Math.floor(finalEndTotalMinutes / 60);
      const finalEndMinute = finalEndTotalMinutes % 60;
      blocks.push({
        startTime: currentBlockStart,
        endTime: `${finalEndHour < 10 ? '0' : ''}${finalEndHour}:${finalEndMinute < 10 ? '0' : ''}${finalEndMinute}`,
      });
    } else {
      const nextSlot = sortedSlots[i + 1];
      const [nextHour, nextMinute] = nextSlot.split(':').map(Number);
      const nextTotalMinutes = nextHour * 60 + nextMinute;
      if (nextTotalMinutes === currentTotalMinutes + 30) {
        currentBlockEnd = currentSlot;
      } else {
        const [endHour, endMinute] = currentBlockEnd.split(':').map(Number);
        const finalEndTotalMinutes = endHour * 60 + endMinute + 30;
        const finalEndHour = Math.floor(finalEndTotalMinutes / 60);
        const finalEndMinute = finalEndTotalMinutes % 60;
        blocks.push({
          startTime: currentBlockStart,
          endTime: `${finalEndHour < 10 ? '0' : ''}${finalEndHour}:${finalEndMinute < 10 ? '0' : ''}${finalEndMinute}`,
        });
        currentBlockStart = nextSlot;
        currentBlockEnd = nextSlot;
      }
    }
  }
  return blocks;
};

const getDateForDayOfWeek = (dow: number): Date => {
  const base = getNowInBrazil();
  const diffRaw = dow - base.getDay();
  const diff = ((diffRaw % 7) + 7) % 7;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + diff);
};

export function useProviderAvailability(options?: UseProviderAvailabilityOptions) {
  const { user } = useAuth();
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<DayAvailability[]>([]);

  const ensureTermsAccepted = useCallback(() => {
    const accepted =
      (user as any)?.termsAcceptedAt ||
      (user as any)?.providerDetails?.termsAcceptedAt;
    if (!accepted) {
      throw new Error('Aceite os termos para gerenciar disponibilidade.');
    }
  }, [user]);

  const getBookedSlotsForDay = options?.getBookedSlotsForDay || (() => []);

  const loadAvailability = useCallback(async () => {
    setIsLoadingAvailability(true);
    try {
      const today = getNowInBrazil();
      const currentDate = today.toISOString().split('T')[0];
      const { available: providerAvailabilities } = await getMyProviderAvailability(currentDate);

      const initialWeekly: DayAvailability[] = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isEnabled: false,
        selectedSlots: [],
        originalSlots: [],
      }));

      providerAvailabilities.forEach((avail: ProviderAvailability) => {
        const dayIndex = initialWeekly.findIndex(d => d.dayOfWeek === avail.dayOfWeek);
        if (dayIndex !== -1) {
          const startMinutes = parseInt(avail.startTime.split(':')[0]) * 60 + parseInt(avail.startTime.split(':')[1]);
          const endMinutes = parseInt(avail.endTime.split(':')[0]) * 60 + parseInt(avail.endTime.split(':')[1]);
          const currentSlots: string[] = [];
          for (let time = startMinutes; time < endMinutes; time += 30) {
            const hour = Math.floor(time / 60);
            const minute = time % 60;
            currentSlots.push(`${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute}`);
          }
          initialWeekly[dayIndex] = {
            ...initialWeekly[dayIndex],
            isEnabled: true,
            selectedSlots: currentSlots,
            originalSlots: currentSlots,
            id: avail.id,
          };
        }
      });

      setWeeklyAvailability(initialWeekly);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, []);

  const handleApplyPreset = useCallback((dayOfWeek: number, preset: PresetKey) => {
    setWeeklyAvailability(prev =>
      prev.map(d => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const newSlots = applyPresetSlots(preset);
        const targetDate = getDateForDayOfWeek(dayOfWeek);
        const filtered = newSlots.filter(s => !isPastSlotForDate(targetDate, s));
        return { ...d, isEnabled: true, selectedSlots: filtered };
      }),
    );
  }, []);

  const handleResetDayToOriginal = useCallback((dayOfWeek: number) => {
    setWeeklyAvailability(prev =>
      prev.map(d => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const enabled = (d.originalSlots || []).length > 0;
        return { ...d, isEnabled: enabled, selectedSlots: d.originalSlots || [] };
      }),
    );
  }, []);

  const handleToggleDay = useCallback((dayOfWeek: number, isEnabled: boolean) => {
    setWeeklyAvailability(prev => prev.map(d => (d.dayOfWeek === dayOfWeek ? { ...d, isEnabled } : d)));
  }, []);

  const handleToggleSlot = useCallback((dayOfWeek: number, slot: string) => {
    setWeeklyAvailability(prev =>
      prev.map(day => {
        if (day.dayOfWeek === dayOfWeek) {
          const targetDate = getDateForDayOfWeek(dayOfWeek);
          if (isPastSlotForDate(targetDate, slot)) return day;
          const newSlots = day.selectedSlots.includes(slot)
            ? day.selectedSlots.filter(s => s !== slot)
            : [...day.selectedSlots, slot].sort();
          return { ...day, selectedSlots: newSlots };
        }
        return day;
      }),
    );
  }, []);

  const handleSelectAllSlots = useCallback((dayOfWeek: number) => {
    const targetDate = getDateForDayOfWeek(dayOfWeek);
    const todayStart = startOfDayBrazil(getNowInBrazil());
    const isPastDay = startOfDayBrazil(targetDate).getTime() < todayStart.getTime();
    const filtered = isPastDay
      ? []
      : ALL_POSSIBLE_SLOTS.filter(slot => !isPastSlotForDate(targetDate, slot));
    setWeeklyAvailability(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, selectedSlots: filtered } : day)),
    );
  }, []);

  const handleClearSlots = useCallback((dayOfWeek: number) => {
    setWeeklyAvailability(prev => prev.map(d => (d.dayOfWeek === dayOfWeek ? { ...d, selectedSlots: [] } : d)));
  }, []);

  const handleCopyToTargets = useCallback(
    (from: number, targets: number[]) => {
      const source = weeklyAvailability.find(d => d.dayOfWeek === from);
      if (!source) return;
      const sourceSlots = source.selectedSlots || [];
      setWeeklyAvailability(prev =>
        prev.map(d => {
          if (!targets.includes(d.dayOfWeek) || d.dayOfWeek === from) return d;
          const targetDate = getDateForDayOfWeek(d.dayOfWeek);
          if (startOfDayBrazil(targetDate).getTime() < startOfDayBrazil(getNowInBrazil()).getTime()) return d;
          const booked = getBookedSlotsForDay(d.dayOfWeek);
          const filtered = sourceSlots.filter(s => !booked.includes(s) && !isPastSlotForDate(targetDate, s));
          return { ...d, isEnabled: filtered.length > 0, selectedSlots: filtered };
        }),
      );
    },
    [weeklyAvailability, getBookedSlotsForDay],
  );

  const handleSaveAvailability = useCallback(
    async (specificDateOverrides: { date: string; type: 'blocked' | 'custom'; selectedSlots?: string[] }[]) => {
      ensureTermsAccepted();
      setIsSavingAvailability(true);
      try {
        const allAvailabilityUpdates: UpdateAvailabilityData[] = [];
        const todayStart = startOfDayBrazil(getNowInBrazil());

        for (const day of weeklyAvailability) {
          const targetDate = getDateForDayOfWeek(day.dayOfWeek);
          if (startOfDayBrazil(targetDate).getTime() < todayStart.getTime()) continue;
          const validSlots = day.selectedSlots.filter(slot => !isPastSlotForDate(targetDate, slot));
          const newBlocks = convertSlotsToBlocks(validSlots);
          if (day.isEnabled && newBlocks.length > 0) {
            newBlocks.forEach(block => {
              allAvailabilityUpdates.push({
                dayOfWeek: day.dayOfWeek,
                startTime: block.startTime,
                endTime: block.endTime,
                isAvailable: true,
                id: day.id,
              });
            });
          } else {
            if (day.id) {
              allAvailabilityUpdates.push({
                dayOfWeek: day.dayOfWeek,
                startTime: '',
                endTime: '',
                isAvailable: false,
                id: day.id,
              });
            }
          }
        }

        for (const override of specificDateOverrides) {
          if (override.type === 'blocked') {
            allAvailabilityUpdates.push({
              date: override.date,
              isAvailable: false,
            } as any);
          } else if (override.type === 'custom' && override.selectedSlots) {
            const customBlocks = convertSlotsToBlocks(override.selectedSlots);
            customBlocks.forEach(block => {
              allAvailabilityUpdates.push({
                date: override.date,
                startTime: block.startTime,
                endTime: block.endTime,
                isAvailable: true,
              } as any);
            });
          }
        }

        await updateMyProviderAvailability(allAvailabilityUpdates);
      } finally {
        setIsSavingAvailability(false);
      }
    },
    [weeklyAvailability],
  );

  const state = useMemo(
    () => ({
      weeklyAvailability,
      isLoadingAvailability,
      isSavingAvailability,
    }),
    [weeklyAvailability, isLoadingAvailability, isSavingAvailability],
  );

  const actions = {
    loadAvailability,
    applyPreset: handleApplyPreset,
    resetDay: handleResetDayToOriginal,
    toggleDay: handleToggleDay,
    toggleSlot: handleToggleSlot,
    selectAllSlots: handleSelectAllSlots,
    clearSlots: handleClearSlots,
    copyToTargets: handleCopyToTargets,
    saveAvailability: handleSaveAvailability,
    setWeeklyAvailability,
  };

  return { ...state, ...actions };
}
