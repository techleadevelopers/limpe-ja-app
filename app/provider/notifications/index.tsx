// LimpeJaApp/app/provider/notifications/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { showOverlay } from '../../../hooks/useOverlayMessage';
import { useTranslation } from 'react-i18next'; // Importar i18n

// <--- ADICIONADO: Importar serviços e tipagens reais
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '../../../services/notificationService';
import type { AppNotification } from '../../../services/notificationService';

// Helper simples para formatar timestamp de forma relativa ou absoluta
const formatNotificationTimestamp = (isoTimestamp: string, t: any): string => {
    const now = new Date();
    const date = new Date(isoTimestamp);
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return t("notifications.now");
    if (diffMinutes < 60) return t("notifications.minutes_ago", { count: diffMinutes });
    if (diffHours < 24) return t("notifications.hours_ago", { count: diffHours });
    if (diffDays === 1) return t("notifications.yesterday");
    if (diffDays < 7) return t("notifications.days_ago", { count: diffDays });
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Função para obter ícone com base no tipo de notificação
// <--- CORREÇÃO: getNotificationIcon retorna o nome do ícone e a biblioteca
const getNotificationIcon = (type: string | undefined): { name: string, color: string, library: 'Ionicons' | 'MaterialCommunityIcons' } => {
    switch (type) {
        case 'AGENDAMENTO': return { name: 'calendar-outline', color: '#007AFF', library: 'Ionicons' };
        case 'MENSAGEM': return { name: 'chatbubble-ellipses-outline', color: '#4CAF50', library: 'Ionicons' };
        case 'PAGAMENTO': return { name: 'cash-outline', color: '#FF9500', library: 'Ionicons' };
        case 'BOOKING_CONFIRMED': return { name: 'check-circle-outline', color: '#2E7D32', library: 'MaterialCommunityIcons' }; // Exemplo
        case 'NEW_MESSAGE': return { name: 'message-text-outline', color: '#4CAF50', library: 'MaterialCommunityIcons' }; // Exemplo
        case 'SYSTEM_UPDATE': return { name: 'update', color: '#546E7A', library: 'MaterialCommunityIcons' }; // Exemplo
        case 'GERAL': // Ou outro tipo genérico do backend
        default: return { name: 'notifications-outline', color: '#546E7A', library: 'Ionicons' };
    }
}

// Componente para cada item da notificação com animações
const AnimatedNotificationItem: React.FC<{
    item: AppNotification;
    onPress: (item: AppNotification) => void;
    delay: number;
    t: any; // Adicionar prop t para i18n
}> = ({ item, onPress, delay, t }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    const onPressInItem = () => {
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };

    const onPressOutItem = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    const iconInfo = getNotificationIcon(item.type);
    const isRead = !!item.readAt; // Notificação é lida se readAt não for nulo

    return (
        <Animated.View
            style={[
                styles.notificationItemWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
            ]}
        >
            <TouchableOpacity
                style={[styles.notificationItem, !isRead && styles.unreadItem]}
                onPress={() => onPress(item)}
                onPressIn={onPressInItem}
                onPressOut={onPressOutItem}
                activeOpacity={1}
            >
                <View style={styles.iconContainer}>
                    {!isRead && <View style={styles.unreadDot} />}
                    {/* <--- CORREÇÃO: Renderiza o ícone correto com base na biblioteca */}
                    {iconInfo.library === 'Ionicons' ? (
                        <Ionicons name={iconInfo.name as keyof typeof Ionicons.glyphMap} size={26} color={iconInfo.color} />
                    ) : (
                        <MaterialCommunityIcons name={iconInfo.name as keyof typeof MaterialCommunityIcons.glyphMap} size={26} color={iconInfo.color} />
                    )}
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.notificationTitle, !isRead && styles.unreadText]}>{item.title}</Text>
                    <Text style={[styles.notificationBody, !isRead && styles.unreadTextLight]} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.notificationTimestamp}>{formatNotificationTimestamp(item.createdAt, t)}</Text>
                </View>
                {Boolean((item as any).navigateTo ?? (item as any).targetUrl ?? (item as any).deeplink) && (
                  <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" style={styles.chevron}/>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};


export default function ProviderNotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation(); // Inicializar i18n
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const markAllButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const loadNotifications = useCallback(async (refreshing: boolean = false) => {
    if (!refreshing) setIsLoading(true);
    if (!user?.id) {
        console.warn("[ProviderNotificationsScreen] User ID ausente, não foi possível carregar notificações.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
    }
    
    try {
      const fetchedNotifications: AppNotification[] = await getNotifications();
      const sortedNotifications = fetchedNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(sortedNotifications);
      if (refreshing) {
        showOverlay({ title: t("common.success"), subtitle: t("notifications.notifications_updated"), variant: 'success' });
      }

    } catch (err: any) {
      console.error("Erro ao buscar notificações:", err.response?.data || err.message);
      showOverlay({ title: t("common.error"), subtitle: err.response?.data?.message || t("common.network_error"), variant: 'error' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [user?.id, feedbackAnim, t]);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    loadNotifications();
  }, [headerAnim, loadNotifications]);

  const handleNotificationPress = async (item: AppNotification) => {
    console.log("[ProviderNotificationsScreen] Notificação pressionada:", item.id, "Lida:", !!item.readAt);
    if (!item.isRead) {
      try {
        await markNotificationAsRead(item.id);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
        console.log(t("notifications.mark_read_success"), item.id);
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        showOverlay({ title: t("common.error"), subtitle: t("notifications.mark_read_error"), variant: 'error' });
      }
    }
    const link = (item as any).navigateTo ?? (item as any).targetUrl ?? (item as any).deeplink;
    if (link) {
      try {
        if (link.startsWith('/(')) {
          router.push(link as any);
        } else {
          const can = await Linking.canOpenURL(link);
          if (can) await Linking.openURL(link);
          else showOverlay({ title: t('notifications.navigation_error'), subtitle: t('notifications.navigation_error_message'), variant: 'warning' });
        }
      } catch (e) {
        console.error(`[ProviderNotificationsScreen] Erro ao navegar para ${link}:`, e);
        showOverlay({ title: t('notifications.navigation_error'), subtitle: t('notifications.navigation_error_message'), variant: 'warning' });
      }
    }
  };

  const handleMarkAllAsRead = async () => {
      try {
          await markAllNotificationsAsRead();
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
          showOverlay({ title: t("common.success"), subtitle: t("notifications.mark_all_read_success"), variant: 'success' });
      } catch (error) {
          console.error("Erro ao marcar todas como lidas:", error);
          showOverlay({ title: t("common.error"), subtitle: t("notifications.mark_all_read_error"), variant: 'error' });
      }
  };

  const onPressInMarkAll = () => { Animated.spring(markAllButtonScaleAnim, { toValue: 0.9, useNativeDriver: true }).start(); };
  const onPressOutMarkAll = () => { Animated.spring(markAllButtonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadNotifications(true);
  }, [loadNotifications]);

  const hasUnreadNotifications = notifications.some(n => !n.isRead);

  if (isLoading && !isRefreshing) {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityRole="button" accessibilityLabel={t('common.back', { defaultValue: 'Voltar' })}>
                  <Ionicons name="arrow-back" size={24} color="#2F3A4A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
                <View style={styles.headerActionIconPlaceholder} />
            </Animated.View>
            <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>{t("notifications.loading_notifications")}</Text>
            </Animated.View>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityRole="button" accessibilityLabel={t('common.back', { defaultValue: 'Voltar' })}>
            <Ionicons name="arrow-back" size={24} color="#2F3A4A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
          {hasUnreadNotifications ? (
              <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  onPressIn={onPressInMarkAll}
                  onPressOut={onPressOutMarkAll}
                  style={[styles.markAllReadButton, { transform: [{ scale: markAllButtonScaleAnim }] }]}
              >
                  <Text style={styles.markAllReadButtonText}>{t("notifications.mark_all_read")}</Text>
              </TouchableOpacity>
          ) : (
              <View style={styles.headerActionIconPlaceholder} />
          )}
      </Animated.View>

      {notifications.length === 0 ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
            <Ionicons name="notifications-off-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyText}>{t("notifications.no_notifications")}</Text>
            <Text style={styles.emptySubText}>{t("notifications.no_notifications_subtext")}</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item, index }) => (
            <AnimatedNotificationItem
                item={item}
                onPress={handleNotificationPress}
                delay={index * 50}
                t={t} // Passar a função t para o componente filho
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              title={t("notifications.loading_notifications")}
              titleColor="#007AFF"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 18 : 18,
    paddingTop: Platform.OS === 'ios' ? 41 : 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F3A4A',
    flex: 1,
    top: 12,
    right: 6,
    textAlign: 'center',
  },
  headerBackButton: {
    padding: 8,
    top: 12,
    marginRight: 6,
  },
  markAllReadButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  markAllReadButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerActionIconPlaceholder: { width: 28 },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
      marginTop: 15,
      fontSize: 16,
      color: '#6C757D',
  },
  listContentContainer: {
    paddingVertical: 8,
  },
  notificationItemWrapper: {
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
        android: { elevation: 2 },
    }),
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    position: 'relative',
  },
  unreadDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#007AFF',
      zIndex: 1,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 3,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  unreadTextLight: {
  },
  notificationBody: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 5,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#868E96',
  },
  chevron: {
      marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: 70,
    marginRight: 10,
  },
  emptyText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#343A40',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
      fontSize: 15,
      color: '#6C757D',
      textAlign: 'center',
  },
});
