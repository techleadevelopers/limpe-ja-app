import { api } from './api';

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
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const res = await api.get('/notifications/me');
  const raw = Array.isArray(res.data) ? res.data : [];
  return raw.map(toAppNotification);
}

// Alias to keep legacy imports working (provider screen expects getNotifications)
export { getMyNotifications as getNotifications };

// Normalizer to map various backend shapes into AppNotification
export const toAppNotification = (raw: any): AppNotification => ({
  id: raw?.id ?? raw?._id ?? String(raw?.id || ''),
  title: raw?.title ?? raw?.messageTitle ?? 'Notificação',
  body: raw?.body ?? raw?.message ?? '',
  isRead: typeof raw?.isRead === 'boolean' ? raw.isRead : Boolean(raw?.readAt),
  createdAt: raw?.createdAt ?? raw?.timestamp ?? new Date().toISOString(),
  deeplink: raw?.deeplink ?? raw?.targetUrl ?? raw?.navigateTo ?? undefined,
  type: raw?.type,
});

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  const res = await api.patch('/notifications/me/mark-as-read', {});
  return res.data ?? { success: true };
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  const res = await api.patch(`/notifications/${id}/mark-as-read`, {});
  return res.data ?? { success: true };
}
