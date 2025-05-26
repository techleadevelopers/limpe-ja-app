// LimpeJaApp/app/(client)/bookings/[bookingId].tsx
import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    Button, // Vamos usar TouchableOpacity para botões customizados
    Alert,
    ScrollView,
    Image,
    TouchableOpacity, // Para botões customizados
    Platform
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Para ícones
// import { getBookingDetails, cancelBooking } from '../../../services/clientService'; // A ser criada
// import { Booking, User } from '../../../src/types'; // Importe seus tipos reais
import { formatDate } from '../../../utils/helpers'; // Supondo que você tenha essa função

// Definição de tipo para o placeholder (use seu tipo Booking real)
interface MockBooking {
  id: string;
  serviceName: string;
  providerName: string;
  providerId: string;
  providerImageUrl?: string; // Adicionado para imagem do prestador
  date: string; // ISO String
  time?: string; // HH:MM (pode ser extraído de 'date' ou ser um campo separado)
  status: 'Confirmado' | 'Pendente' | 'Concluído' | 'Cancelado'; // Exemplo de status
  address: string;
  notes?: string;
  price: string;
  reviewed?: boolean; // Para controlar se o botão de avaliar aparece
}


export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  
  const [booking, setBooking] = useState<MockBooking | null>(null); // Usando MockBooking
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      console.log("[BookingDetailsScreen] Carregando detalhes para o agendamento:", bookingId);
      setIsLoading(true);
      setError(null);
      // TODO: Chamar clientService para buscar detalhes do agendamento
      // const fetchDetails = async () => { ... };
      // fetchDetails();

      // Simulação com mais detalhes
      setTimeout(() => {
        // Encontre ou defina o mock com base no bookingId se tiver vários mocks
        const mockData: MockBooking = {
          id: bookingId,
          serviceName: 'Limpeza Residencial Completa',
          providerName: 'Ana Oliveira',
          providerId: 'provider1', // ID real do prestador
          providerImageUrl: 'https://via.placeholder.com/100/ADD8E6/000000?text=Ana+O',
          date: '2025-07-15T14:00:00Z', // Data e Hora Agendada
          status: 'Confirmado',
          address: 'Rua das Palmeiras, 450, Apt 101, Bairro Sol Nascente, Campinas-SP',
          notes: 'Foco especial nos vidros da varanda e limpeza do forno. Tenho um gato persa muito tranquilo.',
          price: 'R$ 180,00',
          reviewed: false,
        };
        if (bookingId === "outroIdDeTeste") { // Exemplo se você quiser testar diferentes status
            // mockData.status = "Concluído";
            // mockData.reviewed = true;
        }
        setBooking(mockData);
        setIsLoading(false);
      }, 1200);
    } else {
        setError("ID do agendamento não fornecido.");
        setIsLoading(false);
    }
  }, [bookingId]);

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
            setIsLoading(true); // Para feedback visual
            // TODO: Chamar clientService.cancelBooking(bookingId)
            // try {
            //   await cancelBooking(bookingId);
            //   Alert.alert("Sucesso", "Agendamento cancelado.");
            //   router.back(); 
            // } catch (error: any) {
            //   Alert.alert("Erro", error.message || "Não foi possível cancelar.");
            // } finally {
            //    setIsLoading(false);
            // }
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
        return { color: '#4CAF50', icon: 'checkmark-circle-outline' as const };
      case 'Pendente':
        return { color: '#FFC107', icon: 'time-outline' as const };
      case 'Concluído':
        return { color: '#007AFF', icon: 'flag-outline' as const };
      case 'Cancelado':
        return { color: '#F44336', icon: 'close-circle-outline' as const };
      default:
        return { color: '#888', icon: 'help-circle-outline' as const };
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
      
      <View style={styles.card}>
        <View style={styles.providerSection}>
          {booking.providerImageUrl && 
            <Image source={{ uri: booking.providerImageUrl }} style={styles.providerImage} />
          }
          <View style={styles.providerInfo}>
            <Text style={styles.serviceNameText}>{booking.serviceName}</Text>
            <Text style={styles.providerNameText}>com {booking.providerName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Detalhes do Agendamento</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.detailLabel}>Data e Hora:</Text>
          <Text style={styles.detailValue}>{formatDate(booking.date, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} style={styles.icon} />
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, { color: statusInfo.color, fontWeight: 'bold' }]}>{booking.status}</Text>
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
      </View>
      
      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Ações</Text>
        {booking.status === 'Confirmado' && (
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelBooking}>
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Cancelar Agendamento</Text>
            </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/(client)/messages/${booking.providerId}?bookingId=${bookingId}&recipientName=${booking.providerName}`)}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Contatar {booking.providerName.split(' ')[0]}</Text>
        </TouchableOpacity>

        {booking.status === 'Concluído' && !booking.reviewed && (
          <TouchableOpacity style={[styles.actionButton, styles.reviewButton]} onPress={() => router.push(`/(common)/feedback/${bookingId}?type=service&serviceName=${encodeURIComponent(booking.serviceName)}&providerName=${encodeURIComponent(booking.providerName)}`)}>
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Avaliar Serviço</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButtonOutline} onPress={() => router.push(`/(client)/explore/${booking.providerId}`)}>
            <Ionicons name="person-circle-outline" size={20} color="#007AFF" />
            <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Ver Perfil de {booking.providerName.split(' ')[0]}</Text>
        </TouchableOpacity>
      </View>
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Espaço antes dos detalhes do agendamento, se for no mesmo card
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#eee'
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
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonOutlineText: {
      color: '#007AFF',
      marginLeft: 8,
  }
});