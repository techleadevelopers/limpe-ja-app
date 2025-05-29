// LimpeJaApp/app/(provider)/services/[serviceId].tsx
import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert, // Adicionado para uso na função handleAction
    ScrollView,
    TouchableOpacity,
    Platform,
    Animated, // Importar Animated para animações
    Image, // << CORREÇÃO: Importar Image
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers'; // Para formatar datas

// Mock de dados de serviço (substitua por API)
interface ServiceDetails {
    id: string;
    clientName: string;
    serviceType: string;
    date: string;       // YYYY-MM-DD
    time: string;       // HH:MM - HH:MM
    address: string;
    notes: string;
    status: 'Pendente' | 'Confirmado' | 'Concluído' | 'Cancelado' | 'Recusado';
    clientId: string;
    clientPhone?: string; // Exemplo
    clientAvatarUrl?: string; // Exemplo
}

const MOCK_SERVICE_DETAILS: { [key: string]: ServiceDetails } = {
    'req123': {
        id: 'req123',
        clientName: 'Ana Clara',
        serviceType: 'Limpeza Padrão Residencial',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // Daqui a 2 dias
        time: '09:00 - 12:00',
        address: 'Rua das Flores, 123 - Apt 401, Centro',
        notes: 'Cliente informou que possui 2 gatos. Favor ter cuidado ao abrir a porta.',
        status: 'Pendente',
        clientId: 'clientAna123',
        clientPhone: '11987654321',
        clientAvatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    'serv456': {
        id: 'serv456',
        clientName: 'João Silva',
        serviceType: 'Limpeza Pesada (Pós-Obra)',
        date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // Daqui a 5 dias
        time: '14:00 - 18:00',
        address: 'Av. Principal, 789 - Casa, Bairro Novo',
        notes: 'Obra recém-finalizada, muito pó e resíduos de tinta. Necessário aspirador potente.',
        status: 'Confirmado',
        clientId: 'clientJoao456',
        clientPhone: '21998765432',
        clientAvatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg'
    },
    'serv789': {
        id: 'serv789',
        clientName: 'Mariana Costa',
        serviceType: 'Limpeza de Estofados (Sofá 3 lugares)',
        date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // Ontem
        time: '10:00 - 12:00',
        address: 'Rua da Paz, 321 - Bloco B, Vila Feliz',
        notes: 'Mancha de café no sofá, tentar remover com produto específico.',
        status: 'Concluído',
        clientId: 'clientMariana789',
        clientPhone: '31976543210',
        clientAvatarUrl: 'https://randomuser.me/api/portraits/women/72.jpg'
    },
    'serv012': {
        id: 'serv012',
        clientName: 'Carlos Santos',
        serviceType: 'Limpeza de Manutenção',
        date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], // Daqui a 10 dias
        time: '08:00 - 11:00',
        address: 'Condomínio Sol Nascente, Torre A, Apt 100',
        notes: 'Serviço recorrente, as chaves estão na portaria.',
        status: 'Confirmado',
        clientId: 'clientCarlos012',
        clientPhone: '41912345678',
        clientAvatarUrl: 'https://randomuser.me/api/portraits/men/88.jpg'
    },
};


