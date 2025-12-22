import {
  getSaoPauloDayRangeFromDateString,
  getSaoPauloDayRangeFromTimestamp,
} from './timezone';

describe('São Paulo timezone helpers', () => {
  it('keeps Sunday 23:00 (UTC-3) in the same day', () => {
    const sundayLateNight = Date.UTC(2025, 11, 8, 2, 0, 0); // 08 Dec 2025 02:00 UTC -> 07 Dec 2025 23:00 -03

    const range = getSaoPauloDayRangeFromTimestamp(sundayLateNight);
    expect(range.dayOfWeek).toBe(0); // Sunday
    expect(range.start.toISOString()).toBe('2025-12-07T03:00:00.000Z');
  });

  it('parses ISO date strings relative to São Paulo timezone', () => {
    const range = getSaoPauloDayRangeFromDateString('2025-12-07');
    expect(range.dayOfWeek).toBe(0);
    expect(range.start.toISOString()).toBe('2025-12-07T03:00:00.000Z');
    expect(range.end.toISOString()).toBe('2025-12-08T02:59:59.999Z');
  });
});
