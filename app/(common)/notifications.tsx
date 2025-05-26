// LimpeJaApp/app/(common)/notifications.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    TouchableOpacity,
    Platform,
    Alert // Para o botão de marcar todas como lidas
} from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Para ícones
// Supondo que você tenha um helper para formatar datas, vamos criar um simples aqui
// ou você pode usar uma lib como date-fns para formatação mais avançada.

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
  // Adicione outros dados que a notificação possa ter, ex: bookingId, chatId, etc.
  relatedId?: string; 
}

// Mock de dados com mais variedade
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'agendamento', title: 'Agendamento Confirmado!', body: 'Sua limpeza com Ana Oliveira foi confirmada para Terça, 28 de Mai às 10:00.', timestamp: new Date(Date.now() - 300000).toISOString() /* 5 min atrás */, isRead: false, navigateTo: '/(client)/bookings/book1', relatedId: 'book1' },
  { id: '2', type: 'mensagem', title: 'Nova Mensagem de Carlos Silva', body: 'Carlos: "Chegarei em 10 minutos para o serviço."', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() /* 2h atrás */, isRead: false, navigateTo: '/(client)/messages/chat_carlos_silva', relatedId: 'chat_carlos_silva' },
  { id: '3', type: 'pagamento', title: 'Pagamento Recebido', body: 'Recebemos o pagamento de R$180,00 pelo serviço de Limpeza Completa.', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() /* Ontem */, isRead: true },
  { id: '4', type: 'agendamento', title: 'Lembrete de Agendamento', body: 'Não se esqueça do seu serviço de jardinagem amanhã às 09:00.', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), isRead: true, navigateTo: '/(client)/bookings/bookUpcoming', relatedId: 'bookUpcoming' },
  { id: '5', type: 'geral', title: 'Bem-vindo ao LimpeJá!', body: 'Explore nossos serviços e encontre os melhores profissionais.', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() /* 5 dias atrás */, isRead: true },
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


export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("[NotificationsScreen] Carregando notificações...");
    setIsLoading(true);
    // TODO: Substituir pela chamada real ao seu commonService.getNotifications();
    setTimeout(() => {
      // Ordena por data, mais recente primeiro
      const sortedNotifications = MOCK_NOTIFICATIONS.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(sortedNotifications);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleNotificationPress = async (item: NotificationItem) => {
    console.log("[NotificationsScreen] Notificação pressionada:", item.id, "Lida:", item.isRead);
    if (!item.isRead) {
      // TODO: Chamar commonService.markNotificationAsRead(item.id) no backend;
      // Simulação de marcar como lida no frontend:
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      console.log("[NotificationsScreen] Notificação marcada como lida (frontend):", item.id);
    }
    if (item.navigateTo) {
      // Verifica se o tipo da rota é válido antes de navegar para evitar erros com rotas inexistentes
      // Para um sistema mais robusto, você teria um mapeamento ou validação melhor aqui.
      try {
        console.log("[NotificationsScreen] Navegando para:", item.navigateTo);
        router.push(item.navigateTo as any); // `as any` para simplificar, idealmente use Href tipado
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

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const iconInfo = getNotificationIcon(item.type);
    return (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
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
  )};

  if (isLoading) {
    return (
        <View style={styles.centeredFeedback}>
            <Stack.Screen options={{ title: 'Notificações' }} />
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Carregando notificações...</Text>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
            title: 'Notificações',
            headerRight: () => (
                notifications.some(n => !n.isRead) && // Mostra o botão apenas se houver não lidas
                <TouchableOpacity onPress={handleMarkAllAsRead} style={{ marginRight: 15 }}>
                    <Text style={{ color: '#007AFF', fontSize: 16 }}>Marcar Todas como Lidas</Text>
                </TouchableOpacity>
            )
        }} 
      />
      {notifications.length === 0 ? (
        <View style={styles.centeredFeedback}>
            <Ionicons name="notifications-off-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyText}>Nenhuma notificação por aqui.</Text>
            <Text style={styles.emptySubText}>Você está em dia!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
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
  notificationItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    // borderBottomWidth: StyleSheet.hairlineWidth, // Removido para usar ItemSeparatorComponent
    // borderBottomColor: '#E0E0E0',
  },
  unreadItem: {
    backgroundColor: '#E9F5FF', // Um azul bem claro para não lidas
    // borderLeftWidth: 4, // Pode ser removido se o dot for suficiente
    // borderLeftColor: '#007AFF',
  },
  iconContainer: {
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40, // Para alinhar
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
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginLeft: 75, // Para alinhar com o conteúdo, após o espaço do ícone
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