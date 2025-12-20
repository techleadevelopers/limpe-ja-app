import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ActivityIndicator,
  Easing,
  AccessibilityInfo,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { showOverlay } from '../../../hooks/useOverlayMessage';
import * as Haptics from 'expo-haptics';

// Types
import { PricingType, Service } from '../../../types/backend/services';
import {
  getProviderServicesOffered,
  addProviderServiceOffering,
  updateProviderServiceOffering,
  deleteProviderServiceOffering,
} from '../../../services/providerService';
import { ProviderServiceOffering as ProviderServiceType } from '../../../types/backend/provider-service';
import { CreateProviderServiceData, UpdateProviderServiceData } from '../../../types/backend/providers';
import { getServiceCategories } from '../../../services/commonServiceCatalog';

// ===== Catálogo fallback (garante opções como Residencial/Comercial se backend ainda não responder) =====
const FALLBACK_SERVICES: Service[] = [
  { id: '3f17467b-e198-4072-87f0-0213d2d08997', name: 'Residencial', description: 'Limpeza de residências', price: null },
  { id: '78cc63ad-a18d-4ba0-b0b8-28624412caf3', name: 'Comercial', description: 'Limpeza comercial', price: null },
  { id: '0a8ea519-63e4-4efb-a03a-628dbbc9f052', name: 'Pós-Obra', description: 'Limpeza pós-obra', price: null },
  { id: '2559b9e2-0526-4304-9d04-89606b424074', name: 'Escritório', description: 'Limpeza de escritórios', price: null },
  { id: 'c8c6bfee-598f-4de0-a383-0f6101699b15', name: 'Vidros', description: 'Limpeza de vidros', price: null },
  { id: '3abda78a-264f-4745-9094-83cad16e65f3', name: 'Estofados', description: 'Higienização de estofados', price: null },
];

// ===== Design Tokens (Premium UI - Alinhado para iOS Clean) =====
const Colors = {
  primary: 'rgba(0,122,255,0.9)',
  primaryDark: 'rgba(0,122,255,0.7)',
  link: '#007AFF',
  bgSoft: '#E3F2FD',
  surface: '#FFFFFF',
  border: '#E9ECEF',
  fieldBg: '#F8F9FA',
  text: '#212529',
  textMuted: '#6C757D',
  textSubtle: '#868E96',
  danger: '#D32F2F',
  success: '#2E7D32',
  shadow: 'rgba(0,122,255,0.3)',
};

const Radii = {
  xl: 24,
  pill: 28,
  sm: 12,
};

const Spacing = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};

// ===== Helpers =====
const easeOut = Easing.out(Easing.ease);

const PRICING_OPTIONS = [
  {
    value: PricingType.FIXED_PRICE,
    label: 'Preço Fixo',
    description: 'Valor único para todo o serviço',
  },
  {
    value: PricingType.HOURLY,
    label: 'Por Hora',
    description: 'Cobra por hora trabalhada',
  },
];

/**
 * Helper para aplicar toFixed() de forma segura, evitando erros em valores não numéricos.
 * Retorna uma string formatada ou uma string vazia/padrão se o valor não for um número válido.
 */
function safeToFixed(value: any, digits: number = 2, defaultValue: string = ''): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(digits);
  }
  return defaultValue;
}

function normalizeCurrencyInput(v: string) {
  // aceita strings como "R$ 1.234,56", "1234.56", "123456"
  const digits = String(v).replace(/[^\d]/g, '');
  if (!digits) return { raw: '', display: '' };
  const cents = parseInt(digits, 10);
  const raw = (cents / 100).toFixed(2); // "1234.56"
  const parts = raw.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const display = `R$ ${intPart},${parts[1]}`;
  return { raw, display };
}

function parseDurationToMinutes(input: string | undefined) {
  if (!input) return undefined;
  const str = input.toLowerCase().trim();

  const onlyNumber = str.match(/^\d+$/);
  if (onlyNumber) return parseInt(onlyNumber[0], 10);

  const hm = str.match(/(\d+)\s*h(?:oras?)?\s*(\d+)?/);
  if (hm) {
    const h = parseInt(hm[1], 10);
    const m = hm[2] ? parseInt(hm[2], 10) : 0;
    return h * 60 + m;
  }

  const minutes = str.match(/(\d+)\s*(?:min|mins|minutos?)/);
  if (minutes) return parseInt(minutes[1], 10);

  const anyNum = str.match(/\d+/);
  return anyNum ? parseInt(anyNum[0], 10) : undefined;
}