export default function ProviderServiceDetailsScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  // const contentAnim = useRef(new Animated.Value(0)).current; // Para o conteúdo principal - Removido se não usado
  const clientInfoAnim = useRef(new Animated.Value(0)).current;
  const serviceDetailsAnim = useRef(new Animated.Value(0)).current;
  const notesAnim = useRef(new Animated.Value(0)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
    }).start();

    if (serviceId) {
      setIsLoading(true);
      console.log("Carregando detalhes do serviço/solicitação:", serviceId);
      setTimeout(() => {
        const details = MOCK_SERVICE_DETAILS[serviceId];
        setServiceDetails(details || null);
        setIsLoading(false);
        if (details) {
            // Animações de entrada do conteúdo
            Animated.stagger(100, [
                Animated.timing(clientInfoAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(serviceDetailsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(notesAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(statusAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(actionsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]).start();
        }
      }, 1000);
    }
  }, [serviceId, headerAnim, clientInfoAnim, serviceDetailsAnim, notesAnim, statusAnim, actionsAnim]);

  const handleAction = async (actionType: 'accept' | 'decline' | 'complete' | 'contact') => {
    if (!serviceDetails) return;
    setIsProcessingAction(true);
    let newStatus: ServiceDetails['status'] | undefined;
    let successMessage = "";
    let errorMessage = "";

    switch (actionType) {
      case 'accept':
        newStatus = 'Confirmado';
        successMessage = "Solicitação aceita com sucesso!";
        errorMessage = "Falha ao aceitar a solicitação.";
        break;
      case 'decline':
        newStatus = 'Recusado';
        successMessage = "Solicitação recusada.";
        errorMessage = "Falha ao recusar a solicitação.";
        break;
      case 'complete':
        newStatus = 'Concluído';
        successMessage = "Serviço marcado como concluído!";
        errorMessage = "Falha ao marcar como concluído.";
        break;
      case 'contact':
        if (serviceDetails.clientPhone) {
            Alert.alert("Contatar Cliente", `Deseja ligar para ${serviceDetails.clientName} (${serviceDetails.clientPhone})?`);
            // Exemplo de como iniciar uma chamada: Linking.openURL(`tel:${serviceDetails.clientPhone}`);
        } else {
            router.push(`/(provider)/messages/${serviceDetails.clientId}?recipientName=${encodeURIComponent(serviceDetails.clientName)}` as any);
        }
        setIsProcessingAction(false); // Não é uma ação que muda status, então resetar
        return;
    }

    // TODO: Chamar providerService.updateServiceStatus(serviceDetails.id, newStatus)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula API call
      setServiceDetails(prev => prev ? { ...prev, status: newStatus as ServiceDetails['status'] } : null);
      Alert.alert("Sucesso", successMessage);
      // Opcional: router.back() ou router.replace para atualizar a lista
    } catch (error) {
      console.error(`Erro ao ${actionType} serviço:`, error);
      Alert.alert("Erro", errorMessage);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getStatusStyle = (status: ServiceDetails['status']) => {
    switch (status) {
      case 'Pendente': return { text: '#FF6F00', background: '#FFF3E0', icon: 'hourglass-outline' as const };
      case 'Confirmado': return { text: '#2E7D32', background: '#E8F5E9', icon: 'checkmark-circle-outline' as const };
      case 'Concluído': return { text: '#546E7A', background: '#ECEFF1', icon: 'archive-outline' as const };
      case 'Cancelado': return { text: '#D32F2F', background: '#FFEBEE', icon: 'close-circle-outline' as const };
      case 'Recusado': return { text: '#757575', background: '#F5F5F5', icon: 'alert-circle-outline' as const };
      default: return { text: '#546E7A', background: '#ECEFF1', icon: 'information-circle-outline' as const };
    }
  };

  if (isLoading) {
    return (
        <View style={styles.outerContainer}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Custom Header para o estado de loading */}
            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
                <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
            </Animated.View>
            <View style={styles.centeredFeedback}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando detalhes do serviço...</Text>
            </View>
        </View>
    );
  }

  if (!serviceDetails) {
    return (
        <View style={styles.outerContainer}>
            <Stack.Screen options={{ headerShown: false }} />
            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
                <View style={styles.headerActionIconPlaceholder} />
            </Animated.View>
            <View style={styles.centeredFeedback}>
                <Ionicons name="alert-circle-outline" size={64} color="#CED4DA" />
                <Text style={styles.emptyText}>Serviço não encontrado.</Text>
                <TouchableOpacity style={styles.simpleButton} onPress={() => router.back()}>
                    <Text style={styles.simpleButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  const statusStyle = getStatusStyle(serviceDetails.status);

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
          <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Seção de Informações do Cliente */}
        <Animated.View style={[styles.card, { opacity: clientInfoAnim, transform: [{ translateY: clientInfoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <View style={styles.clientHeader}>
                {serviceDetails.clientAvatarUrl ? (
                    <Image source={{ uri: serviceDetails.clientAvatarUrl }} style={styles.clientAvatar} />
                ) : (
                    <View style={styles.clientAvatarPlaceholder}>
                        <Ionicons name="person-outline" size={18} color="#FFFFFF" />
                    </View>
                )}
                <View style={styles.clientHeaderText}>
                    <Text style={styles.cardTitle}>Cliente</Text>
                    <Text style={styles.clientName}>{serviceDetails.clientName}</Text>
                </View>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                <Text style={styles.detailText}>{serviceDetails.clientPhone || 'Não disponível'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                <Text style={styles.detailText}>{serviceDetails.address}</Text>
            </View>
        </Animated.View>

        {/* Seção de Detalhes do Serviço */}
        <Animated.View style={[styles.card, { opacity: serviceDetailsAnim, transform: [{ translateY: serviceDetailsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.cardTitle}>Detalhes do Serviço</Text>
            <View style={styles.detailRow}>
                <Ionicons name="briefcase-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                <Text style={styles.detailText}>{serviceDetails.serviceType}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                <Text style={styles.detailText}>{formatDate(serviceDetails.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                <Text style={styles.detailText}>{serviceDetails.time}</Text>
            </View>
        </Animated.View>

        {/* Seção de Observações */}
        <Animated.View style={[styles.card, { opacity: notesAnim, transform: [{ translateY: notesAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.cardTitle}>Observações do Cliente</Text>
            <Text style={styles.notesText}>{serviceDetails.notes || 'Nenhuma observação adicional.'}</Text>
        </Animated.View>

        {/* Seção de Status */}
        <Animated.View style={[styles.card, { opacity: statusAnim, transform: [{ translateY: statusAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.cardTitle}>Status do Serviço</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}>
                <Ionicons name={statusStyle.icon} size={20} color={statusStyle.text} style={{ marginRight: 8 }} />
                <Text style={[styles.statusText, { color: statusStyle.text }]}>{serviceDetails.status}</Text>
            </View>
        </Animated.View>

        {/* Seção de Ações */}
        <Animated.View style={[styles.actionsContainer, { opacity: actionsAnim, transform: [{ translateY: actionsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            {serviceDetails.status === 'Pendente' && (
                <>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonAccept, isProcessingAction && styles.actionButtonDisabled]}
                        onPress={() => handleAction('accept')}
                        disabled={isProcessingAction}
                    >
                        {isProcessingAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Aceitar Solicitação</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonDecline, isProcessingAction && styles.actionButtonDisabled]}
                        onPress={() => handleAction('decline')}
                        disabled={isProcessingAction}
                    >
                        {isProcessingAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Recusar Solicitação</Text>}
                    </TouchableOpacity>
                </>
            )}
            {serviceDetails.status === 'Confirmado' && (
                <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonComplete, isProcessingAction && styles.actionButtonDisabled]}
                    onPress={() => handleAction('complete')}
                    disabled={isProcessingAction}
                >
                    {isProcessingAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Marcar como Concluído</Text>}
                </TouchableOpacity>
            )}
            {(serviceDetails.status === 'Confirmado' || serviceDetails.status === 'Pendente') && (
                <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonContact, isProcessingAction && styles.actionButtonDisabled]}
                    onPress={() => handleAction('contact')}
                    disabled={isProcessingAction}
                >
                    {isProcessingAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Contatar Cliente</Text>}
                </TouchableOpacity>
            )}
            {(serviceDetails.status === 'Concluído' || serviceDetails.status === 'Cancelado' || serviceDetails.status === 'Recusado') && (
                <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonViewOnly]}
                    onPress={() => Alert.alert("Detalhes", "Esta é uma ação de visualização para serviços finalizados/cancelados.")}
                    disabled={isProcessingAction}
                >
                    <Text style={styles.actionButtonText}>Ver Detalhes Completos</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scrollViewContent: {
    padding: 15,
    paddingBottom: 40,
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
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIconPlaceholder: {
    width: 24, // Ajuste para corresponder ao tamanho do ícone de voltar se houver
    marginLeft: 15,
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
  emptyText: {
    fontSize: 18,
    color: '#6C757D',
    marginTop: 15,
    textAlign: 'center',
  },
  simpleButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  simpleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 10,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  clientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  clientAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientHeaderText: {
    flex: 1,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 5, // Adicionado para melhor espaçamento abaixo do "Cliente"
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center', // Mudado para center para melhor alinhamento vertical com ícones
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 10,
    width: 24, // Para alinhar o texto se o ícone for menor
    textAlign: 'center', // Centraliza o ícone se ele for menor que a width
  },
  detailText: {
    fontSize: 16,
    color: '#495057',
    flex: 1, // Para o texto ocupar o espaço restante
    lineHeight: 22, // Melhora a legibilidade
  },
  notesText: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start', // Para o badge não ocupar a largura total
    marginTop: 5,
  },
  statusText: {
    fontSize: 15,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  actionsContainer: {
    marginTop: 10, // Reduzido um pouco
    // Removido background e shadow do container de ações para os botões terem seus próprios estilos
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({ // Sombra padrão para botões de ação
        ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
        android: { elevation: 3 },
    }),
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonAccept: {
    backgroundColor: '#28A745', // Verde
  },
  actionButtonDecline: {
    backgroundColor: '#DC3545', // Vermelho
  },
  actionButtonComplete: {
    backgroundColor: '#007AFF', // Azul primário
  },
  actionButtonContact: {
    backgroundColor: '#6C757D', // Cinza
  },
  actionButtonViewOnly: {
    backgroundColor: '#6C757D', // Cinza
  },
  actionButtonDisabled: {
    opacity: 0.6,
    elevation: 0, // Remove sombra se desabilitado
    shadowOpacity: 0,
  },
});