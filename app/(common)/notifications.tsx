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
} from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); // Ex: 26 Mai
};


interface NotificationItem {
  id: string;
  type: 'agendamento' | 'mensagem' | 'pagamento' | 'geral'; // Para ícone e lógica
  title: string;
  body: string;
  timestamp: string; // ISO String
  isRead: boolean;
  navigateTo?: string; // Rota para onde navegar ao clicar
  relatedId?: string; 
}

// Mock de dados com mais variedade
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'agendamento', title: 'Agendamento Confirmado!', body: 'Sua limpeza com Ana Oliveira foi confirmada para Terça, 28 de Mai às 10:00.', timestamp: new Date(Date.now() - 300000).toISOString() /* 5 min atrás */, isRead: false, navigateTo: '/(client)/bookings/book1', relatedId: 'book1' },
  { id: '2', type: 'mensagem', title: 'Nova Mensagem de Carlos Silva', body: 'Carlos: "Chegarei em 10 minutos para o serviço."', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() /* 2h atrás */, isRead: false, navigateTo: '/(client)/messages/chat_carlos_silva', relatedId: 'chat_carlos_silva' },
  { id: '3', type: 'pagamento', title: 'Pagamento Recebido', body: 'Recebemos o pagamento de R$180,00 pelo serviço de Limpeza Completa.', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() /* Ontem */, isRead: true },
  { id: '4', type: 'agendamento', title: 'Lembrete de Agendamento', body: 'Não se esqueça do seu serviço de jardinagem amanhã às 09:00.', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), isRead: true, navigateTo: '/(client)/bookings/bookUpcoming', relatedId: 'bookUpcoming' },
  { id: '5', type: 'geral', title: 'Bem-vindo ao LimpeJá!', body: 'Explore nossos serviços e encontre os melhores profissionais.', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() /* 5 dias atrás */, isRead: true },
  { id: '6', type: 'agendamento', title: 'Agendamento Cancelado', body: 'Seu agendamento de limpeza com João foi cancelado. Por favor, reagende se desejar.', timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(), isRead: false, navigateTo: '/(client)/bookings/bookCanceled', relatedId: 'bookCanceled' },
  { id: '7', type: 'geral', title: 'Atualização do App', body: 'Novas funcionalidades e melhorias de performance disponíveis na última versão.', timestamp: new Date(Date.now() - 86400000 * 0.1).toISOString(), isRead: false },
];

// Função para obter ícone com base no tipo de notificação
const getNotificationIcon = (type: NotificationItem['type']): { name: keyof typeof Ionicons.glyphMap, color: string } => {
    switch (type) {
        case 'agendamento': return { name: 'calendar-outline', color: '#007AFF' };
        case 'mensagem': return { name: 'chatbubble-ellipses-outline', color: '#4CAF50' };
        case 'pagamento': return { name: 'cash-outline', color: '#FF9500' };
        case 'geral':
        default: return { name: 'notifications-outline', color: '#546E7A' };
    }
}

// Componente para cada item da notificação com animações
const AnimatedNotificationItem: React.FC<{
    item: NotificationItem;
    onPress: (item: NotificationItem) => void;
    delay: number;
}> = ({ item, onPress, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque

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

    return (
        <Animated.View 
            style={[
                styles.notificationItemWrapper, 
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
            ]}
        >
            <TouchableOpacity
                style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                onPress={() => onPress(item)}
                onPressIn={onPressInItem}
                onPressOut={onPressOutItem}
                activeOpacity={1} // Desativa o activeOpacity padrão
            >
                <View style={styles.iconContainer}>
                    {!item.isRead && <View style={styles.unreadDot} />}
                    <Ionicons name={iconInfo.name} size={26} color={iconInfo.color} />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
                    <Text style={[styles.notificationBody, !item.isRead && styles.unreadTextLight]} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.notificationTimestamp}>{formatNotificationTimestamp(item.timestamp)}</Text>
                </View>
                {item.navigateTo && <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" style={styles.chevron}/>}
            </TouchableOpacity>
        </Animated.View>
    );
};


export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current; // Para loading/empty states
  const markAllButtonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    console.log("[NotificationsScreen] Carregando notificações...");
    setIsLoading(true);
    // TODO: Substituir pela chamada real ao seu commonService.getNotifications();
    setTimeout(() => {
      const sortedNotifications = MOCK_NOTIFICATIONS.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(sortedNotifications);
      setIsLoading(false);
      // Animação para o feedback (carregando/vazio/lista)
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1000);
  }, [headerAnim, feedbackAnim]);

  const handleNotificationPress = async (item: NotificationItem) => {
    console.log("[NotificationsScreen] Notificação pressionada:", item.id, "Lida:", item.isRead);
    if (!item.isRead) {
      // TODO: Chamar commonService.markNotificationAsRead(item.id) no backend;
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      console.log("[NotificationsScreen] Notificação marcada como lida (frontend):", item.id);
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

  const handleMarkAllAsRead = () => {
      // TODO: Chamar API para marcar todas como lidas no backend
      console.log("[NotificationsScreen] Marcando todas as notificações como lidas (frontend)...");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      Alert.alert("Sucesso", "Todas as notificações foram marcadas como lidas.");
  };

  // Animações de feedback para o botão "Marcar todas como lidas"
  const onPressInMarkAll = () => { Animated.spring(markAllButtonScaleAnim, { toValue: 0.9, useNativeDriver: true }).start(); };
  const onPressOutMarkAll = () => { Animated.spring(markAllButtonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };


  if (isLoading) {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Custom Header para o estado de loading */}
            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <Text style={styles.headerTitle}>Notificações</Text>
                <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
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
      
      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.headerTitle}>Notificações</Text>
          {notifications.some(n => !n.isRead) ? (
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
                delay={index * 50} // Staggered delay
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Fundo geral mais suave
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
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
    flex: 1, // Para o título ocupar o espaço e centralizar melhor
    textAlign: 'center',
  },
  markAllReadButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)', // Fundo sutil para o botão
  },
  markAllReadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerActionIconPlaceholder: { // Para alinhar o título no centro quando o botão não está visível
    width: 100, // Largura aproximada do botão
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
    paddingVertical: 8, // Um pouco de espaço no topo e final da lista
  },
  notificationItemWrapper: { // Wrapper para a animação de cada item
    marginHorizontal: 10, // Margem para dar um efeito de card
    marginVertical: 4,
    borderRadius: 10,
    overflow: 'hidden', // Garante que a sombra não vaze
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
        android: { elevation: 2 },
    }),
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 15, // Ajustado para ter mais espaço interno
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: '#E6F2FF', // Um azul bem claro para não lidas
  },
  iconContainer: {
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40, // Para alinhar
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5', // Fundo para o ícone
    position: 'relative', // Para o unreadDot
  },
  unreadDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#007AFF', // Cor do ponto de não lida
      zIndex: 1,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1, // Para ocupar o espaço restante
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 3,
  },
  unreadText: { // Para título e corpo não lidos
    fontWeight: 'bold',
  },
  unreadTextLight: { // Para corpo não lido (se quiser menos destaque que o título)
    // color: '#333', // Pode manter a cor padrão do corpo ou ajustar
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
    height: 1, // Linha mais fina
    backgroundColor: '#E0E0E0',
    marginLeft: 70, // Para alinhar com o conteúdo, após o espaço do ícone
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