// services/pushService.ts
import { Platform } from 'react-native';
import { api } from './api';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { requestNotificationPermissions } from '../utils/permissions';

export async function getExpoProjectId(): Promise<string | undefined> {
  try {
    // EAS projectId é necessário para getExpoPushTokenAsync em builds gerenciados
    // Tenta vários locais para compatibilidade
    const fromConstants = (Constants as any)?.expoConfig?.extra?.eas?.projectId || (Constants as any)?.expoConfig?.extra?.projectId;
    const fromAppConfig = (Constants as any)?.easConfig?.projectId;
    return fromConstants || fromAppConfig || process.env.EXPO_PROJECT_ID;
  } catch {
    return undefined;
  }
}

export async function acquireDevicePushToken(): Promise<string | null> {
  const hasPerm = await requestNotificationPermissions();
  if (!hasPerm) return null;
  try {
    // Preferir token Expo se disponível
    const projectId = await getExpoProjectId();
    if (projectId) {
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      if (token?.data) return token.data;
    } else {
      const token = await Notifications.getExpoPushTokenAsync();
      if (token?.data) return token.data;
    }
  } catch (_) {
    // fallback ao token nativo do dispositivo (iOS/APNs, Android/FCM) caso disponível
    try {
      const resp = await Notifications.getDevicePushTokenAsync();
      if ((resp as any)?.data) return (resp as any).data as string;
    } catch {}
  }
  return null;
}

export async function registerDevicePushToken(): Promise<{ ok: true } | null> {
  if (!Device.isDevice) return null;
  const token = await acquireDevicePushToken();
  if (!token) return null;
  try {
    const payload = { token, platform: Platform.OS } as const;
    const { data } = await api.post<{ ok: true }>(`/notifications/register-token`, payload);
    return data || { ok: true };
  } catch (e) {
    return null;
  }
}

