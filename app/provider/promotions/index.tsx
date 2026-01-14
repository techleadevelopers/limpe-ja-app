import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
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
import Colors from '../../../constants/Colors';
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

  const renderHistoryCard = (promotion: ProviderPromotionDto) => {
    const expired = isPromotionExpired(promotion);
    const isLoadingToggle = togglingId === promotion.id;
    const statusMeta = getStatusMeta(promotion);

    return (
      <View key={promotion.id} style={styles.historyCard}>
        <View style={[styles.statusIndicator, { backgroundColor: statusMeta.color }]} />
        <View style={styles.historyMainInfo}>
          <View style={styles.historyCardHeader}>
            <Text style={styles.historyPercent}>-{promotion.percentOff}% OFF</Text>
            <View style={[styles.pillBadge, { backgroundColor: statusMeta.background }]}>
              <Ionicons
                name={statusMeta.icon}
                size={14}
                color={statusMeta.color}
                style={styles.pillIcon}
              />
              <Text style={[styles.pillText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>
          </View>
          <Text numberOfLines={2} style={styles.historyTitle}>
            {promotion.title || 'Promoção'}
          </Text>
          <Text style={styles.historyDate}>Válida até {formatFullDate(promotion.validUntil)}</Text>
          {!expired && (
            <View style={styles.historyToggleRow}>
              <Text style={styles.historyToggleLabel}>
                {promotion.isActive ? 'Promoção visível' : 'Ative para destacar'}
              </Text>
              <View style={styles.toggleControl}>
                <Switch
                  trackColor={{ false: '#dcdcdc', true: Colors.light.primary }}
                  thumbColor="#fff"
                  onValueChange={() => handleTogglePromotion(promotion)}
                  value={promotion.isActive}
                  disabled={isVerificationPending || isLoadingToggle}
                />
                {isLoadingToggle && (
                  <ActivityIndicator
                    size="small"
                    color={Colors.light.primary}
                    style={styles.toggleLoader}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
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
      <Stack.Screen options={{ title: 'Central de Cupons' }} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPromotions({ refreshing: true })}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Central de Cupons</Text>
          </View>
        </View>

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

        {loading && promotions === null ? (
          renderSkeleton()
        ) : (
          <View style={styles.section}>
            <View style={styles.activeSection}>
              {activePromotion ? (
                <LinearGradient
                  colors={[Colors.light.primary, Colors.light.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.activeCard,
                    highlightUpdate && styles.activeCardHighlight,
                  ]}
                >
                  <View style={styles.discountCircle} />
                  <View style={styles.activeInfoRow}>
                    <Text style={styles.activeInfoText}>Promoção ativa</Text>
                    {highlightUpdate && (
                      <Text style={styles.activeInfoText}>Atualizado agora</Text>
                    )}
                  </View>
                  <Text style={styles.activePercentage}>-{activePromotion.percentOff}%</Text>
                  <Text style={styles.activeValid}>
                    Válida até {formatFullDate(activePromotion.validUntil)}
                  </Text>
                  <Text style={styles.activeTitle}>
                    {activePromotion.title || 'Promoção ativa'}
                  </Text>
                  <View style={styles.activeActions}>
                    <TouchableOpacity
                      style={[
                        styles.activeActionButton,
                        (togglingId === activePromotion.id || isVerificationPending) &&
                          styles.activeActionButtonDisabled,
                      ]}
                      onPress={() => handleTogglePromotion(activePromotion)}
                      disabled={togglingId === activePromotion.id || isVerificationPending}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {togglingId === activePromotion.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.activeActionButtonText}>Desativar</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.activeOutlineButton}
                      onPress={() =>
                        Alert.alert('Editar promoção', 'Edição disponível em breve.')
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.activeOutlineButtonText}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.emptyActiveCard}>
                  <Text style={styles.emptyActiveTitle}>Nenhuma promoção ativa</Text>
                  <Text style={styles.emptyActiveSubtitle}>
                    Crie um novo desconto e destaque seus serviços com mais visibilidade.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (isCreating || isVerificationPending) && styles.primaryButtonDisabled,
                    ]}
                    onPress={handleOpenModal}
                    disabled={isCreating || isVerificationPending}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.primaryButtonText}>Criar promoção</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>Histórico de promoções</Text>
                <Text style={styles.historySubtitle}>Acompanhe cada oferta já criada.</Text>
              </View>
              {sortedPromotions.length === 0 ? (
                emptyHistory
              ) : (
                sortedPromotions.map((promotion) => renderHistoryCard(promotion))
              )}
            </View>
          </View>
        )}
      </ScrollView>

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
                  trackColor={{ false: '#dcdcdc', true: Colors.light.primary }}
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
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  backButton: {
    width: Platform.OS === 'ios' ? 40 : 32,
    height: Platform.OS === 'ios' ? 40 : 32,
    top: Platform.OS === 'ios' ? 0 : 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Platform.OS === 'ios' ? 18 : 17,
    right: Platform.OS === 'ios' ? 0 : 16,
    top: Platform.OS === 'ios' ? 0 : 2,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
  verificationBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#fff4e6',
    borderColor: '#f5c16a',
    borderWidth: 1,
  },
  verificationBannerTitle: {
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    fontWeight: '700',
    color: '#b35a00',
  },
  verificationBannerText: {
    fontSize: Platform.OS === 'ios' ? 13 : 12,
    color: '#8a5b00',
    marginTop: 4,
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
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  activeSection: {
    marginBottom: 24,
  },
  activeCard: {
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  activeCardHighlight: {
    shadowOpacity: 0.35,
  },
  discountCircle: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  activePercentage: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginTop: 8,
  },
  activeValid: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
  },
  activeActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
  activeActionButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
  },
  activeActionButtonDisabled: {
    opacity: 0.7,
  },
  activeActionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  activeOutlineButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeOutlineButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyActiveCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#edeff3',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyActiveTitle: {
    fontSize: Platform.OS === 'ios' ? 20 : 18,
    fontWeight: '700',
    color: '#333',
  },
  emptyActiveSubtitle: {
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    color: '#555',
    marginTop: 6,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize:  Platform.OS === 'ios' ? 16 : 16,
  },
  historySection: {
    backgroundColor: '#fff',
  },
  historyHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  historySubtitle: {
    fontSize:  Platform.OS === 'ios' ? 13 : 14,
    color: '#666',
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statusIndicator: {
    width: 4,
    height: '60%',
    borderRadius: 2,
    marginRight: 12,
    marginTop: 8,
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
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillIcon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
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
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyToggleLabel: {
    fontSize: 13,
    color: '#475569',
  },
  toggleControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLoader: {
    marginLeft: 8,
  },
  skeletonCard: {
    height: 140,
    backgroundColor: '#F3F5F8',
    borderRadius: 20,
  },
  skeletonActiveCard: {
    height: 140,
    borderRadius: 20,
    backgroundColor: '#F3F5F8',
    marginBottom: 16,
  },
  skeletonHistoryCard: {
    height: 120,
    borderRadius: 20,
    backgroundColor: '#F3F5F8',
    marginBottom: 16,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyStateSubtitle: {
    fontSize:  Platform.OS === 'ios' ? 14 : 15,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
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
    paddingBottom: 120,
    position: 'relative',
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
    color: Colors.light.text,
  },
  modalCloseText: {
    color: Colors.light.primary,
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
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
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
    color: Colors.light.error,
    fontSize: 13,
  },
  saveButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
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

