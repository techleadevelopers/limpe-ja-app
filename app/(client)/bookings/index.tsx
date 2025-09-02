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
            case BookingStatus.CONFIRMED: return { text: '#28A745', background: '#D4EDDA', icon: 'checkmark-circle-outline' as const, iconColor: '#28A745' }; // Green
            case BookingStatus.PENDING: return { text: '#FFC107', background: '#FFF3CD', icon: 'time-outline' as const, iconColor: '#FFC107' }; // Yellow/Orange
            case BookingStatus.PENDING_PROVIDER_CONFIRMATION: return { text: '#FFC107', background: '#FFF3CD', icon: 'hourglass-outline' as const, iconColor: '#FFC107' }; // Yellow/Orange
            case BookingStatus.IN_PROGRESS: return { text: '#007BFF', background: '#CCE5FF', icon: 'sync-circle-outline' as const, iconColor: '#007BFF' }; // Blue
            case BookingStatus.COMPLETED: return { text: '#6C757D', background: '#E2E3E5', icon: 'flag-outline' as const, iconColor: '#6C757D' }; // Muted Grey
            case BookingStatus.CANCELLED: return { text: '#DC3545', background: '#F8D7DA', icon: 'close-circle-outline' as const, iconColor: '#DC3545' }; // Red // Corrigido CANCELED para CANCELLED
            case BookingStatus.REJECTED: return { text: '#6C757D', background: '#E2E3E5', icon: 'alert-circle-outline' as const, iconColor: '#6C757D' }; // Muted Grey
            case BookingStatus.RESCHEDULED: return { text: '#6F42C1', background: '#EAE6F3', icon: 'sync-outline' as const, iconColor: '#6F42C1' }; // Purple
            case BookingStatus.NO_SHOW: return { text: '#343A40', background: '#D6D8D9', icon: 'person-remove-outline' as const, iconColor: '#343A40' }; // Dark Grey/Black
            default: return { text: '#6C757D', background: '#E2E3E5', icon: 'help-circle-outline' as const, iconColor: '#6C757D' };
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
                            {formatDate(new Date(`${item.scheduledDate}T${item.scheduledTime}`), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} {/* Corrigido scheduledDateTime para scheduledDate e scheduledTime */}
                        </Text>
                        {item.address && (
                            <Text style={styles.itemAddressText} numberOfLines={1}>
                                <Ionicons name="location-outline" size={14} color="#6C757D" /> {formattedAddress}
                            </Text>
                        )}
                        {item.totalPrice !== undefined && (
                            <Text style={styles.itemPriceText}>
                                <MaterialCommunityIcons name="currency-usd" size={14} color="#28A745" /> R$ {item.totalPrice.toFixed(2).replace('.', ',')}
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
                const pendingProvider = await getBookingsForUser(BookingStatus.PENDING_PROVIDER_CONFIRMATION); // Agora reconhecido
                const pendingClient = await getBookingsForUser(BookingStatus.PENDING);
                fetchedBookings = [...pendingProvider, ...pendingClient].filter(b => new Date(`${b.scheduledDate}T${b.scheduledTime}`) >= new Date()); // Ajuste na data
            } else if (currentFilter === 'upcoming') {
                const confirmed = await getBookingsForUser(BookingStatus.CONFIRMED);
                const inProgress = await getBookingsForUser(BookingStatus.IN_PROGRESS);
                fetchedBookings = [...confirmed, ...inProgress].filter(b => new Date(`${b.scheduledDate}T${b.scheduledTime}`) >= new Date()); // Ajuste na data
            } else if (currentFilter === 'completed') {
                const completed = await getBookingsForUser(BookingStatus.COMPLETED);
                fetchedBookings = [...completed].filter(b => new Date(`${b.scheduledDate}T${b.scheduledTime}`) < new Date()); // Ajuste na data
            } else if (currentFilter === 'cancelled') {
                const canceled = await getBookingsForUser(BookingStatus.CANCELLED); // Corrigido CANCELED para CANCELLED
                const rejected = await getBookingsForUser(BookingStatus.REJECTED);
                fetchedBookings = [...canceled, ...rejected];
            }
            
            // Note: O filtro de data para 'completed' e 'upcoming' deve ser feito no backend idealmente
            // ou ser mais robusto aqui, considerando que getBookingsForUser pode retornar todos os bookings de um status.
            // A lógica atual de filtro de data em 'upcoming' e 'completed' pode não ser perfeita
            // se o backend não filtrar por data.

            fetchedBookings.sort((a, b) => new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime() - new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime()); // Ajuste na data

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
                    <ActivityIndicator size="large" color="#007BFF" />
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
                            tintColor="#007BFF"
                            title="Atualizando agendamentos..."
                            titleColor="#007BFF"
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
    backgroundColor: '#F8F9FA', // Light background
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF', // Lighter border
    ...Platform.select({
        ios: { 
            shadowColor: 'rgba(0,0,0,0.08)', // More pronounced shadow
            shadowOffset: { width: 0, height: 4 }, 
            shadowOpacity: 0.2, 
            shadowRadius: 6 
        },
        android: { elevation: 4 }, // Increased elevation
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
    backgroundColor: '#E9ECEF', // Lighter default background
    borderWidth: 1,
    borderColor: '#DEE2E6'
  },
  filterButtonActive: {
    backgroundColor: '#007BFF', // Primary blue
    borderColor: '#007BFF',
    ...Platform.select({
        ios: { 
            shadowColor: 'rgba(0,123,255,0.4)', // Blue shadow for active
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.6, 
            shadowRadius: 4 
        },
        android: { elevation: 6 }, // More elevation for active
    }),
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
    overflow: 'hidden', // Ensures content stays within rounded corners
    ...Platform.select({
        ios: { 
            shadowColor: 'rgba(0,0,0,0.1)', // Softer, more diffuse shadow
            shadowOffset: { width: 0, height: 6 }, 
            shadowOpacity: 0.3, 
            shadowRadius: 10 
        },
        android: { elevation: 8 }, // Increased elevation for depth
    }),
  },
  itemCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  itemProviderImage: {
    width: 55, // Slightly larger
    height: 55, // Slightly larger
    borderRadius: 27.5, // Perfect circle
    marginRight: 15,
    backgroundColor: '#F8F9FA', // Match container background
    borderWidth: 2, // More prominent border
    borderColor: '#E9ECEF', // Light border
  },
  itemIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 15,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  itemDetails: {
    flex: 1,
  },
  itemServiceName: {
    fontSize: 17, // Slightly larger
    fontWeight: '700', // Bolder
    color: '#343A40', // Darker text for prominence
    marginBottom: 4,
  },
  itemProviderName: {
    fontSize: 14,
    color: '#6C757D', // Softer color
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
    fontSize: 15, // Slightly larger
    fontWeight: 'bold',
    color: '#28A745', // Success green
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 6, // More padding
    paddingHorizontal: 12, // More padding
    borderRadius: 20, // More rounded
    marginLeft: 10,
    alignSelf: 'flex-start', // Align to top of its container
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.7, // Slightly more spacing
  },
  itemChevron: {
    marginLeft: 8,
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 20, // Larger
    fontWeight: '700', // Bolder
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
    backgroundColor: '#007BFF', // Primary blue
    paddingVertical: 12, // More padding
    paddingHorizontal: 25, // More padding
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: { 
        shadowColor: 'rgba(0,123,255,0.4)', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.6, 
        shadowRadius: 8 
      },
      android: { elevation: 6 },
    }),
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  exploreButton: {
      backgroundColor: '#28A745', // Success green
      paddingVertical: 14, // More padding
      paddingHorizontal: 35, // More padding
      borderRadius: 30, // More rounded
      marginTop: 15,
      ...Platform.select({
        ios: { 
          shadowColor: 'rgba(40,167,69,0.4)', 
          shadowOffset: { width: 0, height: 4 }, 
          shadowOpacity: 0.6, 
          shadowRadius: 8 
        },
        android: { elevation: 6 },
      }),
  },
  exploreButtonText: {
      color: '#FFFFFF',
      fontSize: 17, // Larger
      fontWeight: '700', // Bolder
  }
});