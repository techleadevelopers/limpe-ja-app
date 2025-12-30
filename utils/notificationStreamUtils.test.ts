import { dedupeAppEvents, mergeAppEvents } from './notificationStreamUtils';
import type { AppEvent } from '../types/backend/events';

describe('dedupeAppEvents', () => {
  it('filters events that share the same dedupeKey', () => {
    const seen = new Set<string>();
    const events: AppEvent[] = [
      {
        id: '1',
        userId: 'u',
        type: 'booking',
        message: 'first',
        createdAt: '2025-01-01T00:00:00.000Z',
        dedupeKey: 'booking:1',
      },
      {
        id: '2',
        userId: 'u',
        type: 'booking',
        message: 'second',
        createdAt: '2025-01-01T00:01:00.000Z',
        dedupeKey: 'booking:1',
      },
      {
        id: '3',
        userId: 'u',
        type: 'booking',
        message: 'third',
        createdAt: '2025-01-01T00:02:00.000Z',
      },
    ];

    const deduped = dedupeAppEvents(events, seen);

    expect(deduped.map((event) => event.id)).toEqual(['1', '3']);
    expect(seen.size).toBe(0);
  });

  it('falls back to event id when dedupeKey is absent', () => {
    const seen = new Set<string>();
    const events: AppEvent[] = [
      {
        id: 'alpha',
        userId: 'u',
        type: 'system',
        message: 'alpha',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'alpha',
        userId: 'u',
        type: 'system',
        message: 'alpha repeat',
        createdAt: '2025-01-01T00:00:30.000Z',
      },
    ];

    const deduped = dedupeAppEvents(events, seen);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe('alpha');
    expect(seen.size).toBe(0);
  });

  it('skips events whose keys were already known without modifying the original set', () => {
    const seen = new Set<string>(['booking:skip']);
    const events: AppEvent[] = [
      {
        id: 'skip',
        userId: 'u',
        type: 'system',
        message: 'skip',
        createdAt: '2025-01-01T00:00:00.000Z',
        dedupeKey: 'booking:skip',
      },
      {
        id: 'new',
        userId: 'u',
        type: 'system',
        message: 'new',
        createdAt: '2025-01-01T00:01:00.000Z',
        dedupeKey: 'booking:new',
      },
    ];

    const deduped = dedupeAppEvents(events, seen);

    expect(deduped.map((event) => event.id)).toEqual(['new']);
    expect(seen.has('booking:skip')).toBe(true);
    expect(seen.has('booking:new')).toBe(false);
  });
});

describe('mergeAppEvents', () => {
  it('orders by createdAt and de-duplicates by dedupeKey', () => {
    const existing: AppEvent[] = [
      {
        id: 'existing',
        userId: 'u',
        type: 'system',
        message: 'Existing',
        createdAt: '2025-01-01T00:01:30.000Z',
        dedupeKey: 'booking:1',
      },
    ];
    const incoming: AppEvent[] = [
      {
        id: 'incoming-early',
        userId: 'u',
        type: 'system',
        message: 'Incoming early',
        createdAt: '2025-01-01T00:00:30.000Z',
        dedupeKey: 'booking:2',
      },
      {
        id: 'incoming-dupe',
        userId: 'u',
        type: 'system',
        message: 'Incoming duplicate',
        createdAt: '2025-01-01T00:02:00.000Z',
        dedupeKey: 'booking:1',
      },
    ];

    const merged = mergeAppEvents(existing, incoming);

    expect(merged.map((event) => event.id)).toEqual(['incoming-early', 'existing']);
    expect(merged.some((event) => event.id === 'incoming-dupe')).toBe(false);
  });

  it('keeps new events even if they have earlier timestamps', () => {
    const existing: AppEvent[] = [
      {
        id: 'later',
        userId: 'u',
        type: 'system',
        message: 'Later entry',
        createdAt: '2025-01-01T01:00:00.000Z',
        dedupeKey: 'later-key',
      },
    ];
    const incoming: AppEvent[] = [
      {
        id: 'earlier',
        userId: 'u',
        type: 'system',
        message: 'Earlier entry',
        createdAt: '2025-01-01T00:30:00.000Z',
        dedupeKey: 'earlier-key',
      },
    ];

    const merged = mergeAppEvents(existing, incoming);

    expect(merged.map((event) => event.id)).toEqual(['earlier', 'later']);
  });
});
