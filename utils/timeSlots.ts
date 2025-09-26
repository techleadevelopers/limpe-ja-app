// utils/timeSlots.ts
import { ProviderAvailability } from '../types/backend/providers';

interface TimeSlot {
    time: string;
    isAvailable: boolean;
}

/**
 * Gera uma lista de slots de tempo para um dia específico,
 * considerando a configuração de disponibilidade do provedor e horários já ocupados.
 *
 * @param selectedDate A data para a qual gerar os slots.
 * @param providerConfiguredSlots As configurações de disponibilidade do provedor.
 * @param occupiedTimesFromBackend Os horários já ocupados pelo provedor.
 * @returns Uma array de objetos TimeSlot indicando o horário e sua disponibilidade.
 */
export const generateDailySlots = (
    selectedDate: Date,
    providerConfiguredSlots: ProviderAvailability[],
    occupiedTimesFromBackend: string[]
): TimeSlot[] => {
    const dayOfWeekSelected = selectedDate.getDay(); // 0 para Domingo, 1 para Segunda, etc.

    const configuredStartTimesForSelectedDay = new Set(
        providerConfiguredSlots
            .filter(configSlot => configSlot.dayOfWeek === dayOfWeekSelected)
            .map(configSlot => configSlot.startTime)
    );

    const allDisplayableTimes: string[] = [];
    const startHour = 8; // Ex: 8:00 AM
    const endHour = 20;   // Ex: 8:00 PM (slots até 19:30)

    for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += 30) { // Slots de 30 em 30 minutos
            allDisplayableTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }

    const finalDisplaySlots: TimeSlot[] = allDisplayableTimes.map(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(hours, minutes, 0, 0);

        const isPast = slotDateTime.getTime() < new Date().getTime();
        const isConfiguredByProvider = configuredStartTimesForSelectedDay.has(time);
        const isSlotOccupied = occupiedTimesFromBackend.includes(time);

        return {
            time: time,
            isAvailable: isConfiguredByProvider && !isSlotOccupied && !isPast,
        };
    });

    return finalDisplaySlots;
};