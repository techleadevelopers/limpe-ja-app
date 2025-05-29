// LimpeJaApp/app/(client)/bookings/[bookingId].tsx
import React, { useEffect, useState, useRef } from 'react';
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
    Animated, // Importar Animated para animações
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers'; // Supondo que você tenha essa função

// Definição de tipo para o placeholder (use seu tipo Booking real)
interface MockBooking {
  id: string;
  serviceName: string;
  providerName: string;
  providerId: string;
  providerImageUrl?: string;
  date: string; // ISO String
  time?: string; // HH:MM (pode ser extraído de 'date' ou ser um campo separado)
  status: 'Confirmado' | 'Pendente' | 'Concluído' | 'Cancelado'; // Exemplo de status
  address: string;
  notes?: string;
  price: string;
  reviewed?: boolean; // Para controlar se o botão de avaliar aparece
}

// Função mockada para simular a busca de detalhes do agendamento
const fetchBookingDetailsFromAPI = async (bookingId: string): Promise<MockBooking | null> => {
    console.log("[BookingDetailsScreen] Buscando detalhes para o agendamento:", bookingId);
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simula delay de rede

    // Dados mockados para diferentes IDs de agendamento ou cenários
    const mockBookings: MockBooking[] = [
        {
            id: 'book1',
            serviceName: 'Limpeza Residencial Completa',
            providerName: 'Ana Oliveira',
            providerId: 'provider1',
            providerImageUrl: 'https://via.placeholder.com/100/ADD8E6/000000?text=Ana+O',
            date: '2025-07-15T14:00:00Z',
            status: 'Confirmado',
            address: 'Rua das Palmeiras, 450, Apt 101, Bairro Sol Nascente, Campinas-SP',
            notes: 'Foco especial nos vidros da varanda e limpeza do forno. Tenho um gato persa muito tranquilo.',
            price: 'R$ 180,00',
            reviewed: false,
        },
        {
            id: 'book2',
            serviceName: 'Limpeza Comercial',
            providerName: 'Carlos Silva',
            providerId: 'provider2',
            providerImageUrl: 'https://via.placeholder.com/100/E0F7FA/000000?text=Carlos+S',
            date: '2025-07-01T09:00:00Z',
            status: 'Concluído',
            address: 'Av. Paulista, 1000, Conj. 505, Bela Vista, São Paulo-SP',
            notes: 'Limpeza de escritório pós-evento.',
            price: 'R$ 250,00',
            reviewed: false, // Pode ser true para testar o botão de avaliação
        },
        {
            id: 'book3',
            serviceName: 'Limpeza Pós-Obra',
            providerName: 'Mariana Costa',
            providerId: 'provider3',
            providerImageUrl: 'https://via.placeholder.com/100/B3E5FC/000000?text=Mariana+C',
            date: '2025-06-20T10:00:00Z',
            status: 'Cancelado',
            address: 'Rua das Flores, 123, Centro, Rio de Janeiro-RJ',
            notes: 'Obra atrasou, precisei cancelar.',
            price: 'R$ 300,00',
            reviewed: false,
        },
        {
            id: 'book4',
            serviceName: 'Limpeza de Vidros',
            providerName: 'Ana Oliveira',
            providerId: 'provider1',
            providerImageUrl: 'https://via.placeholder.com/100/ADD8E6/000000?text=Ana+O',
            date: '2025-07-25T13:00:00Z',
            status: 'Pendente',
            address: 'Av. Brasil, 500, Apt 202, Bairro Novo, Belo Horizonte-MG',
            notes: 'Janelas do apartamento e varanda.',
            price: 'R$ 100,00',
            reviewed: false,
        },
    ];

    const foundBooking = mockBookings.find(b => b.id === bookingId);
    return foundBooking || null;
};


