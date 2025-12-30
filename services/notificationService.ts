import { api } from './api';
import type { AppEvent } from '../types/backend/events';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string | null; // optional for compatibility with legacy components
  createdAt: string;
  deeplink?: string | null;
  navigateTo?: string | null; // optional for compatibility with legacy components
  // optional type to support provider icon mapping without changing UI
  type?: string;
  meta?: Record<string, unknown>;
  dedupeKey?: string | null;
  payload?: Record<string, unknown> | null;
  ttlSeconds?: number | null;
  category?: string | null;
  imageUrl?: string | null;
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const res = await api.get('/notifications/me');
  const raw = Array.isArray(res.data) ? res.data : [];
  return raw.map(toAppNotification);
}

// Alias to keep legacy imports working (provider screen expects getNotifications)
export { getMyNotifications as getNotifications };

// Normalizer to map various backend shapes into AppEvent + AppNotification
export const toAppEvent = (raw: any): AppEvent => {
  const normalizedPayload =
    raw?.payload ??
    raw?.meta ??
    raw?.data ??
    raw?.appEvent ??
    (raw?.actionButtons as Record<string, unknown>) ??
    null;
  const dedupeKey =
    raw?.dedupeKey ??
    normalizedPayload?.dedupeKey ??
    normalizedPayload?.referenceKey;
  const normalizedDeepLink =
    normalizedPayload?.deepLink ?? normalizedPayload?.deeplink;
  const targetUrl =
    raw?.targetUrl ??
    raw?.deeplink ??
    normalizedDeepLink ??
    normalizedPayload?.targetUrl ??
    normalizedPayload?.navigateTo;
  const message =
    raw?.message ??
    raw?.body ??
    normalizedPayload?.message ??
    'Você recebeu uma notificação';
  const title =
    raw?.title ??
    normalizedPayload?.title ??
    (normalizedPayload?.type
      ? normalizedPayload?.type.toString()
      : 'Notificação');
  const createdAt =
    raw?.createdAt ?? raw?.timestamp ?? new Date().toISOString();

  return {
    id: raw?.id ?? raw?._id ?? String(raw?.id || ''),
    userId: raw?.userId ?? undefined,
    type: raw?.type ?? normalizedPayload?.type ?? 'SYSTEM',
    title,
    message,
    targetUrl,
    deepLink:
      raw?.deepLink ?? normalizedDeepLink ?? targetUrl,
    category: raw?.category ?? normalizedPayload?.category,
    actionButtons:
      raw?.actionButtons ??
      (normalizedPayload?.actionButtons as Record<string, unknown>) ??
      null,
    imageUrl: raw?.imageUrl ?? normalizedPayload?.imageUrl ?? null,
    dedupeKey,
    payload: normalizedPayload ?? null,
    ttlSeconds: raw?.ttlSeconds ?? normalizedPayload?.ttlSeconds ?? null,
    priority: raw?.priority ?? normalizedPayload?.priority ?? null,
    createdAt,
    readAt:
      raw?.readAt ??
      normalizedPayload?.readAt ??
      raw?.acknowledgedAt ??
      null,
    acknowledgedAt:
      raw?.acknowledgedAt ??
      normalizedPayload?.acknowledgedAt ??
      null,
  };
};

export const toAppNotification = (raw: any): AppNotification => {
  const event = toAppEvent(raw);
  return {
    id: event.id,
    title: event.title ?? 'Notificação',
    body: event.message,
    isRead: Boolean(event.readAt || event.acknowledgedAt),
    readAt: event.readAt ?? event.acknowledgedAt,
    createdAt: event.createdAt,
    deeplink: event.targetUrl ?? undefined,
    navigateTo: event.targetUrl ?? undefined,
    type: event.type,
    meta: event.payload ?? undefined,
    dedupeKey: event.dedupeKey ?? undefined,
    payload: event.payload ?? undefined,
    ttlSeconds: event.ttlSeconds ?? undefined,
    category: event.category ?? undefined,
    imageUrl: event.imageUrl ?? undefined,
  };
};

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  const res = await api.patch('/notifications/me/mark-as-read', {});
  return res.data ?? { success: true };
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  const res = await api.patch(`/notifications/${id}/mark-as-read`, {});
  return res.data ?? { success: true };
}

export async function getNotificationStream(
  since?: string,
): Promise<AppEvent[]> {
  const res = await api.get('/notifications/stream', { params: { since } });
  const raw = Array.isArray(res.data) ? res.data : [];
  return raw.map(toAppEvent);
}

export async function ackNotification(id: string): Promise<void> {
  await api.post(
    `/notifications/${id}/ack`,
    {},
    {
      headers: {
        'x-silent': '1',
      },
    },
  );
}
