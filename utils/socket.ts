import Constants from 'expo-constants';

export function resolveSocketUrl(): string {
  const envUrl =
    (globalThis as any)?.EXPO_PUBLIC_WS_URL ??
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_WS_URL : undefined) ??
    (Constants.expoConfig?.extra as any)?.wsUrl ??
    (Constants.expoConfig?.extra as any)?.backendWsUrl;
  if (envUrl) {
    return envUrl;
  }
  const apiUrl = (Constants.expoConfig?.extra as any)?.backendApiUrl || '';
  if (typeof apiUrl === 'string' && apiUrl.startsWith('http')) {
    return apiUrl.replace(/^http/, 'ws');
  }
  return 'ws://localhost:3000';
}
