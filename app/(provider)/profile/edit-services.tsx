import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
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
import { CreateProviderServiceData } from '../../../types/backend/providers';
import { getServiceCategories } from '../../../services/commonServiceCatalog';

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
  const digits = v.replace(/[^\d]/g, '');
  if (!digits) return { raw: '', display: '' };
  const cents = parseInt(digits, 10);
  const raw = (cents / 100).toFixed(2);
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
    const updateReducedMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReducedMotionEnabled(enabled);
    };

    updateReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotionEnabled
    );

    return () => subscription.remove();
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
      case PricingType.FIXED_PRICE:
        const fixedPrice = safeToFixed(service.price, 2);
        return fixedPrice ? `R$ ${fixedPrice.replace('.', ',')}` : 'Preço a definir';
      case PricingType.HOURLY:
        const hourlyPrice = safeToFixed(service.price, 2);
        return hourlyPrice ? `R$ ${hourlyPrice.replace('.', ',')}/hora` : 'Preço a definir';
      case PricingType.BY_SIZE: {
        let sizePrice = '';
        const pricePerSquareMeterFormatted = safeToFixed(service.pricePerSquareMeter, 2);
        if (pricePerSquareMeterFormatted) {
          sizePrice += `R$ ${pricePerSquareMeterFormatted.replace('.', ',')}/m²`;
        }
        const pricePerRoomFormatted = safeToFixed(service.pricePerRoom, 2);
        if (pricePerRoomFormatted) {
          sizePrice += (sizePrice ? ' · ' : '') + `R$ ${pricePerRoomFormatted.replace('.', ',')}/cômodo`;
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

  // Animations (refinadas para iOS premium)
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const listHeaderAnim = useRef(new Animated.Value(0)).current;
  const saveButtonAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const isReducedMotionEnabled = useReducedMotion();

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
        setAvailableBaseServices(fetchedBaseServices);

        const fetchedProviderServices = await getProviderServicesOffered(user.providerDetails.id);
        const mapped: ServiceOffering[] = fetchedProviderServices.map((s: ProviderServiceType) => ({
          id: s.id,
          name: s.service.name,
          serviceId: s.service.id,
          description: s.description || '',
          price: typeof s.price === 'number' && Number.isFinite(s.price) ? parseFloat(s.price.toString()) : 0,
          duration: s.durationMinutes ? `${s.durationMinutes} minutos` : undefined,
          pricingType: s.pricingType,
          pricePerSquareMeter: typeof s.pricePerSquareMeter === 'number' && Number.isFinite(s.pricePerSquareMeter) ? parseFloat(s.pricePerSquareMeter.toString()) : undefined,
          pricePerRoom: typeof s.pricePerRoom === 'number' && Number.isFinite(s.pricePerRoom) ? parseFloat(s.pricePerRoom.toString()) : undefined,
        }));
        setServices(mapped.sort((a, b) => a.name.localeCompare(b.name)));

        if (fetchedBaseServices.length > 0) {
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
  }, [user, headerAnim, formAnim, listHeaderAnim, saveButtonAnim, feedbackAnim, isReducedMotionEnabled]);

  // ===== Handlers =====
  const handleSaveServices = () => {
    Alert.alert('Sucesso', 'Todas as alterações foram processadas!');
  };

  const resetForm = () => {
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
  };

  const handlePriceChange = (maskedValue: string, setterRaw: (v: string) => void, setterDisplay: (v: string) => void) => {
    const { raw, display } = normalizeCurrencyInput(maskedValue);
    setterRaw(raw);
    setterDisplay(display);
  };

  const handlePricePerSquareMeterChange = (text: string) => {
    handlePriceChange(text, setPricePerSquareMeter, setPricePerSquareMeterDisplay);
  };

  const handlePricePerRoomChange = (text: string) => {
    handlePriceChange(text, setPricePerRoom, setPricePerRoomDisplay);
  };

  const handleAddOrUpdateService = async () => {
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
    const serviceData: CreateProviderServiceData = {
      serviceId: selectedBaseServiceId,
      description: serviceDesc.trim(),
      price: finalPrice,
      durationMinutes,
      pricingType,
      pricePerSquareMeter: finalPricePerSquareMeter,
      pricePerRoom: finalPricePerRoom,
    };

    setIsLoading(true);
    try {
      let resultService: ProviderServiceType;
      if (isEditing) {
        resultService = await updateProviderServiceOffering(user.providerDetails.id, isEditing.id, serviceData);
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
                    pricePerSquareMeter: typeof resultService.pricePerSquareMeter === 'number' && Number.isFinite(resultService.pricePerSquareMeter)
                      ? parseFloat(resultService.pricePerSquareMeter.toString())
                      : undefined,
                    pricePerRoom: typeof resultService.pricePerRoom === 'number' && Number.isFinite(resultService.pricePerRoom)
                      ? parseFloat(resultService.pricePerRoom.toString())
                      : undefined,
                    pricingType: resultService.pricingType,
                  }
                : s
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        Alert.alert('Sucesso', 'Serviço atualizado com sucesso!');
      } else {
        resultService = await addProviderServiceOffering(user.providerDetails.id, serviceData);
        const newService: ServiceOffering = {
          id: resultService.id,
          name: resultService.service.name,
          serviceId: resultService.service.id,
          description: resultService.description || '',
          price: typeof resultService.price === 'number' && Number.isFinite(resultService.price) ? parseFloat(resultService.price.toString()) : 0,
          duration: resultService.durationMinutes ? `${resultService.durationMinutes} minutos` : undefined,
          pricingType: resultService.pricingType,
          pricePerSquareMeter: typeof resultService.pricePerSquareMeter === 'number' && Number.isFinite(resultService.pricePerSquareMeter)
            ? parseFloat(resultService.pricePerSquareMeter.toString())
            : undefined,
          pricePerRoom: typeof resultService.pricePerRoom === 'number' && Number.isFinite(resultService.pricePerRoom)
            ? parseFloat(resultService.pricePerRoom.toString())
            : undefined,
        };
        setServices(prev => [...prev, newService].sort((a, b) => a.name.localeCompare(b.name)));
        Alert.alert('Sucesso', 'Novo serviço adicionado com sucesso!');
      }
      resetForm();
    } catch (error: any) {
      console.error('[EditProviderServicesScreen] Erro ao adicionar/atualizar serviço:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível salvar o serviço.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (service: ServiceOffering) => {
    setIsEditing(service);
    setSelectedBaseServiceId(service.serviceId);
    setServiceDesc(String(service.description));

    if (service.pricingType === PricingType.FIXED_PRICE || service.pricingType === PricingType.HOURLY) {
      const rawPrice = safeToFixed(service.price, 2);
      setServicePrice(rawPrice);
      setServicePriceDisplay(normalizeCurrencyInput(String(Math.round(service.price * 100))).display);
    } else {
      const rawPricePerSquareMeter = safeToFixed(service.pricePerSquareMeter, 2);
      setPricePerSquareMeter(rawPricePerSquareMeter);
      setPricePerSquareMeterDisplay(rawPricePerSquareMeter ? normalizeCurrencyInput(String(Math.round(parseFloat(rawPricePerSquareMeter) * 100))).display : '');

      const rawPricePerRoom = safeToFixed(service.pricePerRoom, 2);
      setPricePerRoom(rawPricePerRoom);
      setPricePerRoomDisplay(rawPricePerRoom ? normalizeCurrencyInput(String(Math.round(parseFloat(rawPricePerRoom) * 100))).display : '');
    }

    setPricingType(service.pricingType);
    setServiceDuration(String(service.duration || ''));
    setFormError(null);
  };

  const deleteService = async (serviceId: string) => {
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
      Alert.alert('Erro', error?.message || 'Não foi possível deletar o serviço.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Loading State =====
  if (isLoading) {
    return (
      <View style={styles.outerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View
          style={[
            styles.customHeader,
            { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
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
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityRole="button" accessibilityLabel="Voltar para a tela anterior">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" accessibilityHidden={true} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Meus Serviços</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.formContainer,
            { opacity: formAnim, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <Text style={styles.formTitle}>{isEditing ? 'Editar Serviço Existente' : 'Adicionar Novo Serviço'}</Text>

          <Text style={styles.inputLabel}>Tipo de Serviço</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedBaseServiceId}
              onValueChange={(itemValue: string | undefined) => setSelectedBaseServiceId(itemValue)}
              style={styles.picker}
              enabled={!isEditing && availableBaseServices.length > 0}
              accessibilityLabel="Selecione o tipo de serviço"
              accessibilityHint={isEditing ? "Não é possível alterar o tipo de serviço em edição." : "Escolha um serviço base para adicionar ou editar."}
            >
              {availableBaseServices.length === 0 ? (
                <Picker.Item label="Nenhum serviço disponível" value={undefined} />
              ) : (
                availableBaseServices.map(service => (
                  <Picker.Item key={service.id} label={service.name} value={service.id} />
                ))
              )}
            </Picker>
          </View>
          {isEditing && (
            <Text style={styles.inputHint}>Você não pode alterar o tipo de serviço de um serviço existente.</Text>
          )}
          {availableBaseServices.length === 0 && !isLoading && (
            <Text style={styles.formErrorText} accessibilityLiveRegion="polite">Nenhum tipo de serviço base disponível. Verifique a conexão ou o backend.</Text>
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
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={pricingType}
              onValueChange={(v: PricingType) => {
                setPricingType(v);
                setServicePrice('');
                setServicePriceDisplay('');
                setPricePerSquareMeter('');
                setPricePerSquareMeterDisplay('');
                setPricePerRoom('');
                setPricePerRoomDisplay('');
                setServiceDuration('');
                setFormError(null);
              }}
              style={styles.picker}
              accessibilityLabel="Selecione o tipo de precificação"
            >
              <Picker.Item label="Preço Fixo por Serviço" value={PricingType.FIXED_PRICE} />
              <Picker.Item label="Por Hora" value={PricingType.HOURLY} />
              <Picker.Item label="Por Metragem/Cômodo" value={PricingType.BY_SIZE} />
            </Picker>
          </View>

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

          {pricingType === PricingType.BY_SIZE && (
            <>
              <Text style={styles.inputLabel}>Preço por Metro Quadrado</Text>
              <TextInput
                style={[styles.input, formError?.includes('m²') ? styles.inputError : undefined]}
                placeholder="Ex: R$ 10,50"
                placeholderTextColor={Colors.textMuted}
                value={pricePerSquareMeterDisplay}
                onChangeText={handlePricePerSquareMeterChange}
                keyboardType="numeric"
                accessibilityLabel="Preço por metro quadrado"
                accessibilityHint="Informe o valor cobrado por metro quadrado."
              />
              <Text style={styles.inputLabel}>Preço por Cômodo</Text>
              <TextInput
                style={[styles.input, formError?.includes('cômodo') ? styles.inputError : undefined]}
                placeholder="Ex: R$ 50,00"
                placeholderTextColor={Colors.textMuted}
                value={pricePerRoomDisplay}
                onChangeText={handlePricePerRoomChange}
                keyboardType="numeric"
                accessibilityLabel="Preço por cômodo"
                accessibilityHint="Informe o valor cobrado por cômodo."
              />
              <Text style={styles.inputHint}>Preencha um ou ambos os campos acima. O cliente escolherá como informar o tamanho.</Text>
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
            { opacity: listHeaderAnim, transform: [{ translateY: listHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          Serviços Cadastrados
        </Animated.Text>

        {services.length === 0 ? (
          <Animated.View style={[styles.emptyListContainer, { opacity: feedbackAnim }]}>
            <Ionicons name="pricetags-outline" size={64} color="#CED4DA" accessibilityHidden={true} />
            <Text style={styles.emptyListText}>Você ainda não adicionou serviços.</Text>
            <Text style={styles.emptyListSubText}>Use o formulário acima para começar -- é rapidinho.</Text>
            <TouchableOpacity style={[styles.actionButtonPrimary, { marginTop: Spacing.md }]} onPress={() => {}} accessibilityRole="button" accessibilityLabel="Adicionar meu primeiro serviço">
              <Text style={styles.actionButtonPrimaryText}>Adicionar meu primeiro serviço</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <FlatList
            data={services}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <AnimatedServiceItem item={item} onEdit={startEdit} onDelete={deleteService} delay={index * 60 + 140} isReducedMotionEnabled={isReducedMotionEnabled} />
            )}
            contentContainerStyle={styles.flatListContent}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            scrollEnabled={false}
            accessibilityLabel="Lista de serviços que você oferece"
          />
        )}

        <Animated.View
          style={[
            styles.saveButtonContainer,
            { opacity: saveButtonAnim, transform: [{ translateY: saveButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleSaveServices} accessibilityRole="button" accessibilityLabel="Salvar Todas as Alterações">
            <Text style={styles.actionButtonPrimaryText}>Salvar Todas as Alterações</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ===== Styles (corrigidos: Platform.select com spread, limpos) =====
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  scrollViewContent: {
    paddingBottom: 50,
    paddingHorizontal: Spacing.sm,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 55 : Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 55 : Spacing.lg,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  headerBackButton: {
    marginRight: Spacing.xs,
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'System',
  },
  headerActionIconPlaceholder: {
    width: 28,
    marginLeft: Spacing.xs,
  },
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
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
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
    ...Platform.select({
      ios: { borderWidth: 0.5, borderColor: Colors.border },
    }),
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 1.5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  pickerContainer: {
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: { borderWidth: 0.5, borderColor: Colors.border },
    }),
  },
  picker: {
    height: 52,
    width: '100%',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  actionButtonSecondary: {
    backgroundColor: Colors.border,
    borderRadius: Radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionButtonSecondaryText: {
    color: '#495057',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
  listHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'System',
  },
  flatListContent: {},
  serviceItemWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    marginVertical: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.xl,
  },
  serviceInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  serviceName: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  serviceDescription: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    lineHeight: 22,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'System',
  },
  serviceDuration: {
    fontSize: 14,
    color: Colors.textSubtle,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  inputHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  iconBtn: {
    padding: Spacing.sm,
    borderRadius: 14,
    backgroundColor: Colors.fieldBg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  listSeparator: {
    height: 0,
  },
  saveButtonContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  emptyListText: {
    fontSize: 21,
    fontWeight: '700',
    color: '#343A40',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'System',
  },
  emptyListSubText: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'System',
  },
  formErrorText: {
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: Spacing.sm,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'System',
  },
});