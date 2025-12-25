import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
} from 'react-native';
import Toast from 'react-native-toast-message';
import ProviderNavBar from '../../../components/provider/navigation/ProviderNavBar';
import Colors from '../../../constants/Colors';
import {
  createProviderPromotion,
  listProviderPromotions,
  updateProviderPromotion,
} from '../../../services/providerPromotionsService';
import { ProviderPromotionDto } from '../../../types/backend/providerPromotions';
import { getUserMessage } from '../../_shared/errors/uiFeedback';

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
  const router = useRouter();

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
    const statusLabel = expired
      ? 'EXPIRADA'
      : promotion.isActive
        ? 'ATIVA'
        : 'DESATIVADA';

    return (
      <View key={promotion.id} style={styles.historyCard}>
        <View style={styles.historyCardHeader}>
          <Text style={styles.historyPercent}>{promotion.percentOff}% OFF</Text>
          <View
            style={[
              styles.statusBadge,
              promotion.isActive && !expired ? styles.badgeActive : expired ? styles.badgeExpired : styles.badgeDisabled,
            ]}
          >
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
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
    );
  };

  const renderSkeleton = () => (
    <View style={styles.section}>
      <View style={[styles.activeCard, styles.skeletonCard]} />
      {Array.from({ length: 2 }).map((_, index) => (
        <View key={`skeleton-${index}`} style={[styles.historyCard, styles.skeletonCard]} />
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
                <View style={styles.activeCard}>
                  <Text style={styles.activeDiscount}>-{activePromotion.percentOff}%</Text>
                  <Text style={styles.activeValid}>
                    Válida até {formatFullDate(activePromotion.validUntil)}
                  </Text>
                  <Text style={styles.activeTitle}>{activePromotion.title || 'Promoção ativa'}</Text>
                  <View style={styles.activeActions}>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        (togglingId === activePromotion.id || isVerificationPending) && styles.secondaryButtonDisabled,
                      ]}
                      onPress={() => handleTogglePromotion(activePromotion)}
                      disabled={togglingId === activePromotion.id || isVerificationPending}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {togglingId === activePromotion.id ? (
                        <ActivityIndicator color={Colors.light.text} size="small" />
                      ) : (
                        <Text style={styles.secondaryButtonText}>Desativar</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryOutlineButton}
                      onPress={() => Alert.alert('Editar promoção', 'Edição disponível em breve.')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.primaryOutlineButtonText}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Criar promoção</Text>
            <Text style={styles.modalLabel}>Título (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Promoção de boas-vindas"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.modalLabel}>Desconto</Text>
            <View style={styles.optionRow}>
              {PERCENT_OPTIONS.map((percent) => (
                <TouchableOpacity
                  key={percent}
                  style={[
                    styles.optionButton,
                    selectedPercent === percent && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedPercent(percent)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedPercent === percent && styles.optionButtonTextActive,
                    ]}
                  >
                    {percent}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Duração</Text>
            <View style={styles.optionRow}>
              {DURATION_OPTIONS.map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.optionButton,
                    selectedDuration === days && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedDuration(days)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedDuration === days && styles.optionButtonTextActive,
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

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (isCreating || !selectedPercent) && styles.saveButtonDisabled,
                ]}
                onPress={handleCreatePromotion}
                disabled={isCreating || !selectedPercent}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isCreating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar promoção</Text>
                )}
              </TouchableOpacity>
            </View>
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
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    top: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    top: 10,
    right: 19,
    textAlign: 'center', 
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    lineHeight: 20,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#b35a00',
  },
  verificationBannerText: {
    fontSize: 13,
    color: '#8a5b00',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  activeSection: {
    marginBottom: 24,
  },
  activeCard: {
    backgroundColor: '#f7f9fc',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#edf1f7',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 0,
  },
  activeDiscount: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  activeValid: {
    fontSize: 14,
    color: '#556',
    marginTop: 6,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    color: '#222',
  },
  activeActions: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'space-between',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.primary,
    minWidth: 130,
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  primaryOutlineButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 130,
    alignItems: 'center',
  },
  primaryOutlineButtonText: {
    color: '#333',
    fontWeight: '700',
  },
  emptyActiveCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#edeff3',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 0,
  },
  emptyActiveTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  emptyActiveSubtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
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
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeActive: {
    backgroundColor: `${Colors.light.primary}15`,
  },
  badgeExpired: {
    backgroundColor: '#fbe2e2',
  },
  badgeDisabled: {
    backgroundColor: '#e6e6e6',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  historyDate: {
    fontSize: 13,
    color: '#666',
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
    color: '#4a4a4a',
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
    backgroundColor: '#f3f5f8',
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
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    marginRight: 8,
  },
  optionButtonActive: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}1a`,
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  optionButtonTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  validUntilText: {
    fontSize: 13,
    color: '#888',
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
  },
  modalError: {
    marginTop: 10,
    color: '#a00',
    fontSize: 13,
  },
  modalActions: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PromotionsScreen;
