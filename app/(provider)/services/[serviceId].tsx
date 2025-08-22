import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Image,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ServiceItemSkeleton from '../../../components/ServiceItemSkeleton';
import ToastMessage from '../../../components/ui/ToastMessage';
import { formatDate } from '../../../utils/helpers';

// --- Importações de SERVIÇOS e TIPAGENS REAIS do BACKEND ---
import { getBookingsForUser } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
// -------------------------------------------------------------

// Componente para cada item de serviço com animações - AGORA RECEBE BookingDetails (formato achatado)
const AnimatedServiceItem: React.FC<{
  item: BookingDetails; // AGORA RECEBE BookingDetails
  onPress: (item: BookingDetails) => void; // AGORA RECEBE BookingDetails
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const onPressOutItem = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  // Adaptação de getStatusStyle para BookingStatus do backend
  const getStatusStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        // PENDING_PROVIDER_CONFIRMATION foi removido do enum, então não referenciamos aqui.
        return { text: '#FF6F00', background: '#FFF3E0', icon: 'clock-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Pendente' };
      case BookingStatus.CONFIRMED:
        return { text: '#2E7D32', background: '#E8F5E9', icon: 'check-circle-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Confirmado' };
      case BookingStatus.COMPLETED:
        return { text: '#546E7A', background: '#ECEFF1', icon: 'check-all' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Concluído' };
      case BookingStatus.CANCELLED:
        return { text: '#D32F2F', background: '#FFEBEE', icon: 'close-circle-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Cancelado' };
      case BookingStatus.REJECTED:
        return { text: '#757575', background: '#F5F5F5', icon: 'minus-circle-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Recusado' };
      case BookingStatus.IN_PROGRESS: // IN_PROGRESS agora é reconhecido
        return { text: '#007AFF', background: '#E3F2FD', icon: 'sync-circle-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Em Progresso' };
      default:
        return { text: '#546E7A', background: '#ECEFF1', icon: 'information-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Desconhecido' };
    }
  };

  const statusStyle = getStatusStyle(item.status);

  return (
    <Animated.View
      style={[
        styles.serviceCardWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => onPress(item)}
        onPressIn={onPressInItem}
        onPressOut={onPressOutItem}
        activeOpacity={1}
        accessibilityLabel={`Detalhes do serviço de ${item.serviceName} para ${item.clientFullName}`} // CORRIGIDO
        accessibilityHint="Toque para ver mais informações sobre o serviço"
      >
        {item.clientAvatarUrl ? ( // CORRIGIDO
          <Image source={{ uri: item.clientAvatarUrl }} style={styles.clientAvatar} />
        ) : (
          <View style={styles.clientAvatarPlaceholder}>
            <Ionicons name="person" size={24} color="#FFF" />
          </View>
        )}
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceType} numberOfLines={1}>{item.serviceName}</Text> {/* CORRIGIDO */}
          <Text style={styles.clientName} numberOfLines={1}>Cliente: {item.clientFullName}</Text> {/* CORRIGIDO */}
          <Text style={styles.serviceDate}>
            <Ionicons name="calendar-outline" size={14} color="#6C757D" /> {formatDate(item.scheduledDate, { day: 'numeric', month: 'short' })}
            {item.scheduledTime && <Text> às {item.scheduledTime}</Text>}
          </Text>
          {item.totalPrice !== undefined && (
            <Text style={styles.servicePriceText}>
              <MaterialCommunityIcons name="currency-usd" size={14} color="#2E7D32" /> R$ {item.totalPrice.toFixed(2).replace('.', ',')}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}>
          <MaterialCommunityIcons name={statusStyle.icon} size={12} color={statusStyle.text} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.display}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={24} color="#C7C7CC" />
      </TouchableOpacity>
    </Animated.View>
  );
};


