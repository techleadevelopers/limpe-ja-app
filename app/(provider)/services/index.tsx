import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  ImageSourcePropType,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import ServiceItemSkeleton from '../../../components/ServiceItemSkeleton';
import ToastMessage from '../../../components/ui/ToastMessage';
import { formatDate } from '../../../utils/helpers';
import Colors from '../../../constants/Colors';

// --- Importações de SERVIÇOS e TIPAGENS REAIS do BACKEND ---
import { getBookingsForUser, updateBookingStatus } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
// -------------------------------------------------------------

// ===== Ícones 3D injetados (sem alterar layout) =====
const Icons3D = {
  money: require('/assets/images/3d/cashback3.png'),
  empty: require('/assets/images/3d/step1-card-profile.png'),
} satisfies Record<string, ImageSourcePropType>;

const Icon3D = ({ src, size = 24, style }: { src: ImageSourcePropType; size?: number; style?: any }) => (
  <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />
);

function useTheme() {
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// Novo card “completo” — com Aceitar/Rejeitar embutidos e badge movido para fora (absolute no topo)
const BookingCardWithActions: React.FC<{
  item: BookingDetails;
  delay: number;
  onUpdate?: () => void;
  onPress?: (item: BookingDetails) => void;
}> = ({ item, delay, onUpdate, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, [delay]);

  const onPressInItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const onPressOutItem = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  // Adaptação de getStatusStyle para BookingStatus do backend (ajustado para maiúscula em PENDING/CONFIRMED)
  const getStatusStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return { text: '#F57C00', background: 'rgba(255, 152, 0, 0.1)', icon: 'clock-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'PENDENTE' };
      case BookingStatus.CONFIRMED:
        return { text: '#2E7D32', background: 'rgba(46, 125, 50, 0.1)', icon: 'check-circle-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'CONFIRMADO' };
      case BookingStatus.COMPLETED:
        return { text: '#546E7A', background: '#ECEFF1', icon: 'check-all' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Concluído' };
      case BookingStatus.CANCELLED:
        return { text: '#D32F2F', background: '#FFEBEE', icon: 'close-circle-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Cancelado' };
      case BookingStatus.REJECTED:
        return { text: '#757575', background: '#F5F5F5', icon: 'minus-circle-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Recusado' };
      case BookingStatus.IN_PROGRESS:
        return { text: '#007AFF', background: '#E3F2FD', icon: 'sync-circle-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Em Progresso' };
      default:
        return { text: '#546E7A', background: '#ECEFF1', icon: 'information-outline' as keyof typeof MaterialCommunityIcons.glyphMap, display: 'Desconhecido' };
    }
  };

  const statusStyle = getStatusStyle(item.status);

  const handleUpdate = async (status: BookingStatus) => {
    try {
      setIsUpdating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateBookingStatus(item.id, { status } as any);
      onUpdate?.();
    } catch (err) {
      Alert.alert('Erro', 'Falha ao atualizar o serviço.');
    } finally {
      setIsUpdating(false);
    }
  };

  const isPendingOrConfirmed = item.status === BookingStatus.PENDING || item.status === BookingStatus.CONFIRMED;

  return (
    <Animated.View
      style={[
        styles.serviceCardWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      {/* Container para card + badge absoluto (fora do middleCol) */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => onPress?.(item)} // Chama navegação se prop fornecida
          onPressIn={onPressInItem}
          onPressOut={onPressOutItem}
          activeOpacity={1}
          disabled={item.status === BookingStatus.PENDING} // Desabilita tap no card se PENDING (foco nos botões)
          accessibilityLabel={`Detalhes do serviço de ${item.serviceName} para ${item.clientFullName}`}
          accessibilityHint="Toque para ver mais informações sobre o serviço"
        >
          <View style={styles.middleCol}>
            {/* Linha 1: Serviço (bold) - sem badge aqui */}
            <Text style={styles.serviceType}>{item.serviceName}</Text>
            
            {/* Linha 2: Cliente */}
            <Text style={styles.clientName}>Cliente: {item.clientFullName}</Text>
            
            {/* Linha 3: Data/Hora */}
            <Text style={styles.serviceDate}>
              <Ionicons name="calendar-outline" size={18} color="#6C757D" />{' '}
              {formatDate(item.scheduledDate, { day: 'numeric', month: 'short', year: 'numeric' })} às {item.scheduledTime || 'Horário não definido'}
            </Text>
            
            {/* Linha 4: Preço - Ajustado para View com row para alinhar ícone e preço lado a lado */}
            {item.totalPrice !== undefined && (
              <View style={styles.servicePriceText}>
                <Icon3D src={Icons3D.money} size={44} style={{ marginRight: 4 }} />
                <Text style={styles.servicePriceTextInner}>
                  R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                </Text>
              </View>
            )}

            {/* Badge normal para outros status (dentro do middleCol, se não PENDING/CONFIRMED) */}
            {!isPendingOrConfirmed && (
              <View style={styles.statusBadgeContainer}>
                <BlurView intensity={25} tint="light" style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}>
                  <MaterialCommunityIcons name={statusStyle.icon} size={14} color={statusStyle.text} />
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.display}</Text>
                </BlurView>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Badge ABSOLUTO FORA DO CONTAINER - para PENDING/CONFIRMED, no topo direito */}
        {isPendingOrConfirmed && (
          <View style={styles.absoluteBadgeContainer}>
            <BlurView intensity={25} tint="light" style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}>
              <MaterialCommunityIcons name={statusStyle.icon} size={14} color={statusStyle.text} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.display}</Text>
            </BlurView>
          </View>
        )}
      </View>

      {/* Botões Aceitar / Rejeitar (mantidos no final) */}
      {item.status === BookingStatus.PENDING && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, isUpdating && { opacity: 0.6 }]}
            disabled={isUpdating}
            onPress={() => handleUpdate(BookingStatus.CONFIRMED)}
            accessibilityLabel="Aceitar solicitação"
            accessibilityRole="button"
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Aceitar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, isUpdating && { opacity: 0.6 }]}
            disabled={isUpdating}
            onPress={() => handleUpdate(BookingStatus.REJECTED)}
            accessibilityLabel="Rejeitar solicitação"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={16} color="#007AFF" />
            <Text style={styles.secondaryBtnText}>Rejeitar</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

