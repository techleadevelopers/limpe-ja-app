import * as Haptics from 'expo-haptics';

type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
};

// Abstraction around expo-notifications + haptics fallback to keep client-side code DRY.
export async function scheduleLocalNotification({ title, body, data = null }: NotificationPayload) {
  try {
    const NotificationsModule =
      (await import('expo-notifications')).default || (await import('expo-notifications'));
    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: data ?? undefined,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[localNotificationService] failed to schedule notification', error);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (innerError) {
      console.warn('[localNotificationService] haptics fallback failed', innerError);
    }
  }
}
