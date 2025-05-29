// LimpeJaApp/app/(client)/bookings/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Image,
  Animated, // Importar Animated para animações
} from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers'; // Ajuste o caminho se necessário

// IMPORTANTE: Substitua MockBooking pelo seu tipo real `Booking` de `types/booking.ts`
// quando você tiver a definição completa e a integração com a API.
interface MockBooking {
  id: string;
  serviceName: string;
  providerName: string;
  providerId: string;
  providerImageUrl?: string;
  date: string; // ISO String
  status: 'Confirmado' | 'Pendente' | 'Concluído' | 'Cancelado';
  // Adicione outros campos que possam ser úteis, como 'price'
  // price?: string;
}

// Componente para um item da lista de agendamentos com animação de entrada
const AnimatedBookingItem: React.FC<{ item: MockBooking; index: number }> = ({ item, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current; // Começa 50px abaixo

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 80, // Atraso escalonado para cada item
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

    const getStatusStyle = (status: MockBooking['status']) => {
        switch (status) {
            case 'Confirmado': return { text: '#388E3C', background: '#E8F5E9', icon: 'checkmark-circle-outline' as const, iconColor: '#4CAF50' };
            case 'Pendente': return { text: '#FFA000', background: '#FFF3E0', icon: 'time-outline' as const, iconColor: '#FF9800' };
            case 'Concluído': return { text: '#007AFF', background: '#E3F2FD', icon: 'flag-outline' as const, iconColor: '#007AFF' };
            case 'Cancelado': return { text: '#D32F2F', background: '#FFEBEE', icon: 'close-circle-outline' as const, iconColor: '#F44336' };
            default: return { text: '#546E7A', background: '#ECEFF1', icon: 'help-circle-outline' as const, iconColor: '#757575' };
        }
    };

    const statusInfo = getStatusStyle(item.status);

    return (
        <Animated.View style={[styles.itemCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Link href={`/(client)/bookings/${item.id}` as any} asChild> {/* Adicionado 'as any' para compatibilidade de tipo de rota, se necessário */}
                <TouchableOpacity style={styles.itemCardContent}>
                    {item.providerImageUrl ? (
                        <Image source={{ uri: item.providerImageUrl }} style={styles.itemProviderImage} />
                    ) : (
                        <View style={styles.itemIconContainer}>
                            <Ionicons name={statusInfo.icon} size={28} color={statusInfo.iconColor} />
                        </View>
                    )}
                    <View style={styles.itemDetails}>
                        <Text style={styles.itemServiceName} numberOfLines={1}>{item.serviceName}</Text>
                        <Text style={styles.itemProviderName}>Com: {item.providerName}</Text>
                        <Text style={styles.itemDate}>
                            <Ionicons name="calendar-outline" size={14} color="#6C757D" />{' '}
                            {formatDate(item.date, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
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
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  // << CORREÇÃO: Declaração de 'filters' movida para ANTES de 'filterButtonAnims' >>
  const filters: Array<{ label: string; value: typeof activeFilter; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: 'Próximos', value: 'upcoming', icon: 'calendar-outline' },
    { label: 'Anteriores', value: 'past', icon: 'checkmark-done-outline' },
    { label: 'Cancelados', value: 'cancelled', icon: 'close-circle-outline' },
  ];

  // Animações para os botões de filtro
  const filterButtonAnims = useRef(filters.map(() => new Animated.Value(1))).current;


  useEffect(() => {
    console.log("[MyBookingsScreen] Carregando agendamentos com filtro:", activeFilter);
    setIsLoading(true);
    setBookings([]);

    // TODO: Substituir pela chamada real ao seu clientService.getClientBookings({ status: activeFilter });
    setTimeout(() => {
      let mockData: MockBooking[] = [];
      if (activeFilter === 'upcoming') {
        mockData = [
          { id: 'book1', serviceName: 'Limpeza Padrão Semanal', providerName: 'Ana Oliveira', providerId: 'provider1', providerImageUrl: 'https://via.placeholder.com/80/ADD8E6/000000?text=Ana+O', date: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'Confirmado' },
          { id: 'book2', serviceName: 'Limpeza Pesada Quinzenal', providerName: 'Carlos Silva', providerId: 'provider2', providerImageUrl: 'https://via.placeholder.com/80/E0F7FA/000000?text=Carlos+S', date: new Date(Date.now() + 86400000 * 7).toISOString(), status: 'Pendente' },
        ];
      } else if (activeFilter === 'past') {
        mockData = [
          { id: 'book3', serviceName: 'Limpeza Pós-Obra', providerName: 'Mariana Costa', providerId: 'provider3', providerImageUrl: 'https://via.placeholder.com/80/B3E5FC/000000?text=Mariana+C', date: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'Concluído' },
        ];
      } else if (activeFilter === 'cancelled') {
         mockData = [
          { id: 'book4', serviceName: 'Faxina Express', providerName: 'Ana Oliveira', providerId: 'provider1', providerImageUrl: 'https://via.placeholder.com/80/FFCDD2/000000?text=Ana+O', date: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'Cancelado' },
        ];
      }
      setBookings(mockData);
      setIsLoading(false);
    }, 1000);
  }, [activeFilter]);

    // Funções para animação de "pressionar" nos botões de filtro
    const onPressInFilterButton = (index: number) => {
        Animated.spring(filterButtonAnims[index], {
            toValue: 0.9,
            useNativeDriver: true,
        }).start();
    };

    const onPressOutFilterButton = (index: number) => {
        Animated.spring(filterButtonAnims[index], {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
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
              onPress={() => setActiveFilter(filterItem.value)}
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

      {isLoading ? (
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
        />
      ) : (
        <View style={styles.centeredFeedback}>
            <Ionicons name="file-tray-stacked-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyText}>Nenhum agendamento aqui.</Text>
            <Text style={styles.emptySubText}>
              {activeFilter === 'upcoming' ? "Você não tem serviços futuros agendados." : 
               activeFilter === 'past' ? "Nenhum serviço anterior encontrado." :
               "Nenhum serviço cancelado."}
            </Text>
            {activeFilter === 'upcoming' && (
                <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(client)/explore' as any)}> {/* Adicionado 'as any' para compatibilidade de tipo de rota, se necessário */}
                    <Text style={styles.exploreButtonText}>Explorar Serviços</Text>
                </TouchableOpacity>
            )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Fundo ainda mais suave
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
    flex: 1, // Para distribuir igualmente
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 25, // Mais arredondado
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
  itemCardContent: { // Conteúdo interno do TouchableOpacity
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  itemProviderImage: { // Estilo para a imagem do prestador
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E9ECEF', // Cor de fundo enquanto a imagem carrega
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemIconContainer: { // Fallback se não houver imagem
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
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15, // Mais arredondado
    marginLeft: 10,
    alignSelf: 'center', // Alinha verticalmente com os detalhes
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemChevron: {
    marginLeft: 8, // Pequeno espaço antes do chevron
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