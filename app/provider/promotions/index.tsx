import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    AccessibilityInfo,
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform 
} from 'react-native';
import Toast from 'react-native-toast-message';
import { getUserMessage } from '../../../_shared/errors/uiFeedback';
import ProviderNavBar from '../../../components/provider/navigation/ProviderNavBar';
import {
    createProviderPromotion,
    listProviderPromotions,
    updateProviderPromotion,
} from '../../../services/providerPromotionsService';
import { ProviderPromotionDto } from '../../../types/backend/providerPromotions';

const PERCENT_OPTIONS = [5, 10, 15, 20];
const DURATION_OPTIONS = [7, 14, 30];

const formatFullDate = (value: string) => {
  try {
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

const getDateAfterDays = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const isPromotionExpired = (promotion: ProviderPromotionDto) =>
  new Date(promotion.validUntil).getTime() < Date.now();

type PromotionStatusIcon = 'close-circle' | 'checkmark-circle' | 'pause-circle';

const getStatusMeta = (promotion: ProviderPromotionDto) => {
  const expired = isPromotionExpired(promotion);
  if (expired) {
    return {
      label: 'EXPIRADA',
      color: '#EF4444',
      background: 'rgba(239,68,68,0.12)',
      icon: 'close-circle' as PromotionStatusIcon,
    };
  }

  if (promotion.isActive) {
    return {
      label: 'ATIVA',
      color: '#10B981',
      background: 'rgba(16,185,129,0.15)',
      icon: 'checkmark-circle' as PromotionStatusIcon,
    };
  }

  return {
    label: 'PAUSADA',
    color: '#F59E0B',
    background: 'rgba(245,158,11,0.15)',
    icon: 'pause-circle' as PromotionStatusIcon,
  };
};

const PromotionsScreen = () => {
  const [promotions, setPromotions] = useState<ProviderPromotionDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0]);
  const [activateNow, setActivateNow] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [highlightUpdate, setHighlightUpdate] = useState(false);
  const router = useRouter();
  const lastActivePromotionRef = useRef<string | null>(null);

  

const resolveErrorMessage = useCallback(
  (error: unknown, action: 'list' | 'create' | 'toggle') => {
    const sanitized = getUserMessage(error);
    if (!axios.isAxiosError(error)) {
      return sanitized;
    }

    const status = error.response?.status;
    const responseData = error.response?.data;
    const loginMessage = 'Faça login novamente.';
    const verificationMessage =
      action === 'toggle'
        ? 'Complete a verificação para ativar promoções.'
        : 'Complete a verificação para criar/ativar promoções.';

    if (status === 401) {
      return loginMessage;
    }
    if (status === 403) {
      return action === 'list' ? loginMessage : verificationMessage;
    }
    const hasServerMessage =
      typeof responseData === 'object' && responseData !== null && 'message' in responseData;
    if (status === 400 && !hasServerMessage) {
      return 'Dados inválidos.';
    }

    return sanitized;
  },
  [],
);

  const loadPromotions = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (options?.refreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setGlobalError(null);

      try {
        const data = await listProviderPromotions();
        setPromotions(data);
        setIsVerificationPending(false);
      } catch (error) {
        const message = resolveErrorMessage(error, 'list');
        setGlobalError(message);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          setIsVerificationPending(true);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Erro ao buscar promoções',
            text2: message,
          });
        }
      } finally {
        if (options?.refreshing) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [resolveErrorMessage],
  );

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const sortedPromotions = useMemo(() => {
    if (!promotions) return [];
    return [...promotions].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [promotions]);

  const activePromotion = useMemo(
    () => sortedPromotions.find((promotion) => promotion.isActive && !isPromotionExpired(promotion)),
    [sortedPromotions],
  );

  useEffect(() => {
    if (activePromotion?.id && lastActivePromotionRef.current !== activePromotion.id) {
      lastActivePromotionRef.current = activePromotion.id;
      setHighlightUpdate(true);
      AccessibilityInfo.announceForAccessibility('Novas promoções ativas disponíveis');
      const timer = setTimeout(() => setHighlightUpdate(false), 2200);
      return () => {
        clearTimeout(timer);
      };
    }

    if (!activePromotion) {
      lastActivePromotionRef.current = null;
      setHighlightUpdate(false);
    }
  }, [activePromotion]);

  const validUntilDate = useMemo(() => getDateAfterDays(selectedDuration), [selectedDuration]);

  const handleCreatePromotion = async () => {
    if (isCreating || isVerificationPending) return;
    if (!selectedPercent) {
      setModalError('Selecione um desconto.');
      return;
    }
    setIsCreating(true);
    setModalError(null);

    try {
      await createProviderPromotion({
        title: title.trim() || undefined,
        percentOff: selectedPercent,
        validUntil: validUntilDate.toISOString(),
        isActive: activateNow || undefined,
      });
      setModalVisible(false);
      setTitle('');
      setSelectedPercent(null);
      setActivateNow(false);
      Alert.alert('Promoção criada', 'Sua nova promoção está pronta.');
      await loadPromotions();
    } catch (error) {
      const message = resolveErrorMessage(error, 'create');
      setModalError(message);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setIsVerificationPending(true);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSavePress = () => {
    if (isCreating || !selectedPercent || isVerificationPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void handleCreatePromotion();
  };

  const handleTogglePromotion = async (promotion: ProviderPromotionDto) => {
    if (togglingId || isVerificationPending) return;
    setTogglingId(promotion.id);
    setGlobalError(null);
    const nextState = !promotion.isActive;

    try {
      await updateProviderPromotion(promotion.id, { isActive: nextState });
      await loadPromotions();
      Toast.show({
        type: 'success',
        text1: nextState ? 'Promoção ativada' : 'Promoção desativada',
        text2: 'Sua lista foi atualizada.',
      });
    } catch (error) {
      const message = resolveErrorMessage(error, 'toggle');
      setGlobalError(message);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setIsVerificationPending(true);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenModal = () => {
    if (isVerificationPending) return;
    setModalVisible(true);
    setModalError(null);
  };

  const renderSkeleton = () => (
    <View style={styles.section}>
      <View style={styles.skeletonActiveCard} />
      {Array.from({ length: 2 }).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.skeletonHistoryCard} />
      ))}
    </View>
  );

  const emptyHistory = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Histórico vazio</Text>
      <Text style={styles.emptyStateSubtitle}>Crie sua primeira promoção para aparecer aqui.</Text>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Central de Cupons' }} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPromotions({ refreshing: true })}
            />
          }
        >
          {isVerificationPending && (
            <View style={styles.verificationBanner}>
              <Text style={styles.verificationBannerTitle}>Verificação pendente</Text>
              <Text style={styles.verificationBannerText}>
                Para criar promoções, finalize sua verificação.
              </Text>
            </View>
          )}
          {globalError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{globalError}</Text>
            </View>
          )}

          {!activePromotion ? (
            <View style={styles.mainActionCard}>
              <View style={styles.iconContainer}>
                <Ionicons name="pricetag" size={32} color="#2563EB" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E293B', textAlign: 'center' }}>
                Aumente seus ganhos
              </Text>
              <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
                Crie uma promoção para aparecer no topo das buscas dos clientes.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={handleOpenModal}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Criar novo cupom</Text>
                <Ionicons name="add-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activePromotionCard}>
              <View>
                <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>Promoção Ativa</Text>
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#2563EB' }}>-{activePromotion.percentOff}% OFF</Text>
                <Text style={{ color: '#1E293B', fontWeight: '500' }}>{activePromotion.title || 'Desconto Geral'}</Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12 }}
                onPress={() => handleTogglePromotion(activePromotion)}
                disabled={togglingId === activePromotion.id || isVerificationPending}
              >
                {togglingId === activePromotion.id ? (
                  <ActivityIndicator size="small" color="#475569" />
                ) : (
                  <Text style={{ color: '#475569', fontWeight: '700' }}>Pausar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico</Text>
            <Text style={{ color: '#64748B', fontSize: 12 }}>{sortedPromotions.length} criados</Text>
          </View>

          {loading && promotions === null ? (
            renderSkeleton()
          ) : sortedPromotions.length === 0 ? (
            emptyHistory
          ) : (
            sortedPromotions.map((promotion) => {
              const status = getStatusMeta(promotion);
              return (
                <View key={promotion.id} style={styles.historyCard}>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{promotion.percentOff}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>{promotion.title || 'Cupom'}</Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>Até {formatFullDate(promotion.validUntil)}</Text>
                  </View>
                  <View style={[styles.pillBadge, { backgroundColor: status.background }]}>
                    <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Criar promoção</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.modalCloseText}>Fechar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalLabel}>Título (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Promoção de boas-vindas"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
              />

              <Text style={styles.modalLabel}>Desconto</Text>
              <View style={styles.chipRow}>
                {PERCENT_OPTIONS.map((percent) => (
                  <TouchableOpacity
                    key={`percent-${percent}`}
                    style={[
                      styles.chip,
                      selectedPercent === percent ? styles.chipActive : styles.chipInactive,
                    ]}
                    onPress={() => setSelectedPercent(percent)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedPercent === percent ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {percent}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Duração</Text>
              <View style={styles.chipRow}>
                {DURATION_OPTIONS.map((days) => (
                  <TouchableOpacity
                    key={`duration-${days}`}
                    style={[
                      styles.chip,
                      selectedDuration === days ? styles.chipActive : styles.chipInactive,
                    ]}
                    onPress={() => setSelectedDuration(days)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedDuration === days ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {days} dias
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.validUntilText}>
                Válido até {validUntilDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </Text>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Ativar agora</Text>
                <Switch
                  trackColor={{ false: '#dcdcdc', true: '#2563EB' }}
                  thumbColor="#fff"
                  value={activateNow}
                  onValueChange={setActivateNow}
                />
              </View>

              {modalError && <Text style={styles.modalError}>{modalError}</Text>}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (isCreating || !selectedPercent) && styles.saveButtonDisabled,
              ]}
              onPress={handleSavePress}
              disabled={isCreating || !selectedPercent}
            >
              {isCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar promoção</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      <ProviderNavBar />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mainActionCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  activePromotionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    borderLeftWidth: 6,
    borderLeftColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  shrinkWrapper: {
    transform: [{ scale: 0.95 }],
    alignSelf: 'stretch',
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 52,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 10,
    textAlign: 'center',
  },
  section: {
    paddingTop: 20,
  },
  activeSection: {
    marginTop: 8,
  },
  activeCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  activeCardHighlight: {
    borderColor: '#E0E7FF',
    borderWidth: 2,
  },
  activeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeInfoText: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748B',
    fontWeight: '600',
  },
  activePercentage: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: -1,
    marginTop: 8,
  },
  activeValid: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  activeActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  activeActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeActionButtonDisabled: {
    opacity: 0.6,
  },
  activeActionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  activeOutlineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOutlineButtonText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyActiveCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  emptyActiveTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyActiveSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  historySection: {
    marginTop: 16,
  },
  historyHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  historySubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  percentBadge: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  percentText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  historyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusIndicator: {
    width: 4,
    height: '70%',
    borderRadius: 2,
    marginRight: 16,
    backgroundColor: '#2563EB',
  },
  historyMainInfo: {
    flex: 1,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
    width: 80,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  historyDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  historyToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  historyToggleLabel: {
    fontSize: 13,
    color: '#475569',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#2563EB',
  },
  pillIcon: {
    marginRight: 6,
  },
  toggleControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLoader: {
    marginLeft: 8,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#475569',
    marginTop: 6,
    textAlign: 'center',
  },
  verificationBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#fff4e6',
    borderWidth: 1,
    borderColor: '#f5c16a',
  },
  verificationBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#b35a00',
  },
  verificationBannerText: {
    fontSize: 14,
    color: '#8a5b00',
    marginTop: 6,
  },
  errorBox: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#ffe5e5',
  },
  errorText: {
    color: '#a00',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    width: '100%',
    height: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 140,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingBottom: 120,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipInactive: {
    backgroundColor: '#F1F5F9',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#fff',
  },
  chipTextInactive: {
    color: '#475569',
  },
  validUntilText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  modalError: {
    marginTop: 10,
    color: '#B91C1C',
    fontSize: 13,
  },
  saveButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default PromotionsScreen;