export default function ProviderServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<BookingDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'requests' | 'upcoming' | 'completed'>('requests');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // --- CORREÇÃO DE ERRO: MOVIDO loadServices PARA CIMA DO useEffect QUE O CHAMA ---
  const loadServices = useCallback(async (currentFilter: typeof filter, refreshing: boolean = false) => {
    if (!refreshing) setIsLoading(true);
    Animated.timing(contentAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(async () => {
      try {
        let data: BookingDetails[] = [];

        switch (currentFilter) {
          case 'requests':
            data = await getBookingsForUser(BookingStatus.PENDING);
            break;
          case 'upcoming':
            const confirmedBookings = await getBookingsForUser(BookingStatus.CONFIRMED);
            const now = new Date();
            data = confirmedBookings.filter(s => {
                const scheduledDateTime = new Date(`${s.scheduledDate}T${s.scheduledTime}`);
                return scheduledDateTime >= now;
            }).sort((a, b) => {
                const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime();
                const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime();
                return dateA - dateB;
            });
            break;
          case 'completed':
            const completed = await getBookingsForUser(BookingStatus.COMPLETED);
            const cancelled = await getBookingsForUser(BookingStatus.CANCELLED);
            const rejected = await getBookingsForUser(BookingStatus.REJECTED);
            data = [...completed, ...cancelled, ...rejected].sort((a, b) => {
                const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime();
                const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime();
                return dateB - dateA;
            });
            break;
          default:
            data = [];
            break;
        }

        setServices(data);
        if (refreshing) setToastMessage({ message: "Serviços atualizados!", type: "success" });
      } catch (err: any) {
        console.error("[ProviderServicesScreen] Erro ao buscar serviços:", err.response?.data || err.message);
        Alert.alert("Erro", err.response?.data?.message || "Não foi possível carregar seus serviços.");
        setToastMessage({ message: "Erro ao carregar serviços.", type: "error" });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [contentAnim]); // Removido 'filter' daqui e adicionado no useEffect do componente para gerenciar o re-fetch no setFilter


  // useEffect que chama loadServices - AGORA loadServices está definido acima
  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(filterAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    loadServices(filter);
  }, [filter, loadServices, headerAnim, filterAnim]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadServices(filter, true);
  }, [filter, loadServices]);

  const handleFilterChange = (newFilter: typeof filter) => {
    if (newFilter === filter) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFilter(newFilter);
  };

  const handleServicePress = (item: BookingDetails) => {
    router.push(`/(provider)/services/${item.id}` as any);
  };

  const getHeaderTitle = () => {
    switch (filter) {
      case 'requests': return 'Solicitações Pendentes';
      case 'upcoming': return 'Próximos Agendamentos';
      case 'completed': return 'Histórico de Serviços';
      default: return 'Meus Serviços';
    }
  };

  const EmptyListFeedback = () => {
    let title = "Nenhum serviço encontrado.";
    let subText = "Ajuste o filtro ou aguarde novas solicitações!";
    let ctaButton = null;

    if (filter === 'requests') {
      title = "Nenhuma solicitação pendente.";
      subText = "Configure seus serviços para receber mais pedidos ou verifique seus agendamentos confirmados.";
      ctaButton = (
        <TouchableOpacity style={styles.emptyStateButton} onPress={() => router.push('/(provider)/profile/edit-services' as any)}>
          <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
          <Text style={styles.emptyStateButtonText}>Configurar Meus Serviços</Text>
        </TouchableOpacity>
      );
    } else if (filter === 'upcoming') {
      title = "Nenhum agendamento futuro.";
      subText = "Que tal verificar novas solicitações ou gerenciar sua disponibilidade?";
      ctaButton = (
        <TouchableOpacity style={styles.emptyStateButton} onPress={() => router.push('/(provider)/availability' as any)}>
          <Ionicons name="time-outline" size={20} color="#FFFFFF" />
          <Text style={styles.emptyStateButtonText}>Gerenciar Disponibilidade</Text>
        </TouchableOpacity>
      );
    } else if (filter === 'completed') {
      title = "Seu histórico de serviços está vazio.";
      subText = "Comece a agendar e concluir serviços para vê-los aqui!";
    }

    return (
      <View style={styles.centeredFeedback}>
        <Ionicons name="clipboard-outline" size={64} color="#CED4DA" />
        <Text style={styles.emptyText}>{title}</Text>
        <Text style={styles.emptySubText}>{subText}</Text>
        {ctaButton}
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header with Glassmorphism */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <LinearGradient
          colors={['rgba(0,122,255,0.9)', 'rgba(0,122,255,0.7)']}
          style={StyleSheet.absoluteFill}
        />
        <BlurView
          intensity={Platform.OS === 'ios' ? 10 : 0}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(provider)/profile/edit-services' as any);
          }}
          style={styles.headerActionIcon}
          accessibilityLabel="Adicionar novo serviço"
          accessibilityHint="Toque para gerenciar os tipos de serviços que você oferece"
        >
          <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.filterContainer, { opacity: filterAnim, transform: [{ translateY: filterAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'requests' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('requests')}
          accessibilityLabel="Mostrar solicitações pendentes"
          accessibilityRole="button"
        >
          <Text style={[styles.filterButtonText, filter === 'requests' && styles.filterButtonTextActive]}>Solicitações</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('upcoming')}
          accessibilityLabel="Mostrar próximos agendamentos"
          accessibilityRole="button"
        >
          <Text style={[styles.filterButtonText, filter === 'upcoming' && styles.filterButtonTextActive]}>Próximos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('completed')}
          accessibilityLabel="Mostrar histórico de serviços"
          accessibilityRole="button"
        >
          <Text style={[styles.filterButtonText, filter === 'completed' && styles.filterButtonTextActive]}>Histórico</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.contentArea, { opacity: contentAnim }]}>
        {isLoading && !isRefreshing ? (
          <FlatList
            data={[...Array(5)]}
            renderItem={({ index }) => <ServiceItemSkeleton key={index} />}
            keyExtractor={(_, index) => `skeleton-${index}`}
            contentContainerStyle={styles.listContentContainer}
          />
        ) : services.length > 0 ? (
          <FlatList
            data={services}
            renderItem={({ item, index }) => (
              <AnimatedServiceItem
                item={item}
                onPress={handleServicePress}
                delay={index * 70}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContentContainer}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#007AFF"
              />
            }
          />
        ) : (
          <EmptyListFeedback />
        )}
      </Animated.View>

      {toastMessage && (
        <ToastMessage
          message={toastMessage.message}
          type={toastMessage.type}
          onHide={() => setToastMessage(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Neutro - Fundo de tela
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Azul Principal
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000', // Neutro - Preto
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF', // Neutro - Branco
    flex: 1,
    textAlign: 'center',
    zIndex: 1,
  },
  headerActionIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
    top: Platform.OS === 'ios' ? 47 : 17,
    zIndex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF', // Neutro - Branco
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF', // Neutro - Cinza claro
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF', // Azul Principal
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,122,255,0.3)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 4 },
      android: { elevation: 5 },
    }),
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C757D', // Neutro - Cinza
  },
  filterButtonTextActive: {
    color: '#FFFFFF', // Neutro - Branco
  },
  contentArea: {
    flex: 1,
    paddingTop: 10,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  serviceCardWrapper: {
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // Neutro - Branco
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.07)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF', // Neutro - Cinza claro
  },
  clientAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#007AFF', // Azul Principal
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceType: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#212529', // Neutro - Cinza escuro
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#495057', // Neutro - Cinza
    marginBottom: 4,
  },
  serviceDate: {
    fontSize: 13,
    color: '#6C757D', // Neutro - Cinza
  },
  servicePriceText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32', // Verde - Sucesso
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: 10,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  listSeparator: {
    height: 0,
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D', // Neutro - Cinza
    marginTop: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40', // Neutro - Cinza escuro
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6C757D', // Neutro - Cinza
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF', // Azul Principal
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,122,255,0.3)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 4 },
      android: { elevation: 5 },
    }),
  },
  emptyStateButtonText: {
    color: '#FFFFFF', // Neutro - Branco
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});