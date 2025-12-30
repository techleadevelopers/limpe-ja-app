// Frontend contract for AppEvents emitted over sockets/stream
export interface AppEvent {
  id: string;
  userId: string;
  type: string;
  title?: string | null;
  message: string;
  targetUrl?: string | null;
  deepLink?: string | null;
  category?: string | null;
  actionButtons?: Record<string, unknown> | null;
  imageUrl?: string | null;
  dedupeKey?: string | null;
  payload?: Record<string, unknown> | null;
  ttlSeconds?: number | null;
  priority?: number | null;
  createdAt: string;
  readAt?: string | null;
  acknowledgedAt?: string | null;
}
