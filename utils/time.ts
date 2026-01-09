// utils/time.ts
// Helpers centralizados para lidar com data/hora no fuso de S\u00e3o Paulo (Brasil) e slots de agenda.

const BRAZIL_TZ_OFFSET_MINUTES = 180;
const toBrazilTimestamp = (date: Date) => {
  const diffMinutes = BRAZIL_TZ_OFFSET_MINUTES - date.getTimezoneOffset();
  return date.getTime() + diffMinutes * 60_000;
};

// Retorna a data/hora atual no fuso de São Paulo.
export const getNowInBrazil = (): Date => {
  return new Date(toBrazilTimestamp(new Date()));
};

// Normaliza uma data para o fuso de São Paulo (mantendo a mesma representação local).
export const toBrazilDate = (date: Date): Date => {
  return new Date(toBrazilTimestamp(date));
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

/**
 * Formata uma data para a chave YYYY-MM-DD baseada no fuso de São Paulo.
 */
export const formatBrazilDateKey = (date: Date): string => {
  const brazilDate = toBrazilDate(date);
  const year = brazilDate.getFullYear();
  const month = String(brazilDate.getMonth() + 1).padStart(2, '0');
  const day = String(brazilDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseBrazilDateKey = (dateKey: string) => {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  if (!yearStr || !monthStr || !dayStr) {
    return null;
  }

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  return { year, month, day };
};

const buildBrazilStartOfDayTimestamp = (year: number, month: number, day: number) =>
  Date.UTC(year, month - 1, day) + BRAZIL_TZ_OFFSET_MINUTES * 60_000;

export const getBrazilDayOfWeekFromKey = (dateKey: string): number | null => {
  const components = parseBrazilDateKey(dateKey);
  if (!components) {
    return null;
  }
  const timestamp = buildBrazilStartOfDayTimestamp(components.year, components.month, components.day);
  return new Date(timestamp).getUTCDay();
};

export const buildBrazilDateFromKey = (dateKey: string): Date | null => {
  const components = parseBrazilDateKey(dateKey);
  if (!components) {
    return null;
  }
  const timestamp = buildBrazilStartOfDayTimestamp(components.year, components.month, components.day);
  return new Date(timestamp);
};

const SLOT_TIME_REGEX = /(\d{1,2}):(\d{2})/;

export const normalizeSlotLabel = (value?: string | null): string => {
  if (!value) {
    return '00:00';
  }

  const fragments = value.split(/[\sT]+/).filter(Boolean);
  const candidate = fragments.length ? fragments[fragments.length - 1] : value;
  const primary = candidate.split('-')[0];
  const match = (primary && primary.match(SLOT_TIME_REGEX)) || value.match(SLOT_TIME_REGEX);
  if (!match) {
    return '00:00';
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const safeHour = Number.isFinite(hour) ? Math.max(0, Math.min(23, hour)) : 0;
  const safeMinute = Number.isFinite(minute) ? Math.max(0, Math.min(59, minute)) : 0;
  return `${String(safeHour).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')}`;
};

export const ensureValidSlotISO = (iso: string | undefined, date: Date, slotTime?: string): string => {
  if (iso) {
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  const normalizedTime = normalizeSlotLabel(slotTime);
  return buildDateTimeForSlot(date, normalizedTime).toISOString();
};
