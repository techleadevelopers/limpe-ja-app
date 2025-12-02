// LimpeJaApp/app/(client)/notifications/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  AppNotification,
} from '../../../services/notificationService';

const formatNotificationTimestamp = (isoTimestamp: string, t: any): string => {
  const now = new Date();
  const date = new Date(isoTimestamp);
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSeconds < 60) return t('notifications.now', 'Agora mesmo');
  if (diffMinutes < 60) return t('notifications.minutes_ago', { count: diffMinutes, defaultValue: '{{count}} min' });
  if (diffHours < 24) return t('notifications.hours_ago', { count: diffHours, defaultValue: '{{count}} h' });
  if (diffDays === 1) return t('notifications.yesterday', 'Ontem');
  if (diffDays < 7) return t('notifications.days_ago', { count: diffDays, defaultValue: '{{count}} d' });
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const getNotificationIcon = (
  type?: string
): { name: string; color: string; library: 'Ionicons' | 'MaterialCommunityIcons' } => {
  switch (type) {
    case 'AGENDAMENTO':
      return { name: 'calendar-outline', color: '#007AFF', library: 'Ionicons' };
    case 'MENSAGEM':
      return { name: 'chatbubble-ellipses-outline', color: '#4CAF50', library: 'Ionicons' };
    case 'PAGAMENTO':
      return { name: 'cash-outline', color: '#FF9500', library: 'Ionicons' };
    case 'BOOKING_CONFIRMED':
      return { name: 'check-circle-outline', color: '#2E7D32', library: 'MaterialCommunityIcons' };
    case 'NEW_MESSAGE':
      return { name: 'message-text-outline', color: '#4CAF50', library: 'MaterialCommunityIcons' };
    case 'SYSTEM_UPDATE':
      return { name: 'update', color: '#546E7A', library: 'MaterialCommunityIcons' };
    default:
      return { name: 'notifications-outline', color: '#546E7A', library: 'Ionicons' };
  }
};

const AnimatedNotificationItem: React.FC<{
  item: AppNotification;
  onPress: (item: AppNotification) => void;
  delay: number;
  t: any;
}> = ({ item, onPress, delay, t }) => {
  const thumbnail = (item as any).thumbnail as any | undefined;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const iconInfo = getNotificationIcon(item.type);
  const isRead = !!item.isRead;

  return (
    <Animated.View
      style={[
        styles.notificationItemWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.notificationItem, !isRead && styles.unreadItem]}
        onPress={() => onPress(item)}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start()}
        activeOpacity={1}
      >
        <View style={styles.iconContainer}>
          {!isRead && <View style={styles.unreadDot} />}
          {thumbnail ? (
            <Image source={thumbnail} style={styles.thumbnail} resizeMode="contain" />
          ) : iconInfo.library === 'Ionicons' ? (
            <Ionicons name={iconInfo.name as keyof typeof Ionicons.glyphMap} size={26} color={iconInfo.color} />
          ) : (
            <MaterialCommunityIcons
              name={iconInfo.name as keyof typeof MaterialCommunityIcons.glyphMap}
              size={26}
              color={iconInfo.color}
            />
          )}
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.notificationTitle, !isRead && styles.unreadText]}>{item.title}</Text>
          <Text style={[styles.notificationBody, !isRead && styles.unreadTextLight]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.notificationTimestamp}>{formatNotificationTimestamp(item.createdAt, t)}</Text>
        </View>
        {!!item.deeplink && <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" style={styles.chevron} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ClientNotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const loadNotifications = useCallback(async (refreshing = false) => {
    if (!refreshing) setIsLoading(true);
    try {
      const fetched = await getMyNotifications();
      const sorted = fetched.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // Fallback para evitar lista vazia e tornar a UI mais confortável no app
            const fallback = [
              {
                id: 'sample-1',
                title: 'Bem-vindo ao LimpeJá',
                body: 'Aqui você recebe confirmações e novidades dos seus agendamentos.',
                isRead: false,
                createdAt: new Date().toISOString(),
                type: 'SYSTEM_UPDATE',
                // thumbnail usado apenas para a amostra visual; faremos um cast abaixo
                thumbnail: require('../../../assets/images/logo.png'),
              },
              {
                id: 'sample-2',
                title: 'Pagamento via PIX',
                body: 'Seus pagamentos confirmados aparecerão aqui. Toque para acompanhar.',
                isRead: true,
                createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
                type: 'PAGAMENTO',
                thumbnail: require('../../../assets/images/pixx.png'),
              },
            ] as unknown as AppNotification[];
            setNotifications(sorted.length > 0 ? sorted : fallback);
      if (refreshing) Alert.alert(t('common.success', 'Sucesso'), t('notifications.notifications_updated', 'Notificações atualizadas'));
    } catch (err: any) {
      Alert.alert(t('common.error', 'Erro'), err?.response?.data?.message || t('common.network_error', 'Falha de rede.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      Animated.timing(feedbackAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [feedbackAnim, t]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationPress = async (item: AppNotification) => {
    if (item.isRead) return;
    try {
      await markNotificationAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    } catch {
      Alert.alert(t('common.error', 'Erro'), t('notifications.mark_read_error', 'Não foi possível marcar como lida.'));
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications(true);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      Alert.alert(t('common.success', 'Sucesso'), t('notifications.read_all_success', 'Notificações marcadas como lidas.'));
    } catch {
      Alert.alert(t('common.error', 'Erro'), t('notifications.read_all_error', 'Não foi possível marcar todas.'));
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('notifications.title', 'Notificações'),
          headerShown: true,
          headerBackTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F3F6FB', height: 110, paddingTop: 44, paddingBottom: 8 },
          headerTitleContainerStyle: { marginTop: 8 },
          headerLeftContainerStyle: { marginTop: 8 },
          headerRightContainerStyle: { marginTop: 8 },
          contentStyle: undefined,
          headerTitleStyle: { fontWeight: '800', color: '#0f172a', fontSize: 20 },
          headerLeft: () => (
            <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#0f172a" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll} activeOpacity={0.9}>
              <Ionicons name="checkmark-done" size={14} color="#2563eb" />
              <Text style={styles.markAllText}>{t('notifications.mark_all', 'Marcar todas')}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#2563eb" />}
          renderItem={({ item, index }) => (
            <AnimatedNotificationItem item={item} onPress={handleNotificationPress} delay={index * 60} t={t} />
          )}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, paddingTop: 8 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t('notifications.empty', 'Sem notificações por aqui.')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 19, backgroundColor: '#F3F6FB', },
  headerBackBtn: { paddingHorizontal: 18, paddingVertical: 14 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#eef6ff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  markAllText: { color: '#2563eb', fontSize: 10, fontWeight: '700' },
  center: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#6b7280', fontWeight: '600' },
  notificationItemWrapper: { marginVertical: 6 },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9EEF5',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  unreadItem: {
    borderLeftWidth: 0,
    borderLeftColor: '#2564eb63',
  },
  iconContainer: { width: 64, alignItems: 'center', justifyContent: 'center' },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  contentContainer: { flex: 1, marginLeft: 8 },
  notificationTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  notificationBody: { fontSize: 12, color: '#475569', marginTop: 2 },
  notificationTimestamp: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  unreadText: { color: '#0f172a' },
  unreadTextLight: { color: '#1e293b' },
  chevron: { marginLeft: 8 },
  thumbnail: { width: 64, height: 64, borderRadius: 6 },
});


