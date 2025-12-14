// utils/time.ts
// Helpers centralizados para lidar com data/hora no fuso de S\u00e3o Paulo (Brasil) e slots de agenda.

const BRAZIL_TZ = 'America/Sao_Paulo';

// Retorna a data/hora atual no fuso de S\u00e3o Paulo.
export const getNowInBrazil = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TZ }));
};

// Normaliza uma data para o fuso de S\u00e3o Paulo (mantendo a mesma representa\u00e7\u00e3o local).
export const toBrazilDate = (date: Date): Date => {
  return new Date(date.toLocaleString('en-US', { timeZone: BRAZIL_TZ }));
};

export const isSameDayInBrazil = (a: Date, b: Date): boolean => {
  const da = toBrazilDate(a);
  const db = toBrazilDate(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

// Constr\u00f3i um Date para um slot (HH:mm) em uma data base.
export const buildDateTimeForSlot = (date: Date, slot: string): Date => {
  const [h, m] = slot.split(':').map((n) => parseInt(n, 10));
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

// Verifica se um slot j\u00e1 passou, considerando o fuso de S\u00e3o Paulo e apenas quando a data \u00e9 hoje.
export const isPastSlotForDate = (date: Date, slot: string, now: Date = getNowInBrazil()): boolean => {
  const slotDate = buildDateTimeForSlot(date, slot);
  if (!isSameDayInBrazil(slotDate, now)) return false;
  return slotDate.getTime() < now.getTime();
};

// Retorna o in\u00edcio do dia (00:00) no fuso de S\u00e3o Paulo.
export const startOfDayBrazil = (date: Date): Date => {
  const d = toBrazilDate(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
