// LimpeJaApp/app/(provider)/services/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    Animated, // Importar Animated para animações
    Alert, // << CORREÇÃO: Importar Alert
} from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers'; // Para formatar datas

// Tipo para um agendamento/solicitação (mova para types/ se usar em mais lugares)
interface ServiceItem {
  id: string;
  clientName: string;
  serviceType: string;
  date: string;       // Formato YYYY-MM-DD (para solicitação ou agendamento)
  time?: string;      // HH:MM (opcional, para agendamentos)
  status: 'Pendente' | 'Confirmado' | 'Concluído' | 'Cancelado' | 'Recusado';
}

// Mock de dados de serviços (simulando uma busca inicial)
const ALL_PROVIDER_SERVICES: ServiceItem[] = [
  // Solicitações Pendentes
  { id: 'req1', clientName: 'Cliente A', serviceType: 'Limpeza Padrão', date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], status: 'Pendente' },
  { id: 'req2', clientName: 'Cliente B', serviceType: 'Limpeza Pesada', date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], status: 'Pendente' },
  // Próximos Agendamentos
  { id: 'upc1', clientName: 'Cliente C', serviceType: 'Limpeza Comercial', date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], time: '09:00', status: 'Confirmado' },
  { id: 'upc2', clientName: 'Cliente D', serviceType: 'Limpeza de Estofados', date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], time: '14:00', status: 'Confirmado' },
  // Concluídos
  { id: 'comp1', clientName: 'Cliente E', serviceType: 'Limpeza Padrão', date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0], status: 'Concluído' },
  { id: 'comp2', clientName: 'Cliente F', serviceType: 'Limpeza Pesada', date: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0], status: 'Concluído' },
  // Cancelados/Recusados (para mostrar em 'Concluídos' ou um filtro separado)
  { id: 'canc1', clientName: 'Cliente G', serviceType: 'Limpeza Padrão', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], status: 'Cancelado' },
  { id: 'rec1', clientName: 'Cliente H', serviceType: 'Limpeza de Vidros', date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0], status: 'Recusado' },
];

