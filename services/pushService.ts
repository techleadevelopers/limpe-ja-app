// services/pushService.ts
import { Platform } from 'react-native';
import { api } from './api';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

const EXPO_PROJECT_ID = 'a33ee4a2-86fc-43b8-8d99-b258381b2a1f';

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  try {
    const response = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });
    const token = response?.data ?? null;
    if (token) {
      console.log(
        '********** TOKEN PARA O RAILWAY **********',
        token,
        '****************************************',
      );
    }
    return token;
  } catch (error) {
    console.warn('[pushService] getExpoPushTokenAsync falhou:', error);
    return null;
  }
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  return await getExpoPushToken();
}

export async function registerDevicePushToken(
  existingToken?: string,
): Promise<{ ok: true } | null> {
  if (!Device.isDevice) return null;
  const token = existingToken ?? (await registerForPushNotificationsAsync());
  if (!token) return null;
  try {
    const payload = { token, platform: Platform.OS } as const;
    // ESTE TOKEN DEVE SER ENVIADO VIA POST PARA https://exp.host/--/api/v2/push/send PELO BACKEND NO RAILWAY
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