// Componente Header adaptado do ScheduleHeader.tsx
const CustomHeader: React.FC<{
  headerTitle: string;
  headerAnim: Animated.Value;
  onAddPress: () => void;
}> = ({ headerTitle, headerAnim, onAddPress }) => {
  const theme = useTheme();

  return (
    <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
      <View style={styles.simpleHeader}>
        <View style={{ width: 22 }} />
        <Text numberOfLines={1} style={[styles.simpleHeaderTitle, { color: theme.text }]}>{headerTitle}</Text>
        <TouchableOpacity
          onPress={onAddPress}
          accessibilityLabel="Adicionar novo serviço"
          accessibilityHint="Toque para gerenciar os tipos de serviços que você oferece"
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function ProviderServicesScreen() {
  const router = useRouter();

  // >>> NOVO: lê o query param ?filter=... para abrir já filtrado
  const params = useLocalSearchParams<{ filter?: string }>();
  const initialFilter = (params.filter === 'upcoming' || params.filter === 'completed' || params.filter === 'requests')
    ? (params.filter as 'requests' | 'upcoming' | 'completed')
    : 'requests';

  const [services, setServices] = useState<BookingDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'requests' | 'upcoming' | 'completed'>(initialFilter);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Mover a declaração de loadServices para antes do useEffect que a chama
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
  }, [contentAnim]);

  // useEffect que chama loadServices
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

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(provider)/profile/edit-services' as any);
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
        {/* Ícone 3D no estado vazio (mesma hierarquia visual) */}
        <Icon3D src={Icons3D.empty} size={64} />
        <Text style={styles.emptyText}>{title}</Text>
        <Text style={styles.emptySubText}>{subText}</Text>
        {ctaButton}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header adaptado do ScheduleHeader.tsx */}
      <CustomHeader
        headerTitle={getHeaderTitle()}
        headerAnim={headerAnim}
        onAddPress={handleAddPress}
      />

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
              <BookingCardWithActions
                item={item}
                delay={index * 70}
                onUpdate={() => loadServices(filter, true)} // atualiza lista após ação
                onPress={handleServicePress} // passa a função de navegação
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
    backgroundColor: '#f2f2f2',
  },
  // Estilos adaptados do ScheduleHeader para o headerGradient e relacionados
  headerGradient: {
    paddingBottom: 0,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingHorizontal: 20,
    width: '100%',
    left: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
    paddingHorizontal: 5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
    }),
    includeFontPadding: false,
  },
  simpleHeader: { paddingTop: 80, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  simpleHeaderTitle: { fontSize: 17, fontWeight: '800' },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 26,
    marginTop: 8,
    backgroundColor: '#6c829118',
    padding: 6,
    borderRadius: 18,
    alignSelf: 'center',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 14,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#6395f1e2',
    ...Platform.select({ ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 }, android: { elevation: 2 } }),
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27292cff',
  },
  filterButtonTextActive: {
    color: '#ffffffff',
  },
  contentArea: {
    flex: 1,
    paddingTop: 10,
  },
  listContentContainer: {
    paddingHorizontal: 20,
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
  // Novo container para card + badge absoluto
  cardContainer: {
    position: 'relative', // Permite position absolute no badge
    flex: 1,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Alinha itens ao topo para melhor distribuição vertical
    padding: 15,
  },
  middleCol: { 
    flex: 1,
    // Alinhamento à esquerda para o título e outros textos
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
    textAlign: 'left', // Garante alinhamento à esquerda
  },
  clientName: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
    textAlign: 'left',
  },
  serviceDate: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'left',
  },
  servicePriceText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4, // Pequeno espaçamento após data
  },
  servicePriceTextInner: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c76e4ff',
  },
  // Estilos para badge normal (dentro middleCol, para outros status)
  statusBadgeContainer: {
    alignSelf: 'flex-end',
    marginTop: 8, // Espaçamento após preço
  },
  // Estilos para badge absoluto (fora do container, para PENDING/CONFIRMED)
  absoluteBadgeContainer: {
    position: 'absolute',
    top: 12, // Ajuste aqui: top=12 coloca no topo do card (aumente/diminua para mover verticalmente)
    right: 15, // Ajuste aqui: right=15 coloca no lado direito (aumente para mais à esquerda)
    zIndex: 1, // Garante que fique sobre o conteúdo
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 80, // Largura mínima para não ficar apertado
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  listSeparator: {
    height: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    left: 0,
    paddingBottom: 14,
    paddingTop: 4,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 6,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  secondaryBtnText: { color: '#007AFF', fontWeight: '700', fontSize: 15 },
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
    marginBottom: 20,
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
});