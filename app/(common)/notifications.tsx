// LimpeJaApp/app/(common)/notifications.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    Alert, // Para o botão de marcar todas como lidas
    Animated, // Importar Animated para animações
    RefreshControl, // Adicionado para pull-to-refresh
} from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Importa ambos explicitamente
import { useAuth } from '../../hooks/useAuth';

// <--- ADICIONADO: Importar serviços e tipagens reais
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '../services/notificationService';
import { NotificationEntity } from '../types/backend/notifications';

// Helper simples para formatar timestamp de forma relativa ou absoluta
const formatNotificationTimestamp = (isoTimestamp: string): string => {
    const now = new Date();
    const date = new Date(isoTimestamp);
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return "Agora mesmo";
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Função para obter ícone com base no tipo de notificação
// <--- CORREÇÃO: getNotificationIcon retorna o nome do ícone e a biblioteca
const getNotificationIcon = (type: NotificationEntity['type']): { name: string, color: string, library: 'Ionicons' | 'MaterialCommunityIcons' } => {
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
    item: NotificationEntity;
    onPress: (item: NotificationEntity) => void;
    delay: number;
}> = ({ item, onPress, delay }) => {
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
                    <Text style={styles.notificationTimestamp}>{formatNotificationTimestamp(item.createdAt)}</Text>
                </View>
                {item.navigateTo && <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" style={styles.chevron}/>}
            </TouchableOpacity>
        </Animated.View>
    );
};


export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const markAllButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const loadNotifications = useCallback(async (refreshing: boolean = false) => {
    if (!refreshing) setIsLoading(true);
    if (!user?.id) {
        console.warn("[NotificationsScreen] User ID ausente, não foi possível carregar notificações.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
    }
    
    try {
      const fetchedNotifications: NotificationEntity[] = await getNotifications();
      const sortedNotifications = fetchedNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(sortedNotifications);
      if (refreshing) Alert.alert("Sucesso", "Notificações atualizadas!");

    } catch (err: any) {
      console.error("Erro ao buscar notificações:", err.response?.data || err.message);
      Alert.alert("Erro", err.response?.data?.message || "Não foi possível carregar suas notificações.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [user?.id, feedbackAnim]);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    loadNotifications();
  }, [headerAnim, loadNotifications]);

  const handleNotificationPress = async (item: NotificationEntity) => {
    console.log("[NotificationsScreen] Notificação pressionada:", item.id, "Lida:", !!item.readAt);
    if (!item.readAt) {
      try {
        await markNotificationAsRead(item.id);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n));
        console.log("[NotificationsScreen] Notificação marcada como lida (backend e frontend):", item.id);
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        Alert.alert("Erro", "Não foi possível marcar a notificação como lida.");
      }
    }
    if (item.navigateTo) {
      try {
        console.log("[NotificationsScreen] Navegando para:", item.navigateTo);
        router.push(item.navigateTo as any);
      } catch (e) {
          console.error(`[NotificationsScreen] Erro ao navegar para ${item.navigateTo}:`, e);
          Alert.alert("Erro de Navegação", "Não foi possível abrir esta notificação.");
      }
    }
  };

  const handleMarkAllAsRead = async () => {
      try {
          await markAllNotificationsAsRead();
          setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
          Alert.alert("Sucesso", "Todas as notificações foram marcadas como lidas.");
      } catch (error) {
          console.error("Erro ao marcar todas como lidas:", error);
          Alert.alert("Erro", "Não foi possível marcar todas as notificações como lidas.");
      }
  };

  const onPressInMarkAll = () => { Animated.spring(markAllButtonScaleAnim, { toValue: 0.9, useNativeDriver: true }).start(); };
  const onPressOutMarkAll = () => { Animated.spring(markAllButtonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadNotifications(true);
  }, [loadNotifications]);

  const hasUnreadNotifications = notifications.some(n => !n.readAt);

  if (isLoading && !isRefreshing) {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <Text style={styles.headerTitle}>Notificações</Text>
                <View style={styles.headerActionIconPlaceholder} />
            </Animated.View>
            <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando notificações...</Text>
            </Animated.View>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.headerTitle}>Notificações</Text>
          {hasUnreadNotifications ? (
              <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  onPressIn={onPressInMarkAll}
                  onPressOut={onPressOutMarkAll}
                  style={[styles.markAllReadButton, { transform: [{ scale: markAllButtonScaleAnim }] }]}
              >
                  <Text style={styles.markAllReadButtonText}>Marcar Todas como Lidas</Text>
              </TouchableOpacity>
          ) : (
              <View style={styles.headerActionIconPlaceholder} />
          )}
      </Animated.View>

      {notifications.length === 0 ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
            <Ionicons name="notifications-off-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyText}>Nenhuma notificação por aqui.</Text>
            <Text style={styles.emptySubText}>Você está em dia!</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item, index }) => (
            <AnimatedNotificationItem
                item={item}
                onPress={handleNotificationPress}
                delay={index * 50}
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
              title="Atualizando notificações..."
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  markAllReadButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  markAllReadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerActionIconPlaceholder: {
    width: 100,
  },
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
    backgroundColor: '#E6F2FF',
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