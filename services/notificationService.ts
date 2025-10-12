import { api } from './api';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  deeplink?: string | null;
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const res = await api.get('/notifications/me');
  return res.data as AppNotification[];
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  const res = await api.patch('/notifications/me/mark-as-read', {});
  return res.data ?? { success: true };
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  const res = await api.patch(`/notifications/${id}/mark-as-read`, {});
  return res.data ?? { success: true };
}

