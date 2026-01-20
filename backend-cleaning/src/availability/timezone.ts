export const SAO_PAULO_TIMEZONE_OFFSET_MINUTES = -180;
export const SAO_PAULO_TIMEZONE_OFFSET_MS =
  SAO_PAULO_TIMEZONE_OFFSET_MINUTES * 60_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface SaoPauloDayRange {
  start: Date;
  end: Date;
  dayOfWeek: number;
}

function buildDayRange(
  year: number,
  month: number,
  day: number,
): SaoPauloDayRange {
  const startUtc = Date.UTC(year, month, day) - SAO_PAULO_TIMEZONE_OFFSET_MS;
  const start = new Date(startUtc);
  return {
    start,
    end: new Date(startUtc + MS_PER_DAY - 1),
    dayOfWeek: start.getUTCDay(),
  };
}

function parseIsoDate(date: string) {
  const [yearStr, monthStr, dayStr] = date.split('-');
  if (!yearStr || !monthStr || !dayStr) {
    throw new Error(`Invalid date sent to timezone helper: "${date}"`);
  }
  return {
    year: Number(yearStr),
    month: Number(monthStr) - 1,
    day: Number(dayStr),
  };
}

function getSaoPauloLocalDateComponents(timestamp: number) {
  const local = new Date(timestamp + SAO_PAULO_TIMEZONE_OFFSET_MS);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
  };
}

export function getSaoPauloDayRangeFromDateString(
  date: string,
): SaoPauloDayRange {
  const { year, month, day } = parseIsoDate(date);
  return buildDayRange(year, month, day);
}

export function getSaoPauloDayRangeFromTimestamp(
  timestamp: number,
): SaoPauloDayRange {
  const components = getSaoPauloLocalDateComponents(timestamp);
  return buildDayRange(components.year, components.month, components.day);
}
