import { AuthResponse } from '../types/backend/auth';

export enum AuthEventType {
  SESSION_REFRESHED = 'SESSION_REFRESHED',
  SESSION_REVOKED = 'SESSION_REVOKED',
}

type AuthEventPayloads = {
  [AuthEventType.SESSION_REFRESHED]: AuthResponse;
  [AuthEventType.SESSION_REVOKED]: void;
};

const listeners: Map<AuthEventType, Set<(payload: any) => void>> = new Map();

export function onAuthEvent<K extends AuthEventType>(
  event: K,
  listener: (payload: AuthEventPayloads[K]) => void,
): () => void {
  const set = listeners.get(event) ?? new Set();
  set.add(listener as (payload: any) => void);
  listeners.set(event, set);
  return () => {
    set.delete(listener as (payload: any) => void);
    if (set.size === 0) {
      listeners.delete(event);
    }
  };
}

export function emitAuthEvent<K extends AuthEventType>(
  event: K,
  payload: AuthEventPayloads[K],
): void {
  const set = listeners.get(event);
  if (!set) return;
  for (const listener of Array.from(set)) {
    listener(payload);
  }
}