// Hook para verificar se o movimento reduzido está ativado
function useReducedMotion() {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    const updateReducedMotion = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (mounted) setIsReducedMotionEnabled(enabled);
      } catch (e) {
        // não crítico
      }
    };

    updateReducedMotion();

    const subscription = AccessibilityInfo.addEventListener
      ? AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled: boolean) => setIsReducedMotionEnabled(enabled))
      : (AccessibilityInfo as any).addEventListener?.('change', (enabled: boolean) => setIsReducedMotionEnabled(enabled));

    return () => {
      mounted = false;
      try {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        } else if ((AccessibilityInfo as any).removeEventListener) {
          (AccessibilityInfo as any).removeEventListener('reduceMotionChanged', setIsReducedMotionEnabled as any);
          (AccessibilityInfo as any).removeEventListener('change', setIsReducedMotionEnabled as any);
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return isReducedMotionEnabled;
}

// ===== Animated Item (tipado estritamente) =====
interface ServiceOffering {
  id: string;
  name: string;
  serviceId: string;
  description: string;
  price: number;
  duration?: string;
  pricingType: PricingType;
  pricePerSquareMeter?: number;
  pricePerRoom?: number;
}

const AnimatedServiceItem: React.FC<{
  item: ServiceOffering;
  onEdit: (service: ServiceOffering) => void;
  onDelete: (serviceId: string) => void;
  delay: number;
  isReducedMotionEnabled: boolean;
}> = ({ item, onEdit, onDelete, delay, isReducedMotionEnabled }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animationDuration = isReducedMotionEnabled ? 0 : 500;
    const animationDelay = isReducedMotionEnabled ? 0 : delay;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: animationDuration, delay: animationDelay, easing: easeOut, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: animationDuration, delay: animationDelay, easing: easeOut, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, delay, isReducedMotionEnabled]);

  const onPressInItem = () => {
    if (!isReducedMotionEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start();
    }
  };

  const onPressOutItem = () => {
    if (!isReducedMotionEnabled) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Excluir Serviço',
      `Tem certeza que deseja excluir "${item.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) },
      ],
      { cancelable: true }
    );
  };

  const formatPriceDisplay = (service: ServiceOffering) => {
    switch (service.pricingType) {
      case PricingType.FIXED_PRICE: {
        const fixedPrice = safeToFixed(service.price, 2);
        return fixedPrice ? `R$ ${fixedPrice.replace('.', ',')}` : 'Preço a definir';
      }
      case PricingType.HOURLY: {
        const hourlyPrice = safeToFixed(service.price, 2);
        return hourlyPrice ? `R$ ${hourlyPrice.replace('.', ',')}/hora` : 'Preço a definir';
      }
      case PricingType.BY_SIZE: {
        let sizePrice = '';
        const pricePerSquareMeterFormatted = safeToFixed(service.pricePerSquareMeter, 2);
        if (pricePerSquareMeterFormatted) {
          sizePrice += `R$ ${pricePerSquareMeterFormatted.replace('.', ',')}/m²`;
        }
        const pricePerRoomFormatted = safeToFixed(service.pricePerRoom, 2);
        if (pricePerRoomFormatted) {
          sizePrice += (sizePrice ? ' à ' : '') + `R$ ${pricePerRoomFormatted.replace('.', ',')}/cômodo`;
        }
        return sizePrice || 'A definir';
      }
      default:
        return 'Preço a consultar';
    }
  };

  return (
    <Animated.View
      style={[
        styles.serviceItemWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
      accessibilityLabel={`Serviço ${item.name}. Descrição: ${item.description}. Preço: ${formatPriceDisplay(item)}. Toque para editar ou excluir.`}
    >
      <TouchableOpacity
        onPressIn={onPressInItem}
        onPressOut={onPressOutItem}
        activeOpacity={0.92}
        style={styles.serviceItem}
      >
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {item.name}
          </Text>
          {!!item.description && (
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.servicePrice}>Preço: {formatPriceDisplay(item)}</Text>
          {!!item.duration && item.pricingType !== PricingType.BY_SIZE && (
            <Text style={styles.serviceDuration}>Duração: {item.duration}</Text>
          )}
        </View>

        <View style={styles.serviceActions}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={styles.iconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${item.name}`}
          >
            <Ionicons name="create-outline" size={22} color={Colors.primary} accessibilityHidden={true} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmDelete}
            style={styles.iconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`Excluir ${item.name}`}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.danger} accessibilityHidden={true} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ===== Main Screen =====
