import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    Platform,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bulkSetAvailability, saveProviderSettings, TimeRange } from '../../../services/providerSettingsService';

// IMPORTAÇÃO DO COMPONENTE PREMIUM SERVICE CHIP (Assumindo o caminho fornecido)
import { PremiumServiceChip } from '../../../components/auth/PremiumServiceChip';

import ServiceDetailsStep5Premium from '../../../components/auth/ServiceDetailsStep5Premium';
import { useAuth } from '../../../hooks/useAuth';
import {
    addProviderServiceOffering,
    getProviderServicesOffered,
    listAllServices,
    updateMyProviderProfile,
    updateProviderServiceOffering,
} from '../../../services/providerService';
import { CreateProviderServiceData, UpdateProviderServiceData } from '../../../types/backend/providers';
import verificationService from '../../../services/verificationService';
import { VerificationStatus } from '../../../types/backend/auth';
import { showUserError } from '../../_shared/errors/userError';
import { AUTH_ROUTES } from '../../routes';

const MIN_HOURLY_DURATION = 240;

const SERVICE_OPTIONS = [
  { id: 'residencial', label: 'Residencial', icon: 'home', set: 'ion' },
  { id: 'comercial',   label: 'Comercial',   icon: 'office-building', set: 'mci' },
  { id: 'escritorio',  label: 'Escritrio',  icon: 'desktop-outline', set: 'ion' },
  { id: 'pos_obra',    label: 'Ps-Obra',    icon: 'hammer-wrench', set: 'mci' },
];


interface ServiceDetailsFormData {
  profilePhoto: string | null;
  description: string;
  yearsOfExperience: string;
  basePrice: string;
  pixKey: string;
  specialties: string[];
  serviceAreas: string[];
}

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const { user, updateUser, setIsRegistrationInProgress } = useAuth();

  const [formData, setFormData] = useState<ServiceDetailsFormData>({
    profilePhoto: null,
    description: '',
    yearsOfExperience: '',
    basePrice: '',
    pixKey: '',
    specialties: [],
    serviceAreas: [],
  });

  const [serviceIdMap, setServiceIdMap] = useState<Record<string, string>>({});
  const [servicesLoaded, setServicesLoaded] = useState(false);

  const [currentServiceSubStep, setCurrentServiceSubStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  // Cobertura (raio) e Disponibilidades – inline abaixo do preço (sub-step 3)
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const upcoming = React.useMemo(() => {
    const base = new Date();
    return new Array(10).fill(null).map((_, idx) => {
      const d = new Date(base);
      d.setDate(base.getDate() + idx);
      return d;
    });
  }, []);
  const [selectedDays, setSelectedDays] = useState<Record<string, { morning: boolean; afternoon: boolean }>>({});
  const toggleDay = (dateKey: string, key: 'morning'|'afternoon') => {
    setSelectedDays(prev => ({
      ...prev,
      [dateKey]: { morning: prev[dateKey]?.morning ?? false, afternoon: prev[dateKey]?.afternoon ?? false, [key]: !(prev[dateKey]?.[key] ?? false) },
    }));
    try { Haptics.selectionAsync(); } catch {}
  };
  const onMinusKm = () => { setRadiusKm(v => Math.max(1, v - (v >= 20 ? 5 : 1))); try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} };
  const onPlusKm  = () => { setRadiusKm(v => Math.min(60, v + (v >= 20 ? 5 : 1))); try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} };

  // Error states for inline validation
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [yearsOfExperienceError, setYearsOfExperienceError] = useState<string | null>(null);
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null);
  const [basePriceError, setBasePriceError] = useState<string | null>(null);
  const [pixKeyError, setPixKeyError] = useState<string | null>(null);
  const [serviceAreasError, setServiceAreasError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      try {
        const services = await listAllServices();
        const normalizeKey = (value: string) =>
          value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[\s-]+/g, '_')
            .replace(/[^a-z0-9_]/g, '');

        const map: Record<string, string> = {};
        services.forEach((service) => {
          const key = normalizeKey(service.name || '');
          if (key) {
            map[key] = service.id;
          }
        });

        if (isMounted) {
          setServiceIdMap(map);
          setServicesLoaded(true);
          if (__DEV__) {
            console.log('[ServiceDetails] serviceIdMap sync:', map);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('[ServiceDetails] Falha ao carregar catálogo de serviços:', error);
          setGeneralError('Não foi possível sincronizar o catálogo de serviços. Tente novamente em instantes.');
        }
      }
    };

    loadServices();
    return () => {
      isMounted = false;
    };
  }, []);

  // Animações de transição de passo
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;

  // Animações para o Stagger dos chips (4 chips)
  const chipAnimations = useRef(
    [...Array(4)].map(() => new Animated.Value(0))
  ).current;

  // Animação de entrada por linha de disponibilidade (para Step 5)
  // Opções de serviço usadas na animação (precisa estar antes do useEffect abaixo)
  const serviceOptions = [
    { id: 'residencial', label: 'Residencial', icon: 'home', set: 'ion' },
    { id: 'comercial',   label: 'Comercial',   icon: 'office-building', set: 'mci' },
    { id: 'escritorio',  label: 'Escritório',  icon: 'desktop-outline', set: 'ion' },
    { id: 'pos_obra',    label: 'Pós-Obra',    icon: 'hammer-wrench', set: 'mci' },
  ];

  const totalSteps = 5;
  const progress = currentServiceSubStep / totalSteps;

  // Efeito para transição de passo
  useEffect(() => {
    // Reset values for transition effect
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260, // Requisito 4: 200-260ms
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic), // Requisito 4: Easing consistente
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260, // Requisito 4: 200-260ms
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic), // Requisito 4: Easing consistente
      }),
    ]).start();
  }, [currentServiceSubStep, fadeAnim, slideAnim]);

  // Efeito para animações Stagger dos chips
  useEffect(() => {
    if (currentServiceSubStep === 2) {
      // Reset chips to initial state (opacity 0, translateY 20)
      chipAnimations.forEach(anim => anim.setValue(0));

      // Requisito 4: Stagger nos chips: 50ms entre itens.
      Animated.stagger(50, serviceOptions.map((_: any, index: number) =>
        Animated.timing(chipAnimations[index], {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        })
      )).start();
    }
  }, [currentServiceSubStep, chipAnimations, serviceOptions]);

  // Microanimao do Step 5  gerenciada no componente premium
  const onPressInAvatar = () => {
    Animated.spring(avatarScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutAvatar = () => {
    Animated.spring(avatarScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Auto-save to AsyncStorage
  useEffect(() => {
    const saveFormData = async () => {
      try {
        const dataToSave = { ...formData, currentServiceSubStep };
        await AsyncStorage.setItem('serviceDetailsFormData', JSON.stringify(dataToSave));
      } catch (e) {
        console.error("Failed to save service details form data to AsyncStorage", e);
      }
    };
    const handler = setTimeout(() => {
      saveFormData();
    }, 500); // Debounce saving
    return () => clearTimeout(handler);
  }, [formData, currentServiceSubStep]);

  // Load from AsyncStorage on component mount
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('serviceDetailsFormData');
        if (savedData) {
          const loadedData = JSON.parse(savedData);
          setFormData({
            profilePhoto: loadedData.profilePhoto || null,
            description: loadedData.description || '',
            yearsOfExperience: loadedData.yearsOfExperience || '',
            basePrice: loadedData.basePrice || '',
            pixKey: loadedData.pixKey || '',
            specialties: loadedData.specialties || [],
            serviceAreas: loadedData.serviceAreas || [],
          });
          setCurrentServiceSubStep(loadedData.currentServiceSubStep || 1);
          setGeneralError("Dados carregados automaticamente. Continue preenchendo seus detalhes de serviço.");
        }
      } catch (e) {
        console.error("Failed to load service details form data from AsyncStorage", e);
      }
    };
    loadFormData();
  }, []);


  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permissão necessária', 'É preciso permitir acesso à galeria para continuar.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData(prev => ({
          ...prev,
          profilePhoto: result.assets[0].uri
        }));
        setProfilePhotoError(null);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  
  };

  // Validation functions
  const validateSubStep1 = useCallback(() => {
    let isValid = true;
    setProfilePhotoError(null);
    setDescriptionError(null);

    if (!formData.profilePhoto) {
      setProfilePhotoError('Por favor, adicione uma foto de perfil.');
      isValid = false;
    }
    if (!formData.description.trim()) {
      setDescriptionError('A descrição do serviço é obrigatória.');
      isValid = false;
    }
    return isValid;
  }, [formData.profilePhoto, formData.description]);

  const validateSubStep2 = useCallback(() => {
    let isValid = true;
    setYearsOfExperienceError(null);
    setSpecialtiesError(null);

    const years = parseInt(formData.yearsOfExperience);
    if (!formData.yearsOfExperience.trim() || isNaN(years) || years < 0) {
      setYearsOfExperienceError('Os anos de experiência são obrigatórios e devem ser um número válido.');
      isValid = false;
    }
    if (formData.specialties.length === 0) {
      setSpecialtiesError('Por favor, selecione pelo menos um tipo de serviço.');
      isValid = false;
    }
    return isValid;
  }, [formData.yearsOfExperience, formData.specialties]);

  const validateSubStep3 = useCallback(() => {
    let isValid = true;
    setBasePriceError(null);

    const price = parseFloat(formData.basePrice.replace(',', '.'));
    if (!formData.basePrice.trim() || isNaN(price) || price <= 0) {
      setBasePriceError('O preço por hora é obrigatório e deve ser um número maior que zero.');
      isValid = false;
    }
    return isValid;
  }, [formData.basePrice]);

  const validateSubStep4 = useCallback(() => {
    let isValid = true;
    setPixKeyError(null);
    setServiceAreasError(null);

    if (!formData.pixKey.trim()) {
      setPixKeyError('A chave PIX é obrigatória para que você possa receber pagamentos.');
      isValid = false;
    }
    // Temporariamente opcional enquanto o backend não suporta o campo:
    // if (formData.serviceAreas.length === 0 || formData.serviceAreas.every(area => area === '')) {
    //   setServiceAreasError('Por favor, informe suas áreas de atendimento (cidades ou bairros).');
    //   isValid = false;
    // }
    return isValid;
  }, [formData.pixKey]);


  const handleNextSubStep = async () => {
    setGeneralError(null);
    if (currentServiceSubStep === 1) {
      if (validateSubStep1()) {
        setCurrentServiceSubStep(2);
      } else {
        setGeneralError('Por favor, preencha todos os campos obrigatórios da etapa atual.');
      }
    } else if (currentServiceSubStep === 2) {
      if (validateSubStep2()) {
        setCurrentServiceSubStep(3);
      } else {
        setGeneralError('Por favor, preencha todos os campos obrigatórios da etapa atual.');
      }
    } else if (currentServiceSubStep === 3) {
      if (validateSubStep3()) {
        setCurrentServiceSubStep(4);
      } else {
        setGeneralError('Por favor, preencha todos os campos obrigatórios da etapa atual.');
      }
    } else if (currentServiceSubStep === 4) {
      if (validateSubStep4()) {
        setCurrentServiceSubStep(5);
      } else {
        setGeneralError('Por favor, preencha todos os campos obrigatórios da etapa atual.');
      }
    } else if (currentServiceSubStep === 5) {
      handleFinalSubmission();
    }
  };

  const handleBackSubStep = () => {
    setGeneralError(null);
    // Clear specific errors when going back
    setProfilePhotoError(null);
    setDescriptionError(null);
    setYearsOfExperienceError(null);
    setSpecialtiesError(null);
    setBasePriceError(null);
    setPixKeyError(null);
    setServiceAreasError(null);

    if (currentServiceSubStep > 1) {
      setCurrentServiceSubStep(currentServiceSubStep - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(AUTH_ROUTES.PROVIDER_REGISTER);
      }
    }
  };

  const handleFinalSubmission = async () => {
    if (!user || !user.token || !user.providerDetails?.id) {
      Alert.alert('Erro de autenticação', 'Usuário não logado ou detalhes do provedor ausentes. Por favor, faça login novamente.');
      return;
    }

    if (!validateSubStep1() || !validateSubStep2() || !validateSubStep3() || !validateSubStep4()) {
      setGeneralError('Por favor, preencha todos os campos obrigatórios corretamente antes de finalizar.');
      return;
    }

    if (!servicesLoaded || Object.keys(serviceIdMap).length === 0) {
      setGeneralError('Não foi possível sincronizar o catálogo de serviços. Tente novamente em instantes.');
      return;
    }

    setIsUploading(true);

    try {
      const providerId = user.providerDetails.id;
      let avatarUrl: string | null | undefined = user.providerDetails.avatarUrl;

      // 1. Upload da foto, se for uma URI local
      if (formData.profilePhoto && formData.profilePhoto.startsWith('file://')) {
        try {
          const uploadResponse = await verificationService.uploadAvatar(formData.profilePhoto);
          if (uploadResponse && uploadResponse.url) {
            avatarUrl = uploadResponse.url;
          } else {
            throw new Error('O serviço de upload de avatar não retornou uma URL válida.');
          }
        } catch (uploadError: any) {
          throw new Error("Não foi possível fazer o upload da foto de perfil.");
        }
      }

      // 2. Atualização do Perfil (TEMP: anexa as áreas no bio)
      const areasLine =
        formData.serviceAreas && formData.serviceAreas.length
          ? `Áreas de atendimento: ${formData.serviceAreas.join(', ')}`
          : '';

      const profileUpdateData = {
        avatarUrl: avatarUrl,
        bio: `${formData.description}${areasLine}`, // TEMP: anexa as áreas no bio
        yearsOfExperience: parseInt(formData.yearsOfExperience, 10),
        pixKey: formData.pixKey,
        // Não enviar serviceAreas enquanto o backend não suportar
      };

      await updateMyProviderProfile(profileUpdateData);

      // 3. Atualização/Criação de Serviços
      const existingProviderServices = await getProviderServicesOffered(providerId);

      for (const specialty of formData.specialties) {
        const serviceId = serviceIdMap[specialty];
        if (!serviceId) {
          if (__DEV__) {
            console.warn(`[ServiceDetails] ID de serviço não encontrado para chave "${specialty}".`);
          }
          continue;
        }

        const basePriceValue = parseFloat(formData.basePrice.replace(',', '.'));
        const durationMinutes = MIN_HOURLY_DURATION;

        const createData: CreateProviderServiceData = {
          serviceId,
          description: formData.description.trim(),
          durationMinutes,
          pricePerHour: basePriceValue,
        };

        const updateData: UpdateProviderServiceData = {
          description: formData.description.trim(),
          durationMinutes,
          pricePerHour: basePriceValue,
        };

        const existingService = existingProviderServices.find((s: any) => s.serviceId === serviceId);

        if (existingService) {
          await updateProviderServiceOffering(providerId, existingService.id, updateData);
        } else {
          await addProviderServiceOffering(providerId, createData);
        }
      }

      // 4. Avançar status de verificação
      await verificationService.advanceVerificationStatus();

      // 5. Persistir raio e disponibilidades (não bloqueante)
      try {
        await saveProviderSettings({ serviceRadiusKm: radiusKm });
      } catch (e) {
        console.warn('[ServiceDetails] Falha ao salvar raio de atendimento:', e);
      }

      try {
        const dates = Object.keys(selectedDays)
          .filter(k => selectedDays[k]?.morning || selectedDays[k]?.afternoon)
          .map(k => {
            const ranges: TimeRange[] = [];
            if (selectedDays[k]?.morning) ranges.push({ start: '08:00', end: '12:00' });
            if (selectedDays[k]?.afternoon) ranges.push({ start: '14:00', end: '18:00' });
            return { date: k, ranges };
          });
        if (dates.length) {
          await bulkSetAvailability({ dates });
        }
      } catch (e) {
        console.warn('[ServiceDetails] Falha ao salvar disponibilidades:', e);
      }

      // 6. Atualizar estado local
      await updateUser({
        avatarUrl: avatarUrl ?? user?.avatarUrl ?? null,
        providerDetails: user?.providerDetails
          ? { ...user.providerDetails, verificationStatus: VerificationStatus.PENDING_DOCUMENTS_UPLOAD }
          : (user?.providerDetails as any),
      } as any);

      // 6. Finalização e Navegação (Requisito 3: Sem Alert de sucesso)
      setIsRegistrationInProgress(false);
      await AsyncStorage.removeItem('serviceDetailsFormData');

      // Navegação direta, sem alert
      router.push(AUTH_ROUTES.PROVIDER_VERIFY_ACCOUNT);
    } catch (error: any) {
      if (__DEV__) {
        console.error('Erro ao salvar os dados do provedor:', error.response?.data || error.message);
      }
      const normalized = showUserError(error, 'Erro no cadastro');
      setGeneralError(normalized.message);
    } finally {
      setIsUploading(false);
    }
  };

  const renderInputSection = (
    title: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    keyboardType: any = 'default',
    multiline: boolean = false,
    icon: string = 'text-outline',
    maxLength?: number,
    error: string | null = null,
    onBlur?: () => void
  ) => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>
        <Ionicons name={icon as any} size={16} color="#2C3E50" /> {title}
      </Text>
      <View style={[styles.inputContainer, error ? styles.inputContainerError : {}]}>
        <TextInput
          style={[styles.textInput, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor="#A0A0A0"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          maxLength={maxLength}
          onBlur={onBlur}
        />
      </View>
      {error && <Text style={styles.inlineErrorMessage}>{error}</Text>}
    </View>
  );

  const getSubStepTitle = () => {
  switch (currentServiceSubStep) {
    case 1: return '';
    case 2: return '2. Experiência e Especialidades';
    case 3: return '3. Preço por hora';
    case 4: return '4. Chave PIX e Áreas de Atendimento';
    default: return '';
  }
};

const getMicrocopyText = () => {
  switch (currentServiceSubStep) {
    case 1: return 'Sua foto e uma breve descrição ajudam os clientes a te conhecerem.';
    case 2: return 'Conte-nos sobre sua experiência e os serviços que você oferece.';
    case 3: return 'Defina o preço por hora (mínimo de 4h).';
    case 4: return 'Para receber pagamentos e informar suas áreas de atuação.';
    default: return '';
  }
};

  const getBackButtonText = () => {
    if (currentServiceSubStep === 1) return '';
    return '';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#F4F7FC', '#FFFFFF']}
          style={styles.backgroundGradient}
        />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header with Back Button */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBackSubStep} style={styles.backButtonHeader}>
                  <Ionicons name="arrow-back-outline" size={24} color="#2C3E50" />
                  <Text style={styles.backButtonHeaderText}>{getBackButtonText()}</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
            </View>
            
            {/* Progress Bar 
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{`Etapa ${currentServiceSubStep} de ${totalSteps}`}</Text>
            </View>*/}

            <Text style={styles.headerSubtitle}>
              {getSubStepTitle()}
            </Text>
            <Text style={styles.microcopyText}>{getMicrocopyText()}</Text>

            {/* Sub-step 1: Photo + Description */}
            {currentServiceSubStep === 1 && (
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Foto do Perfil</Text>
                <TouchableOpacity
                  style={[styles.imageUploadButton, {transform: [{scale: avatarScaleAnim}]}, profilePhotoError ? styles.imageUploadButtonError : {}]}
                  onPress={handleImagePicker}
                  onPressIn={onPressInAvatar}
                  onPressOut={onPressOutAvatar}
                  activeOpacity={0.8}
                >
                  {formData.profilePhoto ? (
                    <Image source={formData.profilePhoto ? { uri: formData.profilePhoto } : undefined} style={styles.uploadedImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera-outline" size={40} color="#A0D2EB" />
                      <Text style={styles.uploadText}>Toque para adicionar sua foto</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(160, 210, 235, 0.1)']}
                    style={styles.imageOverlay}
                  />
                </TouchableOpacity>
                {profilePhotoError && <Text style={styles.inlineErrorMessageCentered}>{profilePhotoError}</Text>}


                {renderInputSection(
                  'Descrição do Serviço',
                  'Descreva sua experiência e especialidades...',
                  formData.description,
                  (text) => { setFormData(prev => ({ ...prev, description: text })); setDescriptionError(null); },
                  'default',
                  true,
                  'document-text-outline',
                  500,
                  descriptionError,
                  validateSubStep1
                )}
              </View>
            )}

            {/* Sub-step 2: Experience + Specialties */}
            {currentServiceSubStep === 2 && (
              <View style={styles.formContainer}>
                {renderInputSection(
                  'Anos de Experiência',
                  'Ex: 5',
                  formData.yearsOfExperience,
                  (text) => { setFormData(prev => ({ ...prev, yearsOfExperience: text.replace(/[^0-9]/g, '') })); setYearsOfExperienceError(null); },
                  'numeric',
                  false,
                  'time-outline',
                  2,
                  yearsOfExperienceError,
                  validateSubStep2
                )}

                {/* Service Type Selection (Using PremiumServiceChip) */}
                <View style={styles.serviceTypeContainer}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="home-outline" size={16} color="#2C3E50" /> Tipo de Serviço
                  </Text>
                  <View style={[styles.serviceTypeGrid, Platform.OS === 'android' && styles.serviceTypeGridAndroidScale]}>
                    {serviceOptions.map((s, index) => {
                        const animationStyle = {
                            opacity: chipAnimations[index],
                            transform: [{
                                translateY: chipAnimations[index].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0], // Slide up effect
                                }),
                            }],
                        };
                        return (
                            <PremiumServiceChip
                                key={s.id}
                                id={s.id}
                                label={s.label}
                                selected={formData.specialties.includes(s.id)}
                                onPress={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        specialties: prev.specialties.includes(s.id)
                                            ? prev.specialties.filter(x => x !== s.id)
                                            : [...prev.specialties, s.id]
                                    }));
                                    setSpecialtiesError(null);
                                }}
                                iconSet={s.set as any}
                                iconName={s.icon as any}
                                style={animationStyle}
                            />
                        );
                    })}
                  </View>
                  {specialtiesError && <Text style={styles.inlineErrorMessage}>{specialtiesError}</Text>}
                </View>
              </View>
            )}

            {/* Sub-step 3: Hourly Price */}
            {currentServiceSubStep === 3 && (
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="pricetag-outline" size={16} color="#2C3E50" /> Preço por hora
                </Text>
                <Text style={styles.priceHintText}>Mínimo de 4 horas (240 min). A cobrança segue o modelo horário.</Text>
                {renderInputSection(
                  'Preço por hora',
                  'Ex: 50,00',
                  formData.basePrice,
                  (text) => { setFormData(prev => ({ ...prev, basePrice: text.replace(/[^0-9.,]/g, '') })); setBasePriceError(null); },
                  'numeric',
                  false,
                  'cash-outline',
                  undefined,
                  basePriceError,
                  validateSubStep3
                )}
              </View>
            )}

            {/* Sub-step 4: PIX + Service Areas */}
            {currentServiceSubStep === 4 && (
              <View style={styles.formContainer}>
                {renderInputSection(
                  'Chave PIX',
                  'Ex: seuemail@... ou 000.000.000-00',
                  formData.pixKey,
                  (text) => { setFormData(prev => ({ ...prev, pixKey: text })); setPixKeyError(null); },
                  'default',
                  false,
                  'card-outline',
                  undefined,
                  pixKeyError,
                  validateSubStep4
                )}

                {false && renderInputSection(
                  'Áreas de Atendimento',
                  'Ex: Campinas (Centro, Cambuí), Valinhos, Vinhedo',
                  formData.serviceAreas.join(', '),
                  (text) => { setFormData(prev => ({ ...prev, serviceAreas: text.split(',').map(s => s.trim()).filter(s => s) })); setServiceAreasError(null); },
                  'default',
                  true,
                  'location-outline',
                  300,
                  serviceAreasError,
                  validateSubStep4
                )}
              </View>
            )}
            {/* Sub-step 5: Cobertura & Agenda (Premium Component) */}
            {currentServiceSubStep === 5 && (
              <View style={styles.formContainer}>
                <ServiceDetailsStep5Premium
                  radiusKm={radiusKm}
                  setRadiusKm={setRadiusKm}
                  selectedDays={selectedDays}
                  toggleDay={toggleDay}
                  upcoming={upcoming}
                />
              </View>
            )}
            {generalError && <Text style={styles.inlineErrorMessageCentered}>{generalError}</Text>}

            {/* 2) Botões inferiores (premium clean) */}
            <View style={styles.navigationButtonsContainer}>
              {currentServiceSubStep > 1 && (
                <TouchableOpacity
                  onPress={handleBackSubStep}
                  activeOpacity={0.9}
                  style={btn.backGlass}
                  disabled={isUploading}
                >
                  <LinearGradient colors={['#FFFFFF', '#F7FAFF']} style={btn.backGlassInner}>
                    <Ionicons name="arrow-back-outline" size={18} color="#1F2A37" />
                    <Text style={btn.backGlassText}>Voltar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleNextSubStep}
                activeOpacity={0.95}
                disabled={isUploading}
                style={[btn.primaryWrap, isUploading && { opacity: 0.7 }]}
              >
                <LinearGradient colors={['#7DB7FF', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={btn.primary}>
                  {isUploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={btn.primaryText}>
                        {currentServiceSubStep === totalSteps ? 'Concluir cadastro' : 'Continuar'}
                      </Text>
                      <Ionicons
                        name={currentServiceSubStep === totalSteps ? 'checkmark-circle' : 'arrow-forward'}
                        size={18}
                        color="#fff"
                      />
                      <View style={btn.primaryGlow} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// Styles dos botões
const btn = StyleSheet.create({
  backGlass: {
    flex: 1, marginRight: 10, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)',
    minHeight: 48,
  },
  backGlassInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14,
  },
  backGlassText: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#1F2A37' },
  primaryWrap: { flex: 1, marginLeft: 10, borderRadius: 14, overflow: 'hidden', minHeight: 48, },
  primary: {
    paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 0,
    minHeight: 48,
  },
  primaryGlow: {
    position: 'absolute', bottom: -14, left: -10, right: -10, height: 28, borderRadius: 20,
    backgroundColor: 'rgba(59,130,246,0.25)', opacity: 0.65,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15, marginRight: 8, letterSpacing: 0.2 },
});


const styles = StyleSheet.create({
  headerGlass: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    marginBottom: 16,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject as any,
  },
  stepTitle: { fontWeight: '700', color: '#1E293B', fontSize: 15,
    
   },
  stepSubtitle: { color: '#64748B', fontSize: 13, marginTop: 4 },
  sliderWrap: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  dayCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    padding: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  dayLabel: { fontSize: 13, fontWeight: '600', color: '#3F4A5A', marginBottom: 6 },
  slotRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  slotChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.6)'
  },
  slotChipActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  slotText: { fontWeight: '600', color: '#1E293B', fontSize: 13 },
  slotTextActive: { color: '#fff' },
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: Platform.OS === 'android' ? 40 : 70,
    justifyContent: 'center',
    position: 'relative',
  },
  backButtonHeader: {
    position: 'absolute',
    left: 0,
    bottom: Platform.OS === 'android' ? -14 : 50,
    padding: 5,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingRight: 20,
  },
  backButtonHeaderText: {
    color: '#2C3E50',
    fontSize: 14,
    marginLeft: 5,
  },
  headerTitle: {
    bottom: Platform.OS === 'android' ? 50 : 0,
    fontSize: 18,
    left: Platform.OS === 'android' ? 2 : 0,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: Platform.OS === 'android' ? -69 : 12,
    marginTop: 10,
    textAlign: 'center',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: Platform.OS === 'android' ? 16 : 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    marginTop:  Platform.OS === 'android' ? 26 : 0,
    marginBottom: Platform.OS === 'android' ? 1 : 8,
  },
  microcopyText: {
    fontSize:  Platform.OS === 'android' ? 14 : 13,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: Platform.OS === 'android' ? -2 : 19,
    paddingHorizontal: 10,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A0D2EB',
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#6C757D',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
    alignSelf: 'flex-start',
    width: '100%',
  },
  priceHintText: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 12,
  },
  imageUploadButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#A0D2EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 20,
  },
  imageUploadButtonError: {
    borderColor: '#E53E3E',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 67,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(160, 210, 235, 0.1)',
  },
  uploadText: {
    fontSize: 12,
    color: '#A0D2EB',
    marginTop: 8,
    textAlign: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  formContainer: {
    marginBottom: 30,
    top: Platform.OS === 'android' ? 30 : 0,
  },
  inputSection: {
    marginBottom: Platform.OS === 'android' ? 10 : 20,
    top: Platform.OS === 'android' ? 0 : 0,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputContainerError: {
    borderColor: '#E53E3E',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2C3E50',
    borderRadius: 12,
    minHeight: 48,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  serviceTypeContainer: {
    marginBottom: 30,
  },
  serviceTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceTypeGridAndroidScale: {
    ...Platform.select({
      android: {
        transform: [{ scale: 0.92 }],
        marginTop: -2,
      },
      default: {},
    }),
  },
  priceTypeContainer: {
    marginBottom: 30,
  },
  priceTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceTypeCard: {
    width: '32%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0,
    minHeight: 48,
    justifyContent: 'center',
  },
  priceTypeCardSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  priceTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  priceTypeLabelSelected: {
    color: '#FFFFFF',
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  inlineErrorMessage: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 5,
    alignSelf: 'flex-start',
  },
  inlineErrorMessageCentered: {
    color: '#E53E3E',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
});

// Ensure all blocks are closed








