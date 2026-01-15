// services/pushService.ts
import { Platform } from 'react-native';
import { api } from './api';
import * as Device from 'expo-device';
import messaging from '@react-native-firebase/messaging';
import { requestNotificationPermissions } from '../utils/permissions';

export async function acquireDevicePushToken(): Promise<string | null> {
  const hasPerm = await requestNotificationPermissions();
  if (!hasPerm || !Device.isDevice) {
    return null;
  }
  try {
    await messaging().registerDeviceForRemoteMessages();
  } catch {
    // ignore if registration fails; token request might still succeed
  }
  try {
    const token = await messaging().getToken();
    return token ?? null;
  } catch (error) {
    if (__DEV__) {
      console.warn('[pushService] messaging().getToken falhou:', error);
    }
    return null;
  }
}

export async function registerDevicePushToken(
  existingToken?: string,
): Promise<{ ok: true } | null> {
  if (!Device.isDevice) return null;
  const token = existingToken ?? (await acquireDevicePushToken());
  if (!token) return null;
  try {
    const payload = { token, platform: Platform.OS } as const;
    const { data } = await api.post<{ ok: true }>(
      `/notifications/register-token`,
      payload,
    );
    return data || { ok: true };
  } catch (e) {
    return null;
  }
}

export async function unregisterDevicePushToken(): Promise<void> {
  try {
    await api.post('/auth/logout-device', undefined);
  } catch {
    // best-effort cleanup; ignore failures
  }
}
