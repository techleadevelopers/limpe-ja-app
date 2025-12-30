import type { AppEvent } from '../types/backend/events';

export function dedupeAppEvents(
  events: AppEvent[],
  seenKeys: Set<string>,
): AppEvent[] {
  const deduped: AppEvent[] = [];
  const seen = new Set(seenKeys);
  for (const event of events) {
    const key = event.dedupeKey ?? event.id;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(event);
  }
  return deduped;
}

export function mergeAppEvents(
  existing: AppEvent[],
  incoming: AppEvent[],
): AppEvent[] {
  const combined = [...existing, ...incoming].filter((event) => Boolean(event));
  combined.sort((a, b) => {
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return aTime - bTime;
  });

  const seen = new Set<string>();
  const merged: AppEvent[] = [];
  for (const event of combined) {
    const key = event.dedupeKey ?? event.id;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(event);
  }

  return merged;
}