// Função mockada para buscar serviços (substitua por API)
const fetchProviderServices = async (filter: string): Promise<ServiceItem[]> => {
  console.log(`[ProviderServicesScreen] Buscando serviços com filtro: ${filter}`);
  await new Promise(resolve => setTimeout(resolve, 800)); // Simula delay de rede

  switch (filter) {
    case 'requests':
      return ALL_PROVIDER_SERVICES.filter(s => s.status === 'Pendente');
    case 'upcoming':
      return ALL_PROVIDER_SERVICES.filter(s => s.status === 'Confirmado' && new Date(s.date) >= new Date()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    case 'completed':
      return ALL_PROVIDER_SERVICES.filter(s => s.status === 'Concluído' || s.status === 'Cancelado' || s.status === 'Recusado').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    default:
      return [];
  }
};

// Componente para cada item de serviço com animações
const AnimatedServiceItem: React.FC<{
    item: ServiceItem;
    onPress: (item: ServiceItem) => void;
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

    const getStatusStyle = (status: ServiceItem['status']) => {
        switch (status) {
            case 'Pendente': return { text: '#FF6F00', background: '#FFF3E0' }; // Laranja
            case 'Confirmado': return { text: '#2E7D32', background: '#E8F5E9' }; // Verde escuro
            case 'Concluído': return { text: '#546E7A', background: '#ECEFF1' }; // Cinza
            case 'Cancelado': return { text: '#D32F2F', background: '#FFEBEE' }; // Vermelho
            case 'Recusado': return { text: '#757575', background: '#F5F5F5' }; // Cinza mais claro
            default: return { text: '#546E7A', background: '#ECEFF1' };
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
            >
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceType} numberOfLines={1}>{item.serviceType}</Text>
                    <Text style={styles.clientName} numberOfLines={1}>Cliente: {item.clientName}</Text>
                    <Text style={styles.serviceDate}>
                        <Ionicons name="calendar-outline" size={14} color="#6C757D" /> {formatDate(item.date, { day: 'numeric', month: 'short' })}
                        {item.time && <Text> às {item.time}</Text>}
                    </Text>
                </View>
                <View style={[styles.statusBadge, {backgroundColor: statusStyle.background}]}>
                    <Text style={[styles.statusText, {color: statusStyle.text}]}>{item.status}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={24} color="#C7C7CC" />
            </TouchableOpacity>
        </Animated.View>
    );
};


export default function ProviderServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'requests' | 'upcoming' | 'completed'>('requests');

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current; // Para os botões de filtro
  const contentAnim = useRef(new Animated.Value(0)).current; // Para a lista/feedback

  useEffect(() => {
    // Animação de entrada do cabeçalho e filtros
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

    // Inicia o carregamento dos serviços com o filtro atual
    loadServices(filter);
  }, [filter]); // Recarrega quando o filtro muda

  const loadServices = async (currentFilter: typeof filter) => {
    setIsLoading(true);
    // Animação para o conteúdo (lista/feedback)
    Animated.timing(contentAnim, {
        toValue: 0, // Fade out conteúdo antigo
        duration: 200,
        useNativeDriver: true,
    }).start(() => {
        fetchProviderServices(currentFilter)
            .then(data => {
                setServices(data);
            })
            .catch(err => {
                console.error("Erro ao buscar serviços:", err);
                Alert.alert("Erro", "Não foi possível carregar seus serviços.");
            })
            .finally(() => {
                setIsLoading(false);
                Animated.timing(contentAnim, { // Fade in novo conteúdo
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            });
    });
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    if (newFilter === filter) return; // Não faz nada se o filtro for o mesmo
    setFilter(newFilter);
  };

  const handleServicePress = (item: ServiceItem) => {
    router.push(`/(provider)/services/${item.id}` as any); // Navega para detalhes do serviço
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.headerTitle}>Meus Serviços</Text>
          <TouchableOpacity
              onPress={() => router.push('/(provider)/profile/edit-services' as any)} // << Rota para gerenciar tipos de serviço
              style={styles.headerActionIcon}
          >
              <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.filterContainer, { opacity: filterAnim, transform: [{ translateY: filterAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <TouchableOpacity
            style={[styles.filterButton, filter === 'requests' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('requests')}
        >
            <Text style={[styles.filterButtonText, filter === 'requests' && styles.filterButtonTextActive]}>Solicitações</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('upcoming')}
        >
            <Text style={[styles.filterButtonText, filter === 'upcoming' && styles.filterButtonTextActive]}>Próximos</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('completed')}
        >
            <Text style={[styles.filterButtonText, filter === 'completed' && styles.filterButtonTextActive]}>Histórico</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.contentArea, { opacity: contentAnim }]}>
        {isLoading ? (
            <View style={styles.centeredFeedback}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando serviços...</Text>
            </View>
        ) : services.length > 0 ? (
            <FlatList
                data={services}
                renderItem={({ item, index }) => (
                    <AnimatedServiceItem
                        item={item}
                        onPress={handleServicePress}
                        delay={index * 70} // Atraso escalonado para cada item
                    />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContentContainer}
                ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            />
        ) : (
            <View style={styles.centeredFeedback}>
                <Ionicons name="clipboard-outline" size={64} color="#CED4DA" />
                <Text style={styles.emptyText}>Nenhum serviço encontrado.</Text>
                <Text style={styles.emptySubText}>Ajuste o filtro ou aguarde novas solicitações!</Text>
            </View>
        )}
      </Animated.View>
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
    // Adicionar marginLeft se o botão de voltar estivesse presente
    // marginLeft: Platform.OS === 'ios' ? 0 : 28, // Exemplo
  },
  headerActionIcon: {
    position: 'absolute', // Garante que fique à direita mesmo com título centralizado
    right: 15,
    padding: 5, // Aumenta a área de toque
    top: Platform.OS === 'ios' ? 47 : 17, // Ajuste de acordo com paddingTop
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
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
    backgroundColor: '#007AFF',
    // Sombra para o botão ativo
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,122,255,0.3)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 4 },
        android: { elevation: 5 },
    }),
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C757D',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
    paddingTop: 10, // Espaço entre os filtros e a lista
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  serviceCardWrapper: {
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
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
  serviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceType: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  serviceDate: {
    fontSize: 13,
    color: '#6C757D',
    // flexDirection: 'row', // Não é necessário aqui, Text aninhado funciona
    // alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: 10,
    alignSelf: 'center', // Para centralizar verticalmente
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  listSeparator: {
    height: 0, // O espaçamento é feito pelo marginVertical do wrapper
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
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 5,
    textAlign: 'center',
  },
});