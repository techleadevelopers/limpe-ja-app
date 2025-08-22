// LimpeJaApp/app/(provider)/profile/edit-services.tsx
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

// Types
import { PricingType } from '../../../types/backend/services';
import {
  getProviderServicesOffered,
  addProviderServiceOffering,
  updateProviderServiceOffering,
  deleteProviderServiceOffering,
} from '../../../services/providerService';
import { ProviderServiceOffering as ProviderServiceType } from '../../../types/backend/provider-service';
import { CreateProviderServiceData } from '../../../types/backend/providers';

// ===== Design Tokens (Premium UI) =====
const Colors = {
  primary: '#4A90E2',
  primaryDark: '#2A72E7',
  link: '#007AFF',
  bgSoft: '#F0F7FF',
  surface: '#FFFFFF',
  border: '#E9ECEF',
  fieldBg: '#F8F9FA',
  text: '#212529',
  textMuted: '#6C757D',
  textSubtle: '#868E96',
  danger: '#D32F2F',
  success: '#2E7D32',
  shadow: 'rgba(0,0,0,0.08)',
};

const Radii = {
  xl: 20,
  pill: 25,
  sm: 10,
};

const Spacing = {
  xs: 6,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 28,
};

// ===== Helpers =====
const easeOut = Easing.out(Easing.ease);

function normalizeCurrencyInput(v: string) {
  // remove tudo que não é número
  const digits = v.replace(/[^\d]/g, '');
  if (!digits) return { raw: '', display: '' };
  // formata em centavos -> BRL simples (sem Intl por performance/consistência)
  const cents = parseInt(digits, 10);
  const raw = (cents / 100).toFixed(2);
  const parts = raw.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const display = `R$ ${intPart},${parts[1]}`;
  return { raw, display };
}

function parseDurationToMinutes(input: string | undefined) {
  if (!input) return undefined;
  // aceita "120", "120 min", "2 horas", "2h", "2h30"
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

  // fallback: primeiro número encontrado
  const anyNum = str.match(/\d+/);
  return anyNum ? parseInt(anyNum[0], 10) : undefined;
}

// ===== Animated Item =====
interface ServiceOffering {
  id: string;
  name: string;
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
}> = ({ item, onEdit, onDelete, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, delay, easing: easeOut, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, delay, easing: easeOut, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const onPressInItem = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const onPressOutItem = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const confirmDelete = () => {
    Alert.alert(
      'Excluir Serviço',
      `Tem certeza que deseja excluir "${item.name}"?`,
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
        return `R$ ${service.price.toFixed(2).replace('.', ',')}`;
      case PricingType.HOURLY:
        return `R$ ${service.price.toFixed(2).replace('.', ',')}/hora`;
      case PricingType.BY_SIZE: {
        let sizePrice = '';
        if (service.pricePerSquareMeter) {
          sizePrice += `R$ ${service.pricePerSquareMeter.toFixed(2).replace('.', ',')}/m²`;
        }
        if (service.pricePerRoom) {
          sizePrice += (sizePrice ? ' · ' : '') + `R$ ${service.pricePerRoom.toFixed(2).replace('.', ',')}/cômodo`;
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
      accessibilityRole="summary"
      accessibilityLabel={`Serviço ${item.name}. Toque para ações.`}
    >
      <TouchableOpacity
        onPressIn={onPressInItem}
        onPressOut={onPressOutItem}
        activeOpacity={0.9}
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${item.name}`}
          >
            <Ionicons name="create-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmDelete}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Excluir ${item.name}`}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
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

  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState(''); // raw numeric string ('.' as decimal)
  const [servicePriceDisplay, setServicePriceDisplay] = useState(''); // masked BRL for UX
  const [pricingType, setPricingType] = useState<PricingType>(PricingType.FIXED_PRICE);
  const [pricePerSquareMeter, setPricePerSquareMeter] = useState('');
  const [pricePerSquareMeterDisplay, setPricePerSquareMeterDisplay] = useState('');
  const [pricePerRoom, setPricePerRoom] = useState('');
  const [pricePerRoomDisplay, setPricePerRoomDisplay] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const listHeaderAnim = useRef(new Animated.Value(0)).current;
  const saveButtonAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 520, easing: easeOut, useNativeDriver: true }).start();

    const fetchProviderServices = async () => {
      if (!user?.providerDetails?.id) {
        Alert.alert('Erro', 'ID do provedor não encontrado. Faça login novamente.');
        setIsLoading(false);
        Animated.timing(feedbackAnim, { toValue: 1, duration: 420, easing: easeOut, useNativeDriver: true }).start();
        return;
      }
      try {
        const fetched = await getProviderServicesOffered(user.providerDetails.id);
        const mapped: ServiceOffering[] = fetched.map((s: ProviderServiceType) => ({
          id: s.id,
          name: s.service.name,
          description: s.description || '',
          price: parseFloat(s.price.toString()),
          duration: s.durationMinutes ? `${s.durationMinutes} minutos` : undefined,
          pricingType: s.pricingType,
          pricePerSquareMeter: s.pricePerSquareMeter ? parseFloat(s.pricePerSquareMeter.toString()) : undefined,
          pricePerRoom: s.pricePerRoom ? parseFloat(s.pricePerRoom.toString()) : undefined,
        }));
        setServices(mapped.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error: any) {
        console.error('[EditProviderServicesScreen] Erro ao carregar serviços:', error);
        Alert.alert('Erro', error?.message || 'Não foi possível carregar seus serviços.');
      } finally {
        setIsLoading(false);
        Animated.stagger(140, [
          Animated.timing(formAnim, { toValue: 1, duration: 560, easing: easeOut, useNativeDriver: true }),
          Animated.timing(listHeaderAnim, { toValue: 1, duration: 560, easing: easeOut, useNativeDriver: true }),
          Animated.timing(saveButtonAnim, { toValue: 1, duration: 560, easing: easeOut, useNativeDriver: true }),
        ]).start();
        Animated.timing(feedbackAnim, { toValue: 1, duration: 420, easing: easeOut, useNativeDriver: true }).start();
      }
    };

    fetchProviderServices();
  }, [user, headerAnim, formAnim, listHeaderAnim, saveButtonAnim, feedbackAnim]);

  // ===== Handlers =====
  const handleSaveServices = () => {
    Alert.alert('Sucesso', 'Todas as alterações foram processadas!');
  };

  const resetForm = () => {
    setIsEditing(null);
    setServiceName('');
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

  const handleAddOrUpdateService = async () => {
    setFormError(null);

    if (!user?.providerDetails?.id) {
      Alert.alert('Erro', 'ID do provedor não encontrado. Faça login novamente.');
      return;
    }

    if (!serviceName.trim()) {
      setFormError('Nome do serviço é obrigatório.');
      AccessibilityInfo.announceForAccessibility?.('Nome do serviço é obrigatório.');
      return;
    }

    let finalPrice = 0;
    let finalPricePerSquareMeter: number | undefined = undefined;
    let finalPricePerRoom: number | undefined = undefined;

    if (pricingType === PricingType.FIXED_PRICE || pricingType === PricingType.HOURLY) {
      if (!servicePrice) {
        setFormError('Preço é obrigatório.');
        return;
      }
      finalPrice = parseFloat(servicePrice);
      if (Number.isNaN(finalPrice) || finalPrice <= 0) {
        setFormError('Preço inválido.');
        return;
      }
    } else if (pricingType === PricingType.BY_SIZE) {
      if (!pricePerSquareMeter && !pricePerRoom) {
        setFormError('Preencha preço por m² e/ou por cômodo.');
        return;
      }
      if (pricePerSquareMeter) {
        const v = parseFloat(pricePerSquareMeter);
        if (Number.isNaN(v) || v <= 0) {
          setFormError('Preço por m² inválido.');
          return;
        }
        finalPricePerSquareMeter = v;
      }
      if (pricePerRoom) {
        const v = parseFloat(pricePerRoom);
        if (Number.isNaN(v) || v <= 0) {
          setFormError('Preço por cômodo inválido.');
          return;
        }
        finalPricePerRoom = v;
      }
    }

    const durationMinutes = parseDurationToMinutes(serviceDuration);
    const serviceData: CreateProviderServiceData = {
      // TODO: substituir por ID real do serviço selecionado no catálogo global
      serviceId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
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
                    description: resultService.description || '',
                    price: parseFloat(resultService.price.toString()),
                    duration: resultService.durationMinutes ? `${resultService.durationMinutes} minutos` : undefined,
                    pricingType: resultService.pricingType,
                    pricePerSquareMeter: resultService.pricePerSquareMeter
                      ? parseFloat(resultService.pricePerSquareMeter.toString())
                      : undefined,
                    pricePerRoom: resultService.pricePerRoom ? parseFloat(resultService.pricePerRoom.toString()) : undefined,
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
          description: resultService.description || '',
          price: parseFloat(resultService.price.toString()),
          duration: resultService.durationMinutes ? `${resultService.durationMinutes} minutos` : undefined,
          pricingType: resultService.pricingType,
          pricePerSquareMeter: resultService.pricePerSquareMeter
            ? parseFloat(resultService.pricePerSquareMeter.toString())
            : undefined,
          pricePerRoom: resultService.pricePerRoom ? parseFloat(resultService.pricePerRoom.toString()) : undefined,
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
    setServiceName(service.name);
    setServiceDesc(service.description);

    // preencher preços conforme tipo
    if (service.pricingType === PricingType.FIXED_PRICE || service.pricingType === PricingType.HOURLY) {
      const display = normalizeCurrencyInput(String(Math.round(service.price * 100))).display;
      setServicePrice(service.price.toFixed(2));
      setServicePriceDisplay(display);
    } else {
      if (service.pricePerSquareMeter != null) {
        const display = normalizeCurrencyInput(String(Math.round(service.pricePerSquareMeter * 100))).display;
        setPricePerSquareMeter(service.pricePerSquareMeter.toFixed(2));
        setPricePerSquareMeterDisplay(display);
      } else {
        setPricePerSquareMeter('');
        setPricePerSquareMeterDisplay('');
      }
      if (service.pricePerRoom != null) {
        const display = normalizeCurrencyInput(String(Math.round(service.pricePerRoom * 100))).display;
        setPricePerRoom(service.pricePerRoom.toFixed(2));
        setPricePerRoomDisplay(display);
      } else {
        setPricePerRoom('');
        setPricePerRoomDisplay('');
      }
    }

    setPricingType(service.pricingType);
    setServiceDuration(service.duration || '');
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
          <ActivityIndicator size="large" color={Colors.primary} />
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View
        style={[
          styles.customHeader,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
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

          <TextInput
            style={[styles.input, formError === 'Nome do serviço é obrigatório.' && styles.inputError]}
            placeholder="Nome do Serviço (ex: Limpeza Padrão)"
            placeholderTextColor={Colors.textMuted}
            value={serviceName}
            onChangeText={setServiceName}
            accessibilityLabel="Nome do serviço"
            returnKeyType="next"
          />

          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Descrição Detalhada (ex: Inclui aspiração, lavagem de banheiros...)"
            placeholderTextColor={Colors.textMuted}
            value={serviceDesc}
            onChangeText={setServiceDesc}
            multiline
            accessibilityLabel="Descrição do serviço"
          />

          <Text style={styles.inputLabel}>Tipo de Precificação</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={pricingType}
              onValueChange={(v: PricingType) => {
                setPricingType(v);
                // limpar campos relacionados ao tipo ao alternar
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
            >
              <Picker.Item label="Preço Fixo por Serviço" value={PricingType.FIXED_PRICE} />
              <Picker.Item label="Por Hora" value={PricingType.HOURLY} />
              <Picker.Item label="Por Metragem/Cômodo" value={PricingType.BY_SIZE} />
            </Picker>
          </View>

          {(pricingType === PricingType.FIXED_PRICE || pricingType === PricingType.HOURLY) && (
            <>
              <TextInput
                style={[styles.input, formError?.includes('Preço') ? styles.inputError : undefined]}
                placeholder={pricingType === PricingType.FIXED_PRICE ? 'Preço Fixo (ex: R$ 250,00)' : 'Valor por Hora (ex: R$ 60,00)'}
                placeholderTextColor={Colors.textMuted}
                value={servicePriceDisplay}
                onChangeText={txt => handlePriceChange(txt, setServicePrice, setServicePriceDisplay)}
                keyboardType="numeric"
                accessibilityLabel="Preço"
              />
              <TextInput
                style={styles.input}
                placeholder="Duração (ex: 2h • 120 min • 2 horas)"
                placeholderTextColor={Colors.textMuted}
                value={serviceDuration}
                onChangeText={setServiceDuration}
                accessibilityLabel="Duração estimada"
              />
            </>
          )}

          {pricingType === PricingType.BY_SIZE && (
            <>
              <TextInput
                style={[styles.input, formError?.includes('m²') ? styles.inputError : undefined]}
                placeholder="Preço por m² (ex: R$ 10,50)"
                placeholderTextColor={Colors.textMuted}
                value={pricePerSquareMeterDisplay}
                onChangeText={txt => handlePriceChange(txt, setPricePerSquareMeter, setPricePerSquareMeterDisplay)}
                keyboardType="numeric"
                accessibilityLabel="Preço por metro quadrado"
              />
              <TextInput
                style={[styles.input, formError?.includes('cômodo') ? styles.inputError : undefined]}
                placeholder="Preço por Cômodo (ex: R$ 50,00)"
                placeholderTextColor={Colors.textMuted}
                value={pricePerRoomDisplay}
                onChangeText={txt => handlePriceChange(txt, setPricePerRoom, setPricePerRoomDisplay)}
                keyboardType="numeric"
                accessibilityLabel="Preço por cômodo"
              />
              <Text style={styles.inputHint}>Preencha um ou ambos. O cliente escolherá como informar o tamanho.</Text>
            </>
          )}

          {!!formError && <Text style={styles.formErrorText}>{formError}</Text>}

          <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleAddOrUpdateService} accessibilityRole="button">
            <Text style={styles.actionButtonPrimaryText}>{isEditing ? 'Atualizar Serviço' : 'Adicionar Novo Serviço'}</Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={resetForm} accessibilityRole="button">
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
            <Ionicons name="pricetags-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyListText}>Você ainda não adicionou serviços.</Text>
            <Text style={styles.emptyListSubText}>Use o formulário acima para começar — é rapidinho.</Text>
            <TouchableOpacity style={[styles.actionButtonPrimary, { marginTop: Spacing.md }]} onPress={() => {}}>
              <Text style={styles.actionButtonPrimaryText}>Adicionar meu primeiro serviço</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <FlatList
            data={services}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <AnimatedServiceItem item={item} onEdit={startEdit} onDelete={deleteService} delay={index * 60 + 140} />
            )}
            contentContainerStyle={styles.flatListContent}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            scrollEnabled={false}
          />
        )}

        <Animated.View
          style={[
            styles.saveButtonContainer,
            { opacity: saveButtonAnim, transform: [{ translateY: saveButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleSaveServices} accessibilityRole="button">
            <Text style={styles.actionButtonPrimaryText}>Salvar Todas as Alterações</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  scrollViewContent: {
    paddingBottom: 40,
    paddingHorizontal: 15,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
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
    width: 24,
    marginLeft: 15,
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.bgSoft,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.textMuted,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.md,
    minHeight: 45,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    marginTop: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: Colors.text,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonSecondary: {
    backgroundColor: Colors.border,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonSecondaryText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 15,
  },
  flatListContent: {},
  serviceItemWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: Radii.xl,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 15,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 13,
    color: Colors.textSubtle,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 15,
    textAlign: 'center',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.fieldBg,
  },
  listSeparator: {
    height: 0,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emptyListText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#343A40',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
