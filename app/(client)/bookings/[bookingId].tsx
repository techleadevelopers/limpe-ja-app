// LimpeJaApp/app/(client)/bookings/[bookingId].tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
    TouchableOpacity,
    Platform,
    Animated,
    Linking,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers';

// --- INTERFACE DE TIPAGEM REAL PARA BOOKING ---
export interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
  
  service: {
    id: string;
    name: string;
    description?: string;
    price: number;
    durationMinutes?: number;
  };

  provider: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };

  scheduledDateTime: string;
  
  address: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };

  notes?: string | null;
  totalPrice: number;
  
  isReviewed: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// --- FUNÇÕES DE SERVIÇO (MOCKADAS PARA EXEMPLO, SUBSTITUA PELAS REAIS) ---
const getBookingDetails = async (bookingId: string): Promise<Booking> => {
    console.log("[BookingService] Buscando detalhes para o agendamento:", bookingId);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const mockBookings: Booking[] = [
        {
            id: 'book1',
            service: { id: 'serv1', name: 'Limpeza Residencial Completa', price: 180.00 },
            provider: { id: 'provider1', fullName: 'Ana Oliveira', avatarUrl: 'https://via.placeholder.com/100/ADD8E6/000000?text=Ana+O' },
            scheduledDateTime: '2025-07-15T14:00:00Z',
            status: 'CONFIRMED',
            address: { street: 'Rua das Palmeiras', number: '450', complement: 'Apt 101', neighborhood: 'Sol Nascente', city: 'Campinas', state: 'SP', cep: '13000-000' },
            notes: 'Foco especial nos vidros da varanda e limpeza do forno. Tenho um gato persa muito tranquilo.',
            totalPrice: 180.00,
            isReviewed: false,
            createdAt: '2025-07-10T10:00:00Z', updatedAt: '2025-07-10T10:00:00Z'
        },
        {
            id: 'book2',
            service: { id: 'serv2', name: 'Limpeza Comercial', price: 250.00 },
            provider: { id: 'provider2', fullName: 'Carlos Silva', avatarUrl: 'https://via.placeholder.com/100/E0F7FA/000000?text=Carlos+S' },
            scheduledDateTime: '2025-07-01T09:00:00Z',
            status: 'COMPLETED',
            address: { street: 'Av. Paulista', number: '1000', complement: 'Conj. 505', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', cep: '01310-100' },
            notes: 'Limpeza de escritório pós-evento.',
            totalPrice: 250.00,
            isReviewed: false,
            createdAt: '2025-06-25T09:00:00Z', updatedAt: '2025-07-01T11:00:00Z'
        },
        {
            id: 'book3',
            service: { id: 'serv3', name: 'Limpeza Pós-Obra', price: 300.00 },
            provider: { id: 'provider3', fullName: 'Mariana Costa', avatarUrl: 'https://via.placeholder.com/100/B3E5FC/000000?text=Mariana+C' },
            scheduledDateTime: '2025-06-20T10:00:00Z',
            status: 'CANCELED',
            address: { street: 'Rua das Flores', number: '123', neighborhood: 'Centro', city: 'Rio de Janeiro', state: 'RJ', cep: '20000-000' },
            notes: 'Obra atrasou, precisei cancelar.',
            totalPrice: 300.00,
            isReviewed: false,
            createdAt: '2025-06-15T10:00:00Z', updatedAt: '2025-06-18T10:00:00Z'
        },
    ];

    const foundBooking = mockBookings.find(b => b.id === bookingId);
    if (!foundBooking) {
        throw new Error(`Agendamento com ID "${bookingId}" não encontrado.`);
    }
    return foundBooking;
};

const cancelBooking = async (bookingId: string): Promise<void> => {
    console.log("[BookingService] Cancelando agendamento:", bookingId);
    await new Promise(resolve => setTimeout(resolve, 800));
};
// --- FIM DAS FUNÇÕES DE SERVIÇO (MOCKADAS) ---


export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const providerSectionAnim = useRef(new Animated.Value(0)).current;
  const detailsCardAnim = useRef(new Animated.Value(0)).current;
  const actionsCardAnim = useRef(new Animated.Value(0)).current;

  const cancelButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const contactButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const reviewButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const profileButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
        setError("ID do agendamento não fornecido.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBookingDetails(bookingId);
      setBooking(data);
      Animated.stagger(200, [
        Animated.timing(providerSectionAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(detailsCardAnim, { toValue: 1, duration: 700, delay: 100, useNativeDriver: true }),
        Animated.timing(actionsCardAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
      ]).start();
    } catch (err: any) {
      console.error("[BookingDetailsScreen] Erro ao buscar detalhes do agendamento:", err);
      setError(err.message || "Não foi possível carregar os detalhes do agendamento.");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, providerSectionAnim, detailsCardAnim, actionsCardAnim]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const onPressInButton = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutButton = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    Alert.alert(
      "Cancelar Agendamento",
      "Tem certeza que deseja cancelar este agendamento? Esta ação pode estar sujeita a taxas dependendo da política de cancelamento.",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Cancelar",
          onPress: async () => {
            console.log("[BookingDetailsScreen] Cancelando agendamento:", booking.id);
            setIsLoading(true);
            try {
                await cancelBooking(booking.id);
                Alert.alert("Sucesso", "Agendamento cancelado com sucesso!");
                setBooking(prev => prev ? { ...prev, status: 'CANCELED' } : null);
            } catch (err: any) {
                console.error("[BookingDetailsScreen] Erro ao cancelar agendamento:", err);
                Alert.alert("Erro", err.message || "Não foi possível cancelar o agendamento.");
            } finally {
                setIsLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleContactProvider = () => {
    if (!booking) return;
    router.push({
      pathname: '/(client)/messages',
      params: {
        providerId: booking.provider.id,
        bookingId: booking.id,
        recipientName: booking.provider.fullName,
      },
    });
  };

  const handleReviewService = () => {
    if (!booking) return;
    router.push({
      // CORREÇÃO: Usar [targetId] no pathname e passar booking.id como targetId
      pathname: '/(common)/feedback/[targetId]', 
      params: {
        targetId: booking.id, // Passa o ID do agendamento como targetId
        type: 'service',
        serviceName: booking.service.name,
        providerName: booking.provider.fullName,
        providerId: booking.provider.id,
      },
    });
  };

  const handleViewProviderProfile = () => {
    if (!booking) return;
    router.push({
      pathname: '/(client)/explore/[providerId]',
      params: {
        providerId: booking.provider.id,
      },
    });
  };

  const getStatusStyle = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return { color: '#4CAF50', icon: 'checkmark-circle-outline' as const, badgeBg: '#E8F5E9' };
      case 'PENDING':
        return { color: '#FFC107', icon: 'time-outline' as const, badgeBg: '#FFF3E0' };
      case 'COMPLETED':
        return { color: '#007AFF', icon: 'flag-outline' as const, badgeBg: '#E3F2FD' };
      case 'CANCELED':
        return { color: '#F44336', icon: 'close-circle-outline' as const, badgeBg: '#FFEBEE' };
      default:
        return { color: '#888', icon: 'help-circle-outline' as const, badgeBg: '#ECEFF1' };
    }
  };


  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Carregando..." }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando detalhes do agendamento...</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Erro" }} />
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error || `Agendamento "${bookingId}" não encontrado.`}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const statusInfo = getStatusStyle(booking.status);

  return (
    <ScrollView style={styles.scrollViewContainer}>
      <Stack.Screen options={{ title: `Detalhes do Serviço` }} />
      
      <Animated.View style={[styles.card, styles.providerSectionCard, { opacity: providerSectionAnim, transform: [{ translateY: providerSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <View style={styles.providerSection}>
          {booking.provider.avatarUrl && 
            <Image source={{ uri: booking.provider.avatarUrl }} style={styles.providerImage} />
          }
          <View style={styles.providerInfo}>
            <Text style={styles.serviceNameText}>{booking.service.name}</Text>
            <Text style={styles.providerNameText}>com {booking.provider.fullName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.badgeBg }]}>
            <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{booking.status}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.card, { opacity: detailsCardAnim, transform: [{ scale: detailsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
        <Text style={styles.sectionTitle}>Detalhes do Agendamento</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.detailLabel}>Data e Hora:</Text>
          <Text style={styles.detailValue}>{formatDate(booking.scheduledDateTime, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.detailLabel}>Endereço:</Text>
          <Text style={styles.detailValueAddress}>
            {`${booking.address.street}, ${booking.address.number}`}
            {booking.address.complement ? `, ${booking.address.complement}` : ''}
            {`\n${booking.address.neighborhood}, ${booking.address.city}-${booking.address.state}`}
            {`\nCEP: ${booking.address.cep}`}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.detailLabel}>Valor:</Text>
          <Text style={[styles.detailValue, styles.priceText]}>{`R$ ${booking.totalPrice.toFixed(2).replace('.', ',')}`}</Text>
        </View>

        {booking.notes && (
            <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={20} color="#555" style={styles.icon} />
                <Text style={styles.detailLabel}>Observações:</Text>
                <Text style={styles.detailValue}>{booking.notes}</Text>
            </View>
        )}
      </Animated.View>
      
      <Animated.View style={[styles.actionsCard, { opacity: actionsCardAnim, transform: [{ scale: actionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
        <Text style={styles.sectionTitle}>Ações</Text>
        
        {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
            <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton, { transform: [{ scale: cancelButtonScaleAnim }] }]}
                onPress={handleCancelBooking}
                onPressIn={() => onPressInButton(cancelButtonScaleAnim)}
                onPressOut={() => onPressOutButton(cancelButtonScaleAnim)}
            >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Cancelar Agendamento</Text>
            </TouchableOpacity>
        )}
        
        <TouchableOpacity
            style={[styles.actionButton, { transform: [{ scale: contactButtonScaleAnim }] }]}
            onPress={handleContactProvider}
            onPressIn={() => onPressInButton(contactButtonScaleAnim)}
            onPressOut={() => onPressOutButton(contactButtonScaleAnim)}
        >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Contatar {booking.provider.fullName.split(' ')[0]}</Text>
        </TouchableOpacity>

        {booking.status === 'COMPLETED' && !booking.isReviewed && (
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton, { transform: [{ scale: reviewButtonScaleAnim }] }]}
            onPress={handleReviewService}
            onPressIn={() => onPressInButton(reviewButtonScaleAnim)}
            onPressOut={() => onPressOutButton(reviewButtonScaleAnim)}
          >
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Avaliar Serviço</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
            style={[styles.actionButtonOutline, { transform: [{ scale: profileButtonScaleAnim }] }]}
            onPress={handleViewProviderProfile}
            onPressIn={() => onPressInButton(profileButtonScaleAnim)}
            onPressOut={() => onPressOutButton(profileButtonScaleAnim)}
        >
            <Ionicons name="person-circle-outline" size={20} color="#007AFF" />
            <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Ver Perfil de {booking.provider.fullName.split(' ')[0]}</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 15,
    marginTop: 15,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  providerSectionCard: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  providerInfo: {
    flex: 1,
  },
  serviceNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 2,
  },
  providerNameText: {
    fontSize: 16,
    color: '#555',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
    marginRight: 5,
    width: 100,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  detailValueAddress: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  priceText: {
      fontWeight: 'bold',
      color: '#007AFF'
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 30,
     ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  reviewButton: {
      backgroundColor: '#FF9500',
  },
  actionButtonOutline: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  actionButtonOutlineText: {
      color: '#007AFF',
      marginLeft: 8,
  }
});