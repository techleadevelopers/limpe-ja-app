// src/bookings/booking-time.utils.ts

/**
 * Calcula a data/hora exata em São Paulo considerando fuso horário e horário de verão.
 * Aceita scheduledTime como string (HH:mm) ou Date.
 */
export function calculateScheduledAtInSaoPaulo(
  dateValue: string | number | Date,
  timeHHmm?: string | Date | null,
): Date {
  const d = new Date(dateValue);
  
  // Normaliza o tempo usando a função formatScheduledTime que extrai HH:mm corretamente
  const finalTimeStr = formatScheduledTime(timeHHmm);

  const [hhRaw, mmRaw] = finalTimeStr
    .split(':')
    .map((n) => parseInt(n, 10));

  const hh = Number.isFinite(hhRaw) ? hhRaw : 0;
  const mm = Number.isFinite(mmRaw) ? mmRaw : 0;

  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const tz = 'America/Sao_Paulo';

  // Cria a base em UTC com as horas desejadas
  const t = Date.UTC(y, m, day, hh, mm, 0, 0);
  let guess = new Date(t);

  // Ajuste iterativo para encontrar o timestamp exato que resulta naquele horário em SP
  for (let i = 0; i < 2; i++) {
    const off = tzOffsetMinutes(guess, tz);
    const corrected = Date.UTC(y, m, day, hh, mm, 0, 0) - off * 60000;
    guess = new Date(corrected);
  }

  return guess;
}

/**
 * Retorna o offset em minutos de um fuso horário específico para uma data.
 */
function tzOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );

  return (asUtc - date.getTime()) / 60000;
}

export interface BookingScheduleInfo {
  scheduledDate: Date | string;
  scheduledTime?: string | Date | null;
  scheduledStart?: Date | string | null;
  startedAt?: Date | string | null;
  durationMinutes?: number | null;
}

/**
 * Calcula o fim esperado do serviço.
 */
export function calculateExpectedEnd(info: BookingScheduleInfo): Date {
  const base =
    info.startedAt instanceof Date
      ? info.startedAt
      : typeof info.startedAt === 'string'
        ? new Date(info.startedAt)
        : info.scheduledStart instanceof Date
          ? info.scheduledStart
          : typeof info.scheduledStart === 'string'
            ? new Date(info.scheduledStart)
            : calculateScheduledAtInSaoPaulo(info.scheduledDate, info.scheduledTime);

  const durationMinutes = Number.isFinite(info.durationMinutes ?? NaN)
    ? info.durationMinutes!
    : 60;

  return new Date(base.getTime() + durationMinutes * 60 * 1000);
}

/**
 * Formata o horário para HH:mm de forma segura para Date (UTC) ou String.
 * Isso resolve o problema de slots indisponíveis devido ao fuso do servidor.
 */
export function formatScheduledTime(
  value?: string | Date | number | null,
): string {
  if (!value) return '00:00';
  if (typeof value === 'number') {
    return formatScheduledTime(new Date(value));
  }
  
  if (value instanceof Date) {
    // Usamos getUTC para garantir que o horário persistido no banco (ex: 10:00)
    // seja extraído como 10:00, ignorando o fuso horário local do servidor Railway.
    const hh = value.getUTCHours().toString().padStart(2, '0');
    const mm = value.getUTCMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
  
  if (typeof value === 'string') {
    if (value.includes('T')) {
      // Se for uma string ISO, extrai a parte do tempo
      const timePart = value.split('T')[1];
      return timePart.slice(0, 5);
    }
    // Se for string simples "HH:mm:ss" ou "HH:mm", retorna os 5 primeiros caracteres
    return value.slice(0, 5);
  }
  
  return '00:00';
}

/**
 * Converte o horário para minutos totais desde o início do dia.
 */
export function scheduledTimeToMinutes(value?: string | Date | null): number {
  const hhmm = formatScheduledTime(value);
  const [hh, mm] = hhmm.split(':').map((n) => parseInt(n, 10) || 0);
  return (hh * 60) + mm;
}