export default function EditProviderServicesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<ServiceOffering | null>(null);

  const [availableBaseServices, setAvailableBaseServices] = useState<Service[]>([]);
  const [selectedBaseServiceId, setSelectedBaseServiceId] = useState<string | undefined>(undefined);
  const [isReloadingCatalog, setIsReloadingCatalog] = useState(false);
  const [isUsingFallbackCatalog, setIsUsingFallbackCatalog] = useState(false);

  // ✅ NEW: Sheet premium de seleção do tipo
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [typeQuery, setTypeQuery] = useState('');
  const [pricingSheetOpen, setPricingSheetOpen] = useState(false);
  const [pricingQuery, setPricingQuery] = useState('');

  const SERVICE_NAME_SUGGESTIONS = useMemo(
    () => ['Residencial', 'Comercial..'],
    []
  );

  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [servicePriceDisplay, setServicePriceDisplay] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>(PricingType.FIXED_PRICE);
  const [pricePerSquareMeter, setPricePerSquareMeter] = useState('');
  const [pricePerSquareMeterDisplay, setPricePerSquareMeterDisplay] = useState('');
  const [pricePerRoom, setPricePerRoom] = useState('');
  const [pricePerRoomDisplay, setPricePerRoomDisplay] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  // Smart Step: Assistente de Serviço
  const [ssVisible, setSsVisible] = useState(false);
  const [ssStep, setSsStep] = useState<1 | 2 | 3>(1);

  // Animations (refinadas para iOS premium)
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const listHeaderAnim = useRef(new Animated.Value(0)).current;
  const saveButtonAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const isReducedMotionEnabled = useReducedMotion();

  // ✅ Selected service (para o campo compacto)
  const selectedService = useMemo(
    () => availableBaseServices.find(s => s.id === selectedBaseServiceId),
    [availableBaseServices, selectedBaseServiceId]
  );

  // ✅ Filtered services (busca no sheet)
  const filteredServices = useMemo(() => {
    const q = typeQuery.trim().toLowerCase();
    if (!q) return availableBaseServices;
    return availableBaseServices.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    );
  }, [availableBaseServices, typeQuery]);
  const filteredPricingOptions = useMemo(() => {
    const q = pricingQuery.trim().toLowerCase();
    if (!q) return PRICING_OPTIONS;
    return PRICING_OPTIONS.filter(option =>
      option.label.toLowerCase().includes(q) ||
      option.description.toLowerCase().includes(q)
    );
  }, [pricingQuery]);

  useEffect(() => {
    const animationDuration = isReducedMotionEnabled ? 0 : 600;
    Animated.timing(headerAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }).start();

    const fetchAllData = async () => {
      if (!user?.providerDetails?.id) {
        Alert.alert('Erro', 'ID do provedor não encontrado. Faça login novamente.');
        setIsLoading(false);
        Animated.timing(feedbackAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }).start();
        return;
      }
      try {
        const fetchedBaseServices = await getServiceCategories();
        setAvailableBaseServices(fetchedBaseServices || []);

        const fetchedProviderServices = await getProviderServicesOffered(user.providerDetails.id);
        const mapped: ServiceOffering[] = (fetchedProviderServices || []).map((s: ProviderServiceType) => ({
          id: s.id,
          name: s.service.name,
          serviceId: s.service.id,
          description: s.description || '',
          price: typeof s.price === 'number' && Number.isFinite(s.price) ? parseFloat(s.price.toString()) : 0,
          duration: s.durationMinutes ? `${s.durationMinutes} minutos` : undefined,
          pricingType: s.pricingType,
          pricePerSquareMeter:
            typeof s.pricePerSquareMeter === 'number' && Number.isFinite(s.pricePerSquareMeter)
              ? parseFloat(s.pricePerSquareMeter.toString())
              : undefined,
          pricePerRoom:
            typeof s.pricePerRoom === 'number' && Number.isFinite(s.pricePerRoom)
              ? parseFloat(s.pricePerRoom.toString())
              : undefined,
        }));
        setServices(mapped.sort((a, b) => a.name.localeCompare(b.name)));

        if (fetchedBaseServices && fetchedBaseServices.length > 0) {
          setSelectedBaseServiceId(fetchedBaseServices[0].id);
        } else {
          setSelectedBaseServiceId(undefined);
        }
      } catch (error: any) {
        console.error('[EditProviderServicesScreen] Erro ao carregar dados:', error);
        Alert.alert('Erro', error?.message || 'Não foi possível carregar seus serviços ou o catálogo de serviços.');
      } finally {
        setIsLoading(false);
        const staggerDelay = isReducedMotionEnabled ? 0 : 160;
        Animated.stagger(staggerDelay, [
          Animated.timing(formAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }),
          Animated.timing(listHeaderAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }),
          Animated.timing(saveButtonAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }),
        ]).start();
        Animated.timing(feedbackAnim, { toValue: 1, duration: animationDuration, easing: easeOut, useNativeDriver: true }).start();
      }
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isReducedMotionEnabled]);

  // Fallback automático: se o catálogo vier vazio e não estiver carregando
  useEffect(() => {
    if (!isLoading && availableBaseServices.length === 0) {
      setAvailableBaseServices(FALLBACK_SERVICES);
      setIsUsingFallbackCatalog(true);
      if (!selectedBaseServiceId && FALLBACK_SERVICES.length > 0) {
        setSelectedBaseServiceId(FALLBACK_SERVICES[0].id);
      }
    }
  }, [isLoading, availableBaseServices.length, selectedBaseServiceId]);

  const reloadServiceCatalog = async () => {
    try {
      setIsReloadingCatalog(true);
      const fetchedBaseServices = await getServiceCategories();
      setAvailableBaseServices(fetchedBaseServices || []);
      if (!selectedBaseServiceId && fetchedBaseServices && fetchedBaseServices.length > 0) {
        setSelectedBaseServiceId(fetchedBaseServices[0].id);
      }
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível recarregar o catálogo de serviços.');
    } finally {
      setIsReloadingCatalog(false);
    }
  };

  // ===== Handlers =====
  const handleSaveServices = useCallback(() => {
    showOverlay({ title: 'Serviços salvos com sucesso', variant: 'success' });
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const resetForm = useCallback(() => {
    setIsEditing(null);
    setSelectedBaseServiceId(availableBaseServices.length > 0 ? availableBaseServices[0].id : undefined);
    setServiceDesc('');
    setServicePrice('');
    setServicePriceDisplay('');
    setServiceDuration('');
    setPricingType(PricingType.FIXED_PRICE);
    setPricePerSquareMeter('');
    setPricePerSquareMeterDisplay('');
    setPricePerRoom('');
    setPricePerRoomDisplay('');
    setFormError(null);
  }, [availableBaseServices.length]);

  const handlePriceChange = useCallback(
    (maskedValue: string, setterRaw: (v: string) => void, setterDisplay: (v: string) => void) => {
      const { raw, display } = normalizeCurrencyInput(maskedValue);
      setterRaw(raw);
      setterDisplay(display);
    },
    []
  );

  const handlePricePerSquareMeterChange = useCallback(
    (text: string) => {
      handlePriceChange(text, setPricePerSquareMeter, setPricePerSquareMeterDisplay);
    },
    [handlePriceChange]
  );

  const handlePricePerRoomChange = useCallback(
    (text: string) => {
      handlePriceChange(text, setPricePerRoom, setPricePerRoomDisplay);
    },
    [handlePriceChange]
  );

  const handlePricingTypeSelect = useCallback((value: PricingType) => {
    setPricingType(value);
    setServicePrice('');
    setServicePriceDisplay('');
    setPricePerSquareMeter('');
    setPricePerSquareMeterDisplay('');
    setPricePerRoom('');
    setPricePerRoomDisplay('');
    setServiceDuration('');
    setFormError(null);
  }, []);

  const handleAddOrUpdateService = useCallback(async () => {
    setFormError(null);

    if (!user?.providerDetails?.id) {
      Alert.alert('Erro', 'ID do provedor não encontrado. Faça login novamente.');
      return;
    }

    if (!selectedBaseServiceId) {
      const errorMessage = 'Selecione um tipo de serviço.';
      setFormError(errorMessage);
      AccessibilityInfo.announceForAccessibility?.(errorMessage);
      return;
    }

    let finalPrice = 0;
    let finalPricePerSquareMeter: number | undefined = undefined;
    let finalPricePerRoom: number | undefined = undefined;

    if (pricingType === PricingType.FIXED_PRICE || pricingType === PricingType.HOURLY) {
      if (!servicePrice) {
        const errorMessage = 'O preço é obrigatório para este tipo de precificação.';
        setFormError(errorMessage);
        AccessibilityInfo.announceForAccessibility?.(errorMessage);
        return;
      }
      finalPrice = parseFloat(servicePrice);
      if (Number.isNaN(finalPrice) || finalPrice <= 0) {
        const errorMessage = 'Preço inválido. Deve ser um número maior que zero.';
        setFormError(errorMessage);
        AccessibilityInfo.announceForAccessibility?.(errorMessage);
        return;
      }
    } else if (pricingType === PricingType.BY_SIZE) {
      if (!pricePerSquareMeter && !pricePerRoom) {
        const errorMessage = 'Preencha o preço por m² e/ou por cômodo.';
        setFormError(errorMessage);
        AccessibilityInfo.announceForAccessibility?.(errorMessage);
        return;
      }
      if (pricePerSquareMeter) {
        const v = parseFloat(pricePerSquareMeter);
        if (Number.isNaN(v) || v <= 0) {
          const errorMessage = 'Preço por m² inválido. Deve ser um número maior que zero.';
          setFormError(errorMessage);
          AccessibilityInfo.announceForAccessibility?.(errorMessage);
          return;
        }
        finalPricePerSquareMeter = v;
      }
      if (pricePerRoom) {
        const v = parseFloat(pricePerRoom);
        if (Number.isNaN(v) || v <= 0) {
          const errorMessage = 'Preço por cômodo inválido. Deve ser um número maior que zero.';
          setFormError(errorMessage);
          AccessibilityInfo.announceForAccessibility?.(errorMessage);
          return;
        }
        finalPricePerRoom = v;
      }
    }

    const durationMinutes = parseDurationToMinutes(serviceDuration);
    const baseData: UpdateProviderServiceData = {
      description: serviceDesc.trim(),
      price: finalPrice,
      durationMinutes,
      pricingType,
      pricePerSquareMeter: finalPricePerSquareMeter,
      pricePerRoom: finalPricePerRoom,
    };
    const createData: CreateProviderServiceData = {
      serviceId: selectedBaseServiceId as string,
      price: finalPrice,
      durationMinutes,
      description: serviceDesc.trim(),
      pricingType,
      pricePerSquareMeter: finalPricePerSquareMeter,
      pricePerRoom: finalPricePerRoom,
    };

    setIsLoading(true);
    try {
      let resultService: ProviderServiceType;
      if (isEditing) {
        resultService = await updateProviderServiceOffering(user.providerDetails.id, isEditing.id, baseData);
        setServices(prev =>
          prev
            .map((s: ServiceOffering) =>
              s.id === isEditing.id
                ? {
                    id: resultService.id,
                    name: resultService.service.name,
                    serviceId: resultService.service.id,
                    description: resultService.description || '',
                    price: typeof resultService.price === 'number' && Number.isFinite(resultService.price) ? parseFloat(resultService.price.toString()) : 0,
                    duration: resultService.durationMinutes ? `${resultService.durationMinutes} minutos` : undefined,
                    pricePerSquareMeter:
                      typeof resultService.pricePerSquareMeter === 'number' && Number.isFinite(resultService.pricePerSquareMeter)
                        ? parseFloat(resultService.pricePerSquareMeter.toString())
                        : undefined,
                    pricePerRoom:
                      typeof resultService.pricePerRoom === 'number' && Number.isFinite(resultService.pricePerRoom)
                        ? parseFloat(resultService.pricePerRoom.toString())
                        : undefined,
                    pricingType: resultService.pricingType,
                  }
                : s
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        showOverlay({ title: 'Serviço atualizado com sucesso!', variant: 'success' });
        if (Platform.OS === 'ios') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        resultService = await addProviderServiceOffering(user.providerDetails.id, createData);
        const newService: ServiceOffering = {
          id: resultService.id,
          name: resultService.service.name,
          serviceId: resultService.service.id,
          description: resultService.description || '',
          price: typeof resultService.price === 'number' && Number.isFinite(resultService.price) ? parseFloat(resultService.price.toString()) : 0,
          duration: resultService.durationMinutes ? `${resultService.durationMinutes} minutos` : undefined,
          pricingType: resultService.pricingType,
          pricePerSquareMeter:
            typeof resultService.pricePerSquareMeter === 'number' && Number.isFinite(resultService.pricePerSquareMeter)
              ? parseFloat(resultService.pricePerSquareMeter.toString())
              : undefined,
          pricePerRoom:
            typeof resultService.pricePerRoom === 'number' && Number.isFinite(resultService.pricePerRoom)
              ? parseFloat(resultService.pricePerRoom.toString())
              : undefined,
        };
        setServices(prev => [...prev, newService].sort((a, b) => a.name.localeCompare(b.name)));
        showOverlay({ title: 'Serviço adicionado', subtitle: 'Publicado no seu catálogo', variant: 'success' });
        if (Platform.OS === 'ios') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      resetForm();
    } catch (error: any) {
      console.error('[EditProviderServicesScreen] Erro ao adicionar/atualizar serviço:', error);
      showOverlay({ title: 'Falha ao salvar', subtitle: error?.message || 'Tente novamente', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedBaseServiceId, pricingType, servicePrice, pricePerSquareMeter, pricePerRoom, serviceDuration, serviceDesc, isEditing, resetForm]);

  const startEdit = useCallback((service: ServiceOffering) => {
    setIsEditing(service);
    setSelectedBaseServiceId(service.serviceId);
    setServiceDesc(String(service.description));

    if (service.pricingType === PricingType.FIXED_PRICE || service.pricingType === PricingType.HOURLY) {
      const rawPrice = safeToFixed(service.price, 2);
      setServicePrice(rawPrice);
      setServicePriceDisplay(rawPrice ? normalizeCurrencyInput(String(Math.round(parseFloat(rawPrice) * 100))).display : '');
    } else {
      const rawPricePerSquareMeter = safeToFixed(service.pricePerSquareMeter, 2);
      setPricePerSquareMeter(rawPricePerSquareMeter);
      setPricePerSquareMeterDisplay(rawPricePerSquareMeter ? normalizeCurrencyInput(String(Math.round(parseFloat(rawPricePerSquareMeter) * 100))).display : '');

      const rawPricePerRoom = safeToFixed(service.pricePerRoom, 2);
      setPricePerRoom(rawPricePerRoom);
      setPricePerRoomDisplay(rawPricePerRoom ? normalizeCurrencyInput(String(Math.round(parseFloat(rawPricePerRoom) * 100))).display : '');
    }

    setPricingType(service.pricingType === PricingType.BY_SIZE ? PricingType.FIXED_PRICE : service.pricingType);
    setServiceDuration(String(service.duration || ''));
    setFormError(null);
  }, []);

  const deleteService = useCallback(
    async (serviceId: string) => {
      if (!user?.providerDetails?.id) {
        Alert.alert('Erro', 'ID do provedor não encontrado. Faça login novamente.');
        return;
      }
      setIsLoading(true);
      try {
        await deleteProviderServiceOffering(user.providerDetails.id, serviceId);
        setServices(prev => prev.filter(s => s.id !== serviceId));
        Alert.alert('Sucesso', 'O serviço foi removido da sua lista.');
        resetForm();
      } catch (error: any) {
        console.error('[EditProviderServicesScreen] Erro ao deletar serviço:', error);
        const rawMessage = String(error?.message || '').toLowerCase();
        const isForeignKeyError =
          rawMessage.includes('foreign') ||
          rawMessage.includes('constraint') ||
          rawMessage.includes('booking');
        const friendlyMessage = isForeignKeyError
          ? 'Este serviço está vinculado a agendamentos. Cancele ou conclua esses agendamentos antes de remover.'
          : 'Não foi possível deletar o serviço. Tente novamente ou fale com o suporte.';
        Alert.alert('Erro ao excluir', friendlyMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [user, resetForm]
  );

  // ===== Loading State =====
  if (isLoading) {
    return (
      <View style={styles.outerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View
          style={[
            styles.customHeader,
            { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] as any },
          ]}
        >
          <Text style={styles.headerTitle}>Editar Serviços</Text>
          <View style={styles.headerActionIconPlaceholder} />
        </Animated.View>

        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          <ActivityIndicator size="large" color={Colors.primary} accessibilityLabel="Carregando seus serviços" />
          <Text style={styles.loadingText}>Carregando seus serviços...</Text>
        </Animated.View>
      </View>
    );
  }

  // ===== UI =====
  return (
    <KeyboardAvoidingView
      style={styles.outerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View
        style={[
          styles.customHeader,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] as any },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityRole="button" accessibilityLabel="Voltar para a tela anterior">
          <Ionicons name="arrow-back" size={24} color="#2F3A4A" accessibilityHidden={true} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Serviços</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.formContainer,
            { opacity: formAnim, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] as any },
          ]}
        >
          <Text style={styles.formTitle}>{isEditing ? 'Editar Serviço Existente' : 'Adicionar Novo Serviço'}</Text>

          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Tipo de Serviço</Text>
            <TouchableOpacity
              onPress={reloadServiceCatalog}
              disabled={isReloadingCatalog}
              accessibilityRole="button"
              accessibilityLabel="Recarregar catálogo de serviços"
              style={styles.refreshButton}
            >
              {isReloadingCatalog ? (
                <ActivityIndicator size="small" color={Colors.link} />
              ) : (
                <Ionicons name="refresh" size={18} color={Colors.link} />
              )}
            </TouchableOpacity>
          </View>

          {isUsingFallbackCatalog && (
            <Text style={styles.inputHint}>Usando catálogo padrão enquanto carregamos o catálogo real.</Text>
          )}

          {/* ✅ Campo compacto + Bottom Sheet (substitui os chips) */}
          <TouchableOpacity
            style={[styles.selectField, isEditing && { opacity: 0.5 }]}
            disabled={!!isEditing || availableBaseServices.length === 0}
            onPress={() => {
              setTypeQuery('');
              setTypeSheetOpen(true);
              if (Platform.OS === 'ios') Haptics.selectionAsync();
            }}
            accessibilityRole="button"
            accessibilityLabel="Selecionar tipo de serviço"
          >
            <Text style={styles.selectFieldText}>
              {selectedService?.name || (availableBaseServices.length === 0 ? 'Carregando...' : 'Selecione...')}
            </Text>
            <Text style={styles.selectFieldAction}>{isEditing ? 'Bloqueado' : 'Alterar'}</Text>
          </TouchableOpacity>

          {/* Sugestões compactas (texto único) */}
          {!isEditing && availableBaseServices.length > 0 && (
            <Text style={styles.suggestionsText}>Sugestões: {SERVICE_NAME_SUGGESTIONS.join(', ')}</Text>
          )}

          {isEditing && (
            <Text style={styles.inputHint}>Você não pode alterar o tipo de serviço de um serviço existente.</Text>
          )}

          {availableBaseServices.length === 0 && !isLoading && (
            <Text style={styles.formErrorText} accessibilityLiveRegion="polite">
              Nenhum tipo de serviço base disponível. Verifique a conexão ou o backend.
            </Text>
          )}

          <Text style={styles.inputLabel}>Descrição Detalhada</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Ex: Inclui aspiração, lavagem de banheiros, limpeza de cozinha..."
            placeholderTextColor={Colors.textMuted}
            value={serviceDesc}
            onChangeText={setServiceDesc}
            multiline
            accessibilityLabel="Descrição do serviço"
            accessibilityHint="Descreva o que seu serviço inclui para o cliente."
          />

          <Text style={styles.inputLabel}>Tipo de Precificação</Text>
          <TouchableOpacity
            style={[styles.selectField, { marginBottom: Spacing.sm }, isEditing && { opacity: 0.5 }]}
            onPress={() => {
              setPricingQuery('');
              setPricingSheetOpen(true);
              if (Platform.OS === 'ios') Haptics.selectionAsync();
            }}
            accessibilityRole="button"
            accessibilityLabel="Selecionar tipo de precificação"
          >
            <Text style={styles.selectFieldText}>
              {PRICING_OPTIONS.find(o => o.value === pricingType)?.label || 'Selecionar...'}
            </Text>
            <Text style={styles.selectFieldAction}>{isEditing ? 'Bloqueado' : 'Alterar'}</Text>
          </TouchableOpacity>
          {(pricingType === PricingType.FIXED_PRICE || pricingType === PricingType.HOURLY) && (
            <>
              <Text style={styles.inputLabel}>
                {pricingType === PricingType.FIXED_PRICE ? 'Preço Fixo' : 'Valor por Hora'}
              </Text>
              <TextInput
                style={[styles.input, formError?.includes('Preço') ? styles.inputError : undefined]}
                placeholder={pricingType === PricingType.FIXED_PRICE ? 'Ex: R$ 250,00' : 'Ex: R$ 60,00'}
                placeholderTextColor={Colors.textMuted}
                value={servicePriceDisplay}
                onChangeText={txt => handlePriceChange(txt, setServicePrice, setServicePriceDisplay)}
                keyboardType="numeric"
                accessibilityLabel={pricingType === PricingType.FIXED_PRICE ? 'Preço Fixo' : 'Valor por Hora'}
                accessibilityHint="Informe o valor do serviço ou da hora trabalhada."
              />
              <Text style={styles.inputLabel}>Duração Estimada</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 2h ou 120 min ou 2 horas"
                placeholderTextColor={Colors.textMuted}
                value={serviceDuration}
                onChangeText={setServiceDuration}
                keyboardType="default"
                accessibilityLabel="Duração estimada do serviço"
                accessibilityHint="Informe a duração esperada do serviço."
              />
            </>
          )}

          {!!formError && <Text style={styles.formErrorText} accessibilityLiveRegion="polite">{formError}</Text>}

          <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleAddOrUpdateService} accessibilityRole="button" accessibilityLabel={isEditing ? 'Atualizar Serviço' : 'Adicionar Novo Serviço'}>
            <Text style={styles.actionButtonPrimaryText}>{isEditing ? 'Atualizar Serviço' : 'Adicionar Novo Serviço'}</Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={resetForm} accessibilityRole="button" accessibilityLabel="Cancelar Edição e Limpar Formulário">
              <Text style={styles.actionButtonSecondaryText}>Cancelar Edição</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.Text
          style={[
            styles.listHeader,
            { opacity: listHeaderAnim, transform: [{ translateY: listHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] as any },
          ]}
        >
          Serviços Cadastrados
        </Animated.Text>

        {services.length === 0 ? (
          <Animated.View style={[styles.emptyListContainer, { opacity: feedbackAnim }]}>
            <Ionicons name="pricetags-outline" size={64} color="#CED4DA" accessibilityHidden={true} />
            <Text style={styles.emptyListText}>Você ainda não adicionou serviços.</Text>
            <Text style={styles.emptyListSubText}>Use o formulário acima para começar -- é rapidinho.</Text>
            <TouchableOpacity
              style={[styles.actionButtonPrimary, { marginTop: Spacing.md }]}
              onPress={() => { setSsStep(1); setSsVisible(true); }}
              accessibilityRole="button"
              accessibilityLabel="Adicionar meu primeiro serviço"
            >
              <Text style={styles.actionButtonPrimaryText}>Adicionar meu primeiro serviço</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.flatListContent} accessibilityLabel="Lista de serviços que você oferece">
            {services.map((item, index) => (
              <View key={item.id}>
                <AnimatedServiceItem item={item} onEdit={startEdit} onDelete={deleteService} delay={index * 60 + 140} isReducedMotionEnabled={isReducedMotionEnabled} />
                {index < services.length - 1 && <View style={styles.listSeparator} />}
              </View>
            ))}
          </View>
        )}

        <Animated.View
          style={[
            styles.saveButtonContainer,
            { opacity: saveButtonAnim, transform: [{ translateY: saveButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] as any },
          ]}
        >
          <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleSaveServices} accessibilityRole="button" accessibilityLabel="Salvar Todas as Alterações">
            <Text style={styles.actionButtonPrimaryText}>Salvar Todas as Alterações</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* ✅ Bottom Sheet: Tipo de Serviço */}
      {typeSheetOpen && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setTypeSheetOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar seleção de tipo"
          />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Escolha o tipo de serviço</Text>
                <Text style={styles.sheetSub}>Toque para selecionar</Text>
              </View>
              <TouchableOpacity onPress={() => setTypeSheetOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={Colors.textMuted} />
              <TextInput
                value={typeQuery}
                onChangeText={setTypeQuery}
                placeholder="Buscar (ex: residencial, vidros...)"
                placeholderTextColor={Colors.textMuted}
                style={{ flex: 1, paddingVertical: 10, color: Colors.text }}
              />
            </View>

            <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
              {filteredServices.map(s => {
                const selected = s.id === selectedBaseServiceId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.sheetRow, selected && styles.sheetRowSelected]}
                    onPress={() => {
                      setSelectedBaseServiceId(s.id);
                      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar ${s.name}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetRowTitle, selected && { color: Colors.primary }]} numberOfLines={1}>
                        {s.name}
                      </Text>
                      {!!s.description && (
                        <Text style={styles.sheetRowDesc} numberOfLines={1}>
                          {s.description}
                        </Text>
                      )}
                    </View>
                    {selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}

              {filteredServices.length === 0 && (
                <View style={{ paddingVertical: 18 }}>
                  <Text style={{ textAlign: 'center', color: Colors.textMuted }}>
                    Nenhum resultado para "{typeQuery}"
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity style={[styles.sheetBtn, styles.sheetBtnGhost]} onPress={() => setTypeSheetOpen(false)}>
                <Text style={styles.sheetBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetBtnPrimary]}
                onPress={() => {
                  setTypeSheetOpen(false);
                  if (Platform.OS === 'ios') Haptics.selectionAsync();
                }}
              >
                <Text style={styles.sheetBtnPrimaryText}>Selecionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {pricingSheetOpen && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setPricingSheetOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar seleção de precificação"
          />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Escolha a precificação</Text>
                <Text style={styles.sheetSub}>Toque para aplicar</Text>
              </View>
              <TouchableOpacity onPress={() => setPricingSheetOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={Colors.textMuted} />
              <TextInput
                value={pricingQuery}
                onChangeText={setPricingQuery}
                placeholder="Buscar"
                placeholderTextColor={Colors.textMuted}
                style={{ flex: 1, paddingVertical: 10, color: Colors.text }}
              />
            </View>

            <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
              {filteredPricingOptions.map(option => {
                const selected = option.value === pricingType;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.sheetRow, selected && styles.sheetRowSelected]}
                    onPress={() => {
                      handlePricingTypeSelect(option.value);
                      setPricingSheetOpen(false);
                      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar ${option.label}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetRowTitle, selected && { color: Colors.primary }]}>{option.label}</Text>
                      <Text style={styles.sheetRowDesc} numberOfLines={1}>
                        {option.description}
                      </Text>
                    </View>
                    {selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity style={[styles.sheetBtn, styles.sheetBtnGhost]} onPress={() => setPricingSheetOpen(false)}>
                <Text style={styles.sheetBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Smart Step: Assistente de Serviço */}
      {ssVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assistente de Serviço</Text>
            <Text style={styles.stepSubtitle}>Passo {ssStep} de 3</Text>

            {ssStep === 1 && (
              <View>
                <Text style={styles.stepTitle}>O que você oferece?</Text>
                <View style={styles.modalChipsRow}>
                  {availableBaseServices.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.modalChip, selectedBaseServiceId === s.id && styles.modalChipActive]}
                      onPress={() => { setSelectedBaseServiceId(s.id); if (Platform.OS === 'ios') Haptics.selectionAsync(); }}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar ${s.name}`}
                    >
                      <Text style={[styles.modalChipText, selectedBaseServiceId === s.id && styles.modalChipTextActive]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={() => setSsStep(2)}>
                    <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {ssStep === 2 && (
              <View>
                <Text style={styles.stepTitle}>Como você cobra?</Text>
                <View style={styles.modalChipsRow}>
                  <TouchableOpacity style={[styles.modalChip, pricingType === PricingType.FIXED_PRICE && styles.modalChipActive]} onPress={() => setPricingType(PricingType.FIXED_PRICE)}>
                    <Text style={[styles.modalChipText, pricingType === PricingType.FIXED_PRICE && styles.modalChipTextActive]}>Fixo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalChip, pricingType === PricingType.HOURLY && styles.modalChipActive]} onPress={() => setPricingType(PricingType.HOURLY)}>
                    <Text style={[styles.modalChipText, pricingType === PricingType.HOURLY && styles.modalChipTextActive]}>Por Hora</Text>
                  </TouchableOpacity>
                </View>

                {(pricingType === PricingType.FIXED_PRICE || pricingType === PricingType.HOURLY) && (
                  <>
                    <Text style={styles.inputLabel}>{pricingType === PricingType.FIXED_PRICE ? 'Preço Fixo' : 'Valor por Hora'}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={pricingType === PricingType.FIXED_PRICE ? 'Ex: R$ 250,00' : 'Ex: R$ 60,00'}
                      placeholderTextColor={Colors.textMuted}
                      value={servicePriceDisplay}
                      onChangeText={txt => handlePriceChange(txt, setServicePrice, setServicePriceDisplay)}
                      keyboardType="numeric"
                    />
                  </>
                )}

                <Text style={styles.inputLabel}>Duração estimada</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 2h ou 120 min"
                  placeholderTextColor={Colors.textMuted}
                  value={serviceDuration}
                  onChangeText={setServiceDuration}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setSsStep(1)}>
                    <Text style={styles.modalButtonText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={() => setSsStep(3)}>
                    <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {ssStep === 3 && (
              <View>
                <Text style={styles.stepTitle}>Revisar</Text>
                <View style={styles.summaryCard}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ flex: 1, color: Colors.text }}>
                    {(() => {
                      const base = availableBaseServices.find(s => s.id === selectedBaseServiceId)?.name || 'Serviço';
                      if (pricingType === PricingType.FIXED_PRICE) return `${base} – Fixo – ${servicePriceDisplay || 'R$ –'} – ${serviceDuration || '–'}`;
                      if (pricingType === PricingType.HOURLY) return `${base} – Por hora – ${servicePriceDisplay || 'R$ –/h'} – ${serviceDuration || '–'}`;
                      return `${base} – m²/Cômodo – ${pricePerSquareMeterDisplay || '–'}/${pricePerRoomDisplay || '–'} – ${serviceDuration || '–'}`;
                    })()}
                  </Text>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setSsStep(2)}>
                    <Text style={styles.modalButtonText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalConfirm]}
                    onPress={async () => {
                      await handleAddOrUpdateService();
                      setSsVisible(false);
                      AccessibilityInfo.announceForAccessibility?.('Serviço salvo');
                    }}
                  >
                    <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Concluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  assistantCTA: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: Spacing.sm,
  },
  assistantCTAText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Modal overlay (reuso p/ sheets e wizard)
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },

  // Smart Step modal
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 18 }, android: { elevation: 12 } }),
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  stepSubtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
  summaryCard: { backgroundColor: Colors.fieldBg, borderRadius: Radii.sm, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, borderWidth: 0.5, borderColor: Colors.border },
  modalChipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md },
  modalChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: Colors.fieldBg, margin: 6, borderWidth: 0.5, borderColor: Colors.border },
  modalChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modalChipText: { color: Colors.text, fontWeight: '600' },
  modalChipTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radii.pill, marginLeft: Spacing.sm },
  modalCancel: { backgroundColor: Colors.fieldBg },
  modalConfirm: { backgroundColor: Colors.primary },
  modalButtonText: { color: Colors.text, fontWeight: '700' },
  modalConfirmText: { color: '#fff' },

  // Screen
  outerContainer: { flex: 1, backgroundColor: '#f2f2f2' },
  scrollViewContent: { paddingBottom: 50, paddingHorizontal: Spacing.sm },

  customHeader: {
    paddingTop: 28,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerBackButton: { marginRight: Spacing.xs, padding: Spacing.sm, top: 15, },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#2F3A4A', flex: 1,top: 15, textAlign: 'center' },
  headerActionIconPlaceholder: { width: 28, marginLeft: Spacing.xs },

  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.bgSoft,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 17,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },

  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },

  input: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    paddingHorizontal: Spacing.lg,
    fontSize: 17,
    color: Colors.text,
    marginBottom: Spacing.md,
    minHeight: 48,
    ...Platform.select({ ios: { borderWidth: 0.5, borderColor: Colors.border } }),
  },
  inputError: { borderColor: Colors.danger, borderWidth: 1.5 },

  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  refreshButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: 'transparent' },

  inputHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },

  // ✅ Compact service select field
  selectField: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: Colors.border,
  },
  selectFieldText: { fontSize: 17, fontWeight: '600', color: Colors.text },
  selectFieldAction: { color: Colors.link, fontWeight: '700' },

  suggestionsText: {
    fontSize: 13.5,
    fontWeight: '400',
    left: 15,
    bottom: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },

  pickerContainer: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Platform.select({ ios: { borderWidth: 0.5, borderColor: Colors.border } }),
  },
  picker: { height: 52, width: '100%', color: Colors.text, paddingHorizontal: Spacing.lg },

  quickChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.fieldBg,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: Colors.border,
  },
  quickChipSelected: { backgroundColor: 'rgba(0,122,255,0.1)', borderColor: Colors.primary, borderWidth: 1 },
  quickChipText: { fontSize: 13, color: Colors.text, fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System' },
  quickChipTextSelected: { color: Colors.primary, fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System' },

  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  actionButtonPrimaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System' },

  actionButtonSecondary: { backgroundColor: Colors.border, borderRadius: Radii.pill, paddingVertical: 16, alignItems: 'center', marginBottom: Spacing.sm },
  actionButtonSecondaryText: { color: '#495057', fontSize: 17, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System' },

  // List
  listHeader: { fontSize: 20, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm, marginBottom: Spacing.md, fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System' },
  flatListContent: {},
  listSeparator: { height: 0 },

  serviceItemWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    marginVertical: Spacing.sm,
    ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
  serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radii.xl },
  serviceInfo: { flex: 1, marginRight: Spacing.sm },
  serviceName: { fontSize: 19, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs, fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System' },
  serviceDescription: { fontSize: 16, color: Colors.textMuted, marginBottom: Spacing.xs, lineHeight: 22 },
  servicePrice: { fontSize: 16, fontWeight: '600', color: Colors.primary, marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System' },
  serviceDuration: { fontSize: 14, color: Colors.textSubtle, fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System' },

  serviceActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  iconBtn: {
    padding: Spacing.sm,
    borderRadius: 14,
    backgroundColor: Colors.fieldBg,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }, android: { elevation: 2 } }),
  },

  saveButtonContainer: { marginTop: Spacing.lg, marginBottom: Spacing.sm },

  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    ...Platform.select({ ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
  emptyListText: { fontSize: 21, fontWeight: '700', color: '#343A40', marginTop: Spacing.sm, marginBottom: Spacing.xs, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System' },
  emptyListSubText: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.lg, lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System' },

  formErrorText: { color: Colors.danger, textAlign: 'center', marginBottom: Spacing.md, fontSize: 15, fontWeight: '500', paddingHorizontal: Spacing.sm, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System' },

  // ✅ Bottom sheet styles
  sheetCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 16 }, android: { elevation: 16 } }),
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  sheetSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.fieldBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: Colors.border,
    marginBottom: 12,
  },

  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  sheetRowSelected: { backgroundColor: 'rgba(0,122,255,0.08)' },
  sheetRowTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sheetRowDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  sheetFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  sheetBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999 },
  sheetBtnGhost: { backgroundColor: Colors.fieldBg },
  sheetBtnGhostText: { fontWeight: '800', color: Colors.text },
  sheetBtnPrimary: { backgroundColor: Colors.primary },
  sheetBtnPrimaryText: { fontWeight: '800', color: '#fff' },
});