export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  
  const [booking, setBooking] = useState<MockBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animações para os elementos da tela
  const providerSectionAnim = useRef(new Animated.Value(0)).current;
  const detailsCardAnim = useRef(new Animated.Value(0)).current;
  const actionsCardAnim = useRef(new Animated.Value(0)).current;

  // Animações para os botões de ação
  const cancelButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const contactButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const reviewButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const profileButtonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (bookingId) {
      setIsLoading(true);
      setError(null);
      fetchBookingDetailsFromAPI(bookingId)
        .then(data => {
          setBooking(data);
          if (!data) setError(`Agendamento com ID "${bookingId}" não encontrado.`);
        })
        .catch(err => {
          console.error("[BookingDetailsScreen] Erro ao buscar detalhes do agendamento:", err);
          setError(err.message || "Não foi possível carregar os detalhes do agendamento.");
        })
        .finally(() => {
          setIsLoading(false);
          // Inicia as animações de entrada dos elementos
          Animated.stagger(200, [
            Animated.timing(providerSectionAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(detailsCardAnim, { toValue: 1, duration: 700, delay: 100, useNativeDriver: true }),
            Animated.timing(actionsCardAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
          ]).start();
        });
    } else {
        setError("ID do agendamento não fornecido.");
        setIsLoading(false);
    }
  }, [bookingId, providerSectionAnim, detailsCardAnim, actionsCardAnim]);

  // Função para animar o botão ao pressionar
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
            console.log("[BookingDetailsScreen] Cancelando agendamento:", bookingId);
            setIsLoading(true);
            // TODO: Chamar clientService.cancelBooking(bookingId)
            setTimeout(() => { // Simulação
                Alert.alert("Sucesso (Simulado)", "Agendamento cancelado.");
                router.back();
                setIsLoading(false);
            }, 1000);
          },
          style: "destructive"
        }
      ]
    );
  };

  const getStatusStyle = (status: MockBooking['status']) => {
    switch (status) {
      case 'Confirmado':
        return { color: '#4CAF50', icon: 'checkmark-circle-outline' as const, badgeBg: '#E8F5E9' };
      case 'Pendente':
        return { color: '#FFC107', icon: 'time-outline' as const, badgeBg: '#FFF3E0' };
      case 'Concluído':
        return { color: '#007AFF', icon: 'flag-outline' as const, badgeBg: '#E3F2FD' };
      case 'Cancelado':
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
      
      {/* Seção do Prestador (Topo) com Animação */}
      <Animated.View style={[styles.card, styles.providerSectionCard, { opacity: providerSectionAnim, transform: [{ translateY: providerSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <View style={styles.providerSection}>
          {booking.providerImageUrl && 
            <Image source={{ uri: booking.providerImageUrl }} style={styles.providerImage} />
          }
          <View style={styles.providerInfo}>
            <Text style={styles.serviceNameText}>{booking.serviceName}</Text>
            <Text style={styles.providerNameText}>com {booking.providerName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.badgeBg }]}>
            <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{booking.status}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Detalhes do Agendamento com Animação */}
      <Animated.View style={[styles.card, { opacity: detailsCardAnim, transform: [{ scale: detailsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
        <Text style={styles.sectionTitle}>Detalhes do Agendamento</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.detailLabel}>Data e Hora:</Text>
          <Text style={styles.detailValue}>{formatDate(booking.date, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.detailLabel}>Endereço:</Text>
          <Text style={styles.detailValueAddress}>{booking.address}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.detailLabel}>Valor:</Text>
          <Text style={[styles.detailValue, styles.priceText]}>{booking.price}</Text>
        </View>

        {booking.notes && (
            <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={20} color="#555" style={styles.icon} />
                <Text style={styles.detailLabel}>Observações:</Text>
                <Text style={styles.detailValue}>{booking.notes}</Text>
            </View>
        )}
      </Animated.View>
      
      {/* Cartão de Ações com Animação */}
      <Animated.View style={[styles.actionsCard, { opacity: actionsCardAnim, transform: [{ scale: actionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
        <Text style={styles.sectionTitle}>Ações</Text>
        
        {booking.status === 'Confirmado' && (
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
            onPress={() => router.push(`/(client)/messages/${booking.providerId}?bookingId=${bookingId}&recipientName=${booking.providerName}`)}
            onPressIn={() => onPressInButton(contactButtonScaleAnim)}
            onPressOut={() => onPressOutButton(contactButtonScaleAnim)}
        >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Contatar {booking.providerName.split(' ')[0]}</Text>
        </TouchableOpacity>

        {booking.status === 'Concluído' && !booking.reviewed && (
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton, { transform: [{ scale: reviewButtonScaleAnim }] }]}
            onPress={() => router.push(`/(common)/feedback/${bookingId}?type=service&serviceName=${encodeURIComponent(booking.serviceName)}&providerName=${encodeURIComponent(booking.providerName)}`)}
            onPressIn={() => onPressInButton(reviewButtonScaleAnim)}
            onPressOut={() => onPressOutButton(reviewButtonScaleAnim)}
          >
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Avaliar Serviço</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
            style={[styles.actionButtonOutline, { transform: [{ scale: profileButtonScaleAnim }] }]}
            onPress={() => router.push(`/(client)/explore/${booking.providerId}`)}
            onPressIn={() => onPressInButton(profileButtonScaleAnim)}
            onPressOut={() => onPressOutButton(profileButtonScaleAnim)}
        >
            <Ionicons name="person-circle-outline" size={20} color="#007AFF" />
            <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Ver Perfil de {booking.providerName.split(' ')[0]}</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Um cinza bem claro para o fundo geral
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
    // Sombras aprimoradas para um efeito mais "flutuante"
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 5 }, // Sombra mais pronunciada
        shadowOpacity: 0.2, // Opacidade da sombra
        shadowRadius: 10, // Suavidade da sombra
      },
      android: {
        elevation: 6, // Elevação maior para Android
      },
    }),
  },
  providerSectionCard: { // Estilo específico para o card do provedor no topo
    paddingVertical: 20, // Mais padding vertical
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Espaça os itens
  },
  providerSection: { // Conteúdo interno do card do provedor
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Ocupa o espaço disponível
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2, // Borda mais grossa
    borderColor: '#007AFF', // Cor da borda
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
    alignItems: 'flex-start', // Para textos longos quebrarem linha corretamente
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
    marginTop: 2, // Pequeno ajuste para alinhar com o texto
  },
  detailLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
    marginRight: 5,
    width: 100, // Para alinhar os valores (opcional)
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    flex: 1, // Para quebrar linha se necessário
  },
  detailValueAddress: { // Estilo específico para endereço se precisar de mais espaço
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
    // Separado em um card próprio para ações
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 30, // Espaço no final da ScrollView
     ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14, // Aumenta o padding
    paddingHorizontal: 15,
    borderRadius: 10, // Mais arredondado
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
    backgroundColor: '#F44336', // Vermelho para cancelar
  },
  reviewButton: {
      backgroundColor: '#FF9500', // Laranja para avaliar
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
    borderWidth: 2, // Borda mais grossa
    borderColor: '#007AFF',
  },
  actionButtonOutlineText: {
      color: '#007AFF',
      marginLeft: 8,
  }
});