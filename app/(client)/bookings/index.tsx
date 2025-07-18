// LimpeJaApp/app/(client)/bookings/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link, Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatDate } from '../../../utils/helpers';

// CORREÇÃO: Importar BookingDetails e BookingStatus
import { useAuth } from '../../../hooks/useAuth';
import { getBookingsForUser } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';

// DEFINE O TIPO DE FILTRO GLOBALMENTE PARA CONSISTÊNCIA
type FilterType = 'requests' | 'upcoming' | 'completed' | 'cancelled';

// Componente para um item da lista de agendamentos com animação de entrada
const AnimatedBookingItem: React.FC<{ item: BookingDetails; index: number }> = ({ item, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 80,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, index]);

    // Mapeia os status do backend para estilos de exibição no frontend
    const getStatusStyle = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.CONFIRMED: return { text: '#388E3C', background: '#E8F5E9', icon: 'checkmark-circle-outline' as const, iconColor: '#4CAF50' };
            case BookingStatus.PENDING: return { text: '#FFA000', background: '#FFF3E0', icon: 'time-outline' as const, iconColor: '#FF9800' };
            // >>> CORREÇÃO AQUI (lin ha 58 no erro original): Usar o nome correto do enum <<<
            case BookingStatus.PENDING_PROVIDER_CONFIRMATION: return { text: '#FF6F00', background: '#FFF3E0', icon: 'hourglass-outline' as const, iconColor: '#FF6F00' };
            case BookingStatus.IN_PROGRESS: return { text: '#007AFF', background: '#E3F2FD', icon: 'sync-circle-outline' as const, iconColor: '#007AFF' };
            case BookingStatus.COMPLETED: return { text: '#007AFF', background: '#E3F2FD', icon: 'flag-outline' as const, iconColor: '#007AFF' };
            // >>> CORREÇÃO AQUI (lin ha 61 no erro original): Usar CANCELLED (dois L's) <<<
            case BookingStatus.CANCELLED: return { text: '#D32F2F', background: '#FFEBEE', icon: 'close-circle-outline' as const, iconColor: '#F44336' }; 
            case BookingStatus.REJECTED: return { text: '#757575', background: '#F5F5F5', icon: 'alert-circle-outline' as const, iconColor: '#757575' };
            case BookingStatus.RESCHEDULED: return { text: '#6A1B9A', background: '#EDE7F6', icon: 'sync-outline' as const, iconColor: '#6A1B9A' };
            default: return { text: '#546E7A', background: '#ECEFF1', icon: 'help-circle-outline' as const, iconColor: '#757575' };
        }
    };

    const statusInfo = getStatusStyle(item.status);
    const providerAvatarSource = item.providerAvatarUrl ? { uri: item.providerAvatarUrl } : require('../../../assets/images/default-avatar.png');

    const formattedAddress = item.address ?
        `${item.address.street}, ${item.address.number}` +
        `${item.address.complement ? ` - ${item.address.complement}` : ''}` +
        `, ${item.address.neighborhood}, ${item.address.city} - ${item.address.state}`
        : 'Endereço não disponível';


    return (
        <Animated.View style={[styles.itemCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Link href={`/(client)/bookings/${item.id}`} asChild>
                <TouchableOpacity style={styles.itemCardContent}>
                    {item.providerAvatarUrl ? (
                        <Image source={providerAvatarSource} style={styles.itemProviderImage} />
                    ) : (
                        <View style={styles.itemIconContainer}>
                            <Ionicons name={statusInfo.icon} size={28} color={statusInfo.iconColor} />
                        </View>
                    )}
                    <View style={styles.itemDetails}>
                        <Text style={styles.itemServiceName} numberOfLines={1}>{item.serviceName}</Text>
                        <Text style={styles.itemProviderName}>Com: {item.providerFullName}</Text>
                        <Text style={styles.itemDate}>
                            <Ionicons name="calendar-outline" size={14} color="#6C757D" />{' '}
                            {formatDate(item.scheduledDateTime, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {item.address && (
                            <Text style={styles.itemAddressText} numberOfLines={1}>
                                <Ionicons name="location-outline" size={14} color="#6C757D" /> {formattedAddress}
                            </Text>
                        )}
                        {item.totalPrice !== undefined && (
                            <Text style={styles.itemPriceText}>
                                <MaterialCommunityIcons name="currency-usd" size={14} color="#2E7D32" /> R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                            </Text>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.background }]}>
                        <Text style={[styles.statusText, { color: statusInfo.text }]}>{item.status}</Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={22} color="#B0BEC5" style={styles.itemChevron} />
                </TouchableOpacity>
            </Link>
        </Animated.View>
    );
};


export default function MyBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('upcoming');

  const filters: Array<{ label: string; value: FilterType; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: 'Solicitações', value: 'requests', icon: 'hourglass-outline' },
    { label: 'Próximos', value: 'upcoming', icon: 'calendar-outline' },
    { label: 'Histórico', value: 'completed', icon: 'checkmark-done-outline' },
    { label: 'Cancelados', value: 'cancelled', icon: 'close-circle-outline' },
  ];

  const filterButtonAnims = useRef(filters.map(() => new Animated.Value(1))).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const onPressInFilterButton = useCallback((index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(filterButtonAnims[index], {
          toValue: 0.9,
          useNativeDriver: true,
      }).start();
  }, [filterButtonAnims]);

  const onPressOutFilterButton = useCallback((index: number) => {
      Animated.spring(filterButtonAnims[index], {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
      }).start();
  }, [filterButtonAnims]);


  // Função para buscar agendamentos reais do backend
  const loadBookings = useCallback(async (currentFilter: FilterType, refreshing: boolean = false) => {
    if (!refreshing) setIsLoading(true);
    setBookings([]);
    if (!user?.id) {
        console.warn("[MyBookingsScreen] User ID ausente, não foi possível carregar agendamentos.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
    }

    Animated.timing(contentAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
    }).start(async () => {
        try {
            let fetchedBookings: BookingDetails[] = [];
            
            // Mapear os filtros do frontend para os status do backend
            if (currentFilter === 'requests') {
                // >>> CORREÇÃO AQUI (linha 179 no erro original) <<<
                const pendingProvider = await getBookingsForUser(BookingStatus.PENDING_PROVIDER_CONFIRMATION);
                const pendingClient = await getBookingsForUser(BookingStatus.PENDING);
                fetchedBookings = [...pendingProvider, ...pendingClient].filter(b => new Date(b.scheduledDateTime) >= new Date());
            } else if (currentFilter === 'upcoming') {
                const confirmed = await getBookingsForUser(BookingStatus.CONFIRMED);
                const inProgress = await getBookingsForUser(BookingStatus.IN_PROGRESS);
                fetchedBookings = [...confirmed, ...inProgress].filter(b => new Date(b.scheduledDateTime) >= new Date());
            } else if (currentFilter === 'completed') {
                const completed = await getBookingsForUser(BookingStatus.COMPLETED);
                fetchedBookings = [...completed].filter(b => new Date(b.scheduledDateTime) < new Date());
            } else if (currentFilter === 'cancelled') {
                // >>> CORREÇÃO AQUI (linha 193 no erro original) <<<
                const cancelled = await getBookingsForUser(BookingStatus.CANCELLED); // CANCELED para CANCELLED
                const rejected = await getBookingsForUser(BookingStatus.REJECTED);
                fetchedBookings = [...cancelled, ...rejected];
            }
            
            // Note: O filtro de data para 'completed' e 'upcoming' deve ser feito no backend idealmente
            // ou ser mais robusto aqui, considerando que getBookingsForUser pode retornar todos os bookings de um status.
            // A lógica atual de filtro de data em 'upcoming' e 'completed' pode não ser perfeita
            // se o backend não filtrar por data.

            fetchedBookings.sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime());

            setBookings(fetchedBookings);
            if (refreshing) Alert.alert("Sucesso", "Agendamentos atualizados!");

        } catch (err: any) {
            console.error("Erro ao buscar agendamentos:", err.response?.data || err.message);
            Alert.alert("Erro", err.response?.data?.message || "Não foi possível carregar seus agendamentos.");
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


  }, [activeFilter, user?.id, contentAnim]);

  useEffect(() => {
    loadBookings(activeFilter);
  }, [activeFilter, loadBookings]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadBookings(activeFilter, true);
    }, [activeFilter, loadBookings]);

    const handleFilterChange = (newFilter: FilterType) => {
        if (newFilter === activeFilter) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActiveFilter(newFilter);
    };

    const handleServicePress = (item: BookingDetails) => {
        router.push(`/(client)/bookings/${item.id}` as any);
    };

    const getHeaderTitle = () => {
        return "Meus Agendamentos";
    };

    const EmptyListFeedback = () => {
        let title = "Nenhum agendamento encontrado.";
        let subText = "Ajuste o filtro ou verifique mais tarde.";
        let ctaButton = null;

        if (activeFilter === 'requests') {
            title = "Nenhuma solicitação de agendamento.";
            subText = "Parece que você não fez nenhum pedido pendente ainda.";
            ctaButton = (
                <TouchableOpacity style={styles.emptyStateButton} onPress={() => router.push('/(client)/explore/todas-categorias' as any)}>
                    <Ionicons name="search-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.emptyStateButtonText}>Explorar Categorias</Text>
                </TouchableOpacity>
            );
        } else if (activeFilter === 'upcoming') {
            title = "Você não tem serviços futuros agendados.";
            subText = "Explore e agende novos serviços para vê-los aqui!";
            ctaButton = (
                <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(client)/explore' as any)}>
                    <Text style={styles.exploreButtonText}>Explorar Serviços</Text>
                </TouchableOpacity>
            );
        } else if (activeFilter === 'completed') {
            title = "Seu histórico de serviços está vazio.";
            subText = "Comece a agendar e concluir serviços para vê-los aqui!";
        } else if (activeFilter === 'cancelled') {
            title = "Nenhum serviço cancelado.";
            subText = "Serviços cancelados ou recusados aparecerão aqui.";
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
            <Stack.Screen options={{ title: 'Meus Agendamentos' }} />
            
            <View style={styles.filterContainer}>
                {filters.map((filterItem, index) => (
                    <Animated.View key={filterItem.value} style={{ transform: [{ scale: filterButtonAnims[index] }] }}>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                activeFilter === filterItem.value && styles.filterButtonActive
                            ]}
                            onPress={() => handleFilterChange(filterItem.value)}
                            onPressIn={() => onPressInFilterButton(index)}
                            onPressOut={() => onPressOutFilterButton(index)}
                        >
                            <Ionicons
                                name={filterItem.icon}
                                size={18}
                                color={activeFilter === filterItem.value ? '#FFFFFF' : '#495057'}
                                style={styles.filterIcon}
                            />
                            <Text style={[
                                styles.filterButtonText,
                                activeFilter === filterItem.value && styles.filterButtonTextActive
                            ]}>
                                {filterItem.label}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>

            {isLoading && bookings.length === 0 ? (
                <View style={styles.centeredFeedback}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Carregando agendamentos...</Text>
                </View>
            ) : bookings.length > 0 ? (
                <FlatList
                    data={bookings}
                    renderItem={({ item, index }) => <AnimatedBookingItem item={item} index={index} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor="#007AFF"
                            title="Atualizando agendamentos..."
                            titleColor="#007AFF"
                        />
                    }
                />
            ) : (
                <EmptyListFeedback />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 3 },
        android: { elevation: 2 },
    }),
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 25,
    marginHorizontal: 5,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#DEE2E6'
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContentContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 6 },
        android: { elevation: 3 },
    }),
  },
  itemCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  itemProviderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E9ECEF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemDetails: {
    flex: 1,
  },
  itemServiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  itemProviderName: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 6,
  },
  itemDate: {
    fontSize: 13,
    color: '#6C757D',
  },
  itemAddressText: {
    fontSize: 13,
    color: '#6C757D',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: 10,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemChevron: {
    marginLeft: 8,
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
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
      marginBottom: 25,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  exploreButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 25,
      marginTop: 15,
  },
  exploreButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
  }
});