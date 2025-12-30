import { io } from 'socket.io-client';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { ackNotification, getNotificationStream } from 'services/notificationService';
import NotificationUIService from '../services/notificationUIService';
import { resolveSocketUrl } from '../utils/socket';
import { dedupeAppEvents } from '../utils/notificationStreamUtils';
import type { AppEvent } from '../types/backend/events';

export function useNotificationsSocket(authToken?: string | null) {
  const isPlayingRef = useRef(false);
  const processedKeysRef = useRef(new Set<string>());
  const lastEventAtRef = useRef<string>(new Date(0).toISOString());
  const streamLockRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const playAlertSound = async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    try {
      const ExpoAV = await import('expo-av');
      const { Audio } = ExpoAV;
      const sound = new Audio.Sound();
      await sound.loadAsync(require('../assets/sounds/new-booking.mp3'));
      let plays = 0;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status?.isLoaded && status.didJustFinish) {
          plays += 1;
          if (plays < 3) {
            sound.replayAsync().catch(() => {
              isPlayingRef.current = false;
              sound.unloadAsync().catch(() => {});
            });
          } else {
            sound.unloadAsync().catch(() => {});
            isPlayingRef.current = false;
          }
        }
      });
    } catch (err) {
      console.warn('[notifications socket] failed to play mp3 sound:', err);
      isPlayingRef.current = false;
    }
  };

  const processAppEvent = useCallback(
    async (event: AppEvent) => {
      const dedupeId = event.dedupeKey ?? event.id;
      if (!dedupeId || processedKeysRef.current.has(dedupeId)) {
        return;
      }
      processedKeysRef.current.add(dedupeId);

      const title = event.title ?? 'NotificaA§ALo';
      const message = event.message ?? 'VocAa recebeu uma nova notificaA§ALo.';
      const deepLink =
        (event.payload?.deepLink as string | undefined) ??
        event.targetUrl ??
        undefined;
      NotificationUIService.showAppEvent({
        dedupeKey: dedupeId,
        title,
        message,
        type: 'info',
        deepLink,
      });

      const createdAt = new Date(event.createdAt ?? Date.now());
      if (!Number.isNaN(createdAt.getTime())) {
        lastEventAtRef.current = new Date(
          Math.max(new Date(lastEventAtRef.current).getTime(), createdAt.getTime()),
        ).toISOString();
      }

      if (event.id) {
        ackNotification(event.id).catch(() => {});
      }

      const kind = ((event.type || event.category || event.payload?.type || '') as string).toLowerCase();
      const isService =
        kind.includes('service') ||
        kind.includes('servico') ||
        kind.includes('agendamento') ||
        kind.includes('booking');
      if (isService) {
        try {
          const Notifications =
            (await import('expo-notifications')).default || (await import('expo-notifications'));
          await (Notifications as any)?.scheduleNotificationAsync?.({
            content: {
              title,
              body: message,
              sound: 'default',
              data: event.payload ?? event,
            },
            trigger: null,
          });
        } catch (err) {
          console.warn('[notifications socket] failed to play sound notification:', err);
        }

        playAlertSound();
      }
    },
    [],
  );

  const fetchPendingEvents = useCallback(async () => {
    if (!authToken || streamLockRef.current) {
      return;
    }
    streamLockRef.current = true;
    try {
      const sinceTimestamp = Math.max(0, new Date(lastEventAtRef.current).getTime() - 1);
      const since = sinceTimestamp > 0 ? new Date(sinceTimestamp).toISOString() : undefined;
      const events = await getNotificationStream(since);
      const uniqueEvents = dedupeAppEvents(events, processedKeysRef.current);
      await Promise.all(uniqueEvents.map((event) => processAppEvent(event)));
    } catch (error) {
      console.warn('[notifications stream] failed to fetch events', error);
    } finally {
      streamLockRef.current = false;
    }
  }, [authToken, processAppEvent]);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    const socket = io(resolveSocketUrl(), {
      auth: { token: authToken },
      transports: ['websocket'],
    });

    socket.on('notification', (payload: AppEvent) => {
      processAppEvent(payload);
    });

    socket.on('connect', () => {
      fetchPendingEvents();
    });

    socket.on('disconnect', () => {
      fetchPendingEvents();
    });

    socket.on('mission-progress', () => {
      NotificationUIService.showInfo('Seu progresso nas missÃµes foi atualizado.', 'MissÃµes');
    });

    fetchPendingEvents();

    return () => {
      socket.disconnect();
    };
  }, [authToken, fetchPendingEvents]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        nextState === 'active' &&
        (appStateRef.current === 'background' || appStateRef.current === 'inactive')
      ) {
        fetchPendingEvents();
      }
      appStateRef.current = nextState;
    });
    return () => {
      subscription.remove();
    };
  }, [fetchPendingEvents]);
}
