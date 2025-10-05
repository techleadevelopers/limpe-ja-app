import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Animated,
  Alert,
  Dimensions,
  ActivityIndicator, // Added ActivityIndicator for loading state
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { SafeAreaView } from 'react-native-safe-area-context'; // Imported for use

import { useAuth } from '../../../hooks/useAuth';
import {
  updateMyProviderProfile,
  addProviderServiceOffering,
  updateProviderServiceOffering,
  getProviderServicesOffered,
} from '../../../services/providerService';
import verificationService from '../../../services/verificationService';
import axios from 'axios';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

enum PricingType {
  FIXED_PRICE = 'FIXED_PRICE',
  HOURLY = 'HOURLY',
  BY_SIZE = 'BY_SIZE',
  CUSTOM_QUOTE = 'CUSTOM_QUOTE',
}

const SERVICE_MAPPINGS: { [key: string]: string } = {
    'residencial': 'f0c16afd-f1e5-41e4-92ef-9f64ecabf6ea',
    'comercial': '4c03312c-15c2-40d3-a041-1217bb6877ba',
    'pos_obra': '646b296e-6a82-4f6e-a249-8df8f3851879',
    'escritorio': 'afab28ad-c1e2-48ac-bb4b-406e90781ce5',
    'passadoria': '13d2047c-86f3-4d8d-ba56-c3b166b95115',
    'vidros': '9fa978db-511d-4600-86e2-d077b9ef7650',
    'estofados': 'adaea89b-2934-4848-95fe-030c371dfed9',
};

type PriceUnit = 'hora' | 'quarto' | 'metragem' | null;

interface ServiceDetailsFormData {
  profilePhoto: string | null;
  description: string;
  yearsOfExperience: string;
  basePrice: string;
  pixKey: string;
  specialties: string[];
  serviceAreas: string[];
  priceUnit: PriceUnit;
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
    priceUnit: null,
  });

  const [currentServiceSubStep, setCurrentServiceSubStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  // Error states for inline validation
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [yearsOfExperienceError, setYearsOfExperienceError] = useState<string | null>(null);
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null);
  const [priceUnitError, setPriceUnitError] = useState<string | null>(null);
  const [basePriceError, setBasePriceError] = useState<string | null>(null);
  const [pixKeyError, setPixKeyError] = useState<string | null>(null);
  const [serviceAreasError, setServiceAreasError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null); // For general API errors

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;

  const totalSteps = 4;
  const progress = currentServiceSubStep / totalSteps;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentServiceSubStep]);

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
        console.log("Service details form data saved to AsyncStorage.");
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
            priceUnit: loadedData.priceUnit || null,
          });
          setCurrentServiceSubStep(loadedData.currentServiceSubStep || 1);
          setGeneralError("Dados carregados automaticamente. Continue preenchendo seus detalhes de serviço.");
          console.log("Service details form data loaded from AsyncStorage.");
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

      if (!result.canceled && result.assets && result.assets.length > 0) { // Added check for result.assets and its length
        setFormData(prev => ({
          ...prev,
          profilePhoto: result.assets[0].uri
        }));
        setProfilePhotoError(null); // Clear error on successful pick
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  // NEW: Validation functions for each sub-step
  const validateSubStep1 = useCallback(() => { // Photo + Description
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

  const validateSubStep2 = useCallback(() => { // Experience + Specialties
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

  const validateSubStep3 = useCallback(() => { // Price + Unit
    let isValid = true;
    setPriceUnitError(null);
    setBasePriceError(null);

    if (!formData.priceUnit) {
      setPriceUnitError('Por favor, selecione um tipo de precificação.');
      isValid = false;
    }
    const price = parseFloat(formData.basePrice);
    if (!formData.basePrice.trim() || isNaN(price) || price <= 0) {
      setBasePriceError('O preço base é obrigatório e deve ser um número maior que zero.');
      isValid = false;
    }
    return isValid;
  }, [formData.priceUnit, formData.basePrice]);

  const validateSubStep4 = useCallback(() => { // PIX + Service Areas
    let isValid = true;
    setPixKeyError(null);
    setServiceAreasError(null);

    if (!formData.pixKey.trim()) {
      setPixKeyError('A chave PIX é obrigatória para que você possa receber pagamentos.');
      isValid = false;
    }
    if (!formData.serviceAreas.length) { // Validate if serviceAreas is empty
      setServiceAreasError('Por favor, informe suas áreas de atendimento (cidades ou bairros).');
      isValid = false;
    }
    return isValid;
  }, [formData.pixKey, formData.serviceAreas]);


  const handleNextSubStep = async () => {
    setGeneralError(null); // Clear general error before next step attempt
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
        // If all sub-steps are valid, proceed to final submission
        handleFinalSubmission();
      } else {
        setGeneralError('Por favor, preencha todos os campos obrigatórios da etapa atual.');
      }
    }
  };

 const handleBackSubStep = () => {
    setGeneralError(null); // Clear general error when going back
    // Clear all specific errors when going back
    setProfilePhotoError(null);
    setDescriptionError(null);
    setYearsOfExperienceError(null);
    setSpecialtiesError(null);
    setPriceUnitError(null);
    setBasePriceError(null);
    setPixKeyError(null);
    setServiceAreasError(null);

    if (currentServiceSubStep > 1) {
        setCurrentServiceSubStep(currentServiceSubStep - 1);
    } else {
        // Check if there's a screen to go back to in the navigation history
        if (router.canGoBack()) {
            router.back();
        } else {
            // If there's no screen to go back to, navigate to a specific known route.
            // Assuming '/provider-register' is the root of this flow.
            // Using `replace` prevents adding the current screen to the history if it's an initial entry.
            router.replace('/provider-register');
            console.warn("Attempted to go back from the first step with no history. Navigating to '/provider-register'.");
        }
    }
};

  const handleFinalSubmission = async () => {
    console.log("[handleFinalSubmission] Iniciando processamento do formulário.");
    console.log("[handleFinalSubmission] Dados do formulário:", formData);

    if (!user || !user.token || !user.providerDetails?.id) {
        Alert.alert('Erro de autenticação', 'Usuário não logado ou detalhes do provedor ausentes. Por favor, faça login novamente.');
        console.error("[handleFinalSubmission] Erro: Usuário não autenticado ou providerDetails.id ausente.");
        return;
    }

    // Re-validate all steps before final submission to ensure data integrity
    if (!validateSubStep1() || !validateSubStep2() || !validateSubStep3() || !validateSubStep4()) {
      setGeneralError('Por favor, preencha todos os campos obrigatórios corretamente antes de finalizar.');
      return;
    }
    
    setIsUploading(true);
    console.log("[handleFinalSubmission] Todas as validações passadas. Iniciando o fluxo de atualização.");

    try {
      const providerId = user.providerDetails.id;
      let avatarUrl: string | null | undefined = user.providerDetails.avatarUrl;
      console.log(`[handleFinalSubmission] URL do avatar inicial (do user.providerDetails): ${avatarUrl}`);

      if (formData.profilePhoto && formData.profilePhoto.startsWith('file://')) {
        console.log("[handleFinalSubmission] URI local detectada. Tentando fazer upload da foto de perfil...");
        try {
          const uploadResponse = await verificationService.uploadAvatar(formData.profilePhoto);
          if (uploadResponse && uploadResponse.url) {
            avatarUrl = uploadResponse.url;
            console.log("[handleFinalSubmission] Upload de foto de perfil concluído. Nova URL do avatar:", avatarUrl);
          } else {
            console.error("[handleFinalSubmission] Erro: O serviço de upload de avatar não retornou uma URL válida.");
            throw new Error('O serviço de upload de avatar não retornou uma URL válida.');
          }
        } catch (uploadError: any) {
          console.error("[handleFinalSubmission] Erro durante o upload da foto de perfil:", uploadError);
          throw new Error("Não foi possível fazer o upload da foto de perfil.");
        }
      }

      console.log("[handleFinalSubmission] Preparando dados para a atualização do perfil do provedor.");
      const profileUpdateData = {
        avatarUrl: avatarUrl,
        bio: formData.description,
        yearsOfExperience: parseInt(formData.yearsOfExperience, 10),
        pixKey: formData.pixKey,
        // serviceAreas: formData.serviceAreas.join(', '), // Assuming serviceAreas is an array of strings
      };
      console.log("[handleFinalSubmission] Dados de atualização do perfil:", profileUpdateData);
      
      await updateMyProviderProfile(profileUpdateData);
      console.log("[handleFinalSubmission] Perfil do provedor atualizado com sucesso.");

      console.log(`[handleFinalSubmission] Buscando serviços existentes para o providerId: ${providerId}`);
      const existingProviderServices = await getProviderServicesOffered(providerId);
      console.log(`[handleFinalSubmission] Encontrados ${existingProviderServices.length} serviços existentes.`);

      for (const specialty of formData.specialties) {
        const serviceId = SERVICE_MAPPINGS[specialty];
        if (!serviceId) {
          console.warn(`[handleFinalSubmission] Aviso: ServiceId não encontrado para a especialidade: ${specialty}. Pulando.`);
          continue;
        }
        console.log(`[handleFinalSubmission] Processando especialidade: ${specialty} (serviceId: ${serviceId})`);

        let serviceData: any = {
          serviceId: serviceId,
          description: formData.description,
          durationMinutes: 60,
        };

        const basePriceValue = parseFloat(formData.basePrice);
        if (formData.priceUnit === 'hora') {
          serviceData.pricingType = PricingType.HOURLY;
          serviceData.price = basePriceValue;
          serviceData.pricePerRoom = null;
          serviceData.pricePerSquareMeter = null;
        } else if (formData.priceUnit === 'quarto') {
          serviceData.pricingType = PricingType.BY_SIZE;
          serviceData.pricePerRoom = basePriceValue;
          serviceData.pricePerSquareMeter = null;
          serviceData.price = 0;
        } else if (formData.priceUnit === 'metragem') {
          serviceData.pricingType = PricingType.BY_SIZE;
          serviceData.pricePerSquareMeter = basePriceValue;
          serviceData.pricePerRoom = null;
          serviceData.price = 0;
        } else {
            console.warn(`[handleFinalSubmission] Aviso: Tipo de precificação desconhecido para ${specialty}. Pulando.`);
            continue;
        }
        
        const existingService = existingProviderServices.find((s: any) => s.serviceId === serviceId);

        if (existingService) {
          console.log(`[handleFinalSubmission] Serviço existente encontrado para ${specialty}. Atualizando...`);
          const updatedServiceData = { ...serviceData };
          delete updatedServiceData.serviceId;
          await updateProviderServiceOffering(providerId, existingService.id, updatedServiceData);
          console.log(`[handleFinalSubmission] Serviço ${existingService.id} atualizado com sucesso.`);
        } else {
          console.log(`[handleFinalSubmission] Serviço não existente para ${specialty}. Criando novo...`);
          await addProviderServiceOffering(providerId, serviceData);
          console.log(`[handleFinalSubmission] Novo serviço criado com sucesso para ${specialty}.`);
        }
      }

      console.log("[handleFinalSubmission] Todos os serviços processados. Sucesso!");
      
      // Chamada para avançar o status de verificação no backend
      await verificationService.advanceVerificationStatus(); 
      console.log("[handleFinalSubmission] Status de verificação avançado para PENDING_DOCUMENTS_UPLOAD.");

      // Atualiza o estado do usuário no AuthContext para refletir o novo status
      await updateUser(); 
      console.log("[handleFinalSubmission] AuthContext user data refreshed.");

      setIsRegistrationInProgress(false);
      // Clear AsyncStorage after successful registration
      await AsyncStorage.removeItem('serviceDetailsFormData');

      Alert.alert('Sucesso', 'Seu perfil foi salvo! Agora vamos verificar seus documentos.', [
        {
            text: 'OK',
            onPress: () => {
                console.log("[handleFinalSubmission] Alerta 'OK' pressionado. Redirecionando para /provider-register/verify-account.");
                router.push('/provider-register/verify-account');
            },
        },
      ]);

    } catch (error: any) {
      console.error('Erro ao salvar os dados do provedor:', error.response?.data || error.message, error.stack);
      let errorMessage = 'Ocorreu um erro ao salvar seus dados. Tente novamente.';

      if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 401) {
              console.log("[handleFinalSubmission] Erro 401 detectado. AuthContext deve ter acionado logout. Não exibir alerta duplicado.");
          } else {
              errorMessage = error.response.data.message || `Erro do servidor com status ${error.response.status}`;
              setGeneralError(errorMessage); // Display error below form
          }
      } else if (error.message) {
          errorMessage = error.message;
          setGeneralError(errorMessage); // Display error below form
      } else {
          setGeneralError('Ocorreu um erro desconhecido ao salvar seus dados. Tente novamente.');
      }
    } finally {
      setIsUploading(false);
      console.log("[handleFinalSubmission] Processo de atualização finalizado.");
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
    error: string | null = null, // Added error prop
    onBlur?: () => void // Added onBlur prop
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
          onBlur={onBlur} // Apply onBlur
        />
      </View>
      {error && <Text style={styles.inlineErrorMessage}>{error}</Text>}
    </View>
  );

  const getPriceInputPlaceholder = (unit: PriceUnit) => {
    switch (unit) {
      case 'hora':
        return 'Ex: 50.00 (por hora)';
      case 'quarto':
        return 'Ex: 150.00 (por quarto)';
      case 'metragem':
        return 'Ex: 5.00 (por m²)';
      default:
        return 'Preço base';
    }
  };

  const getSubStepTitle = () => {
    switch (currentServiceSubStep) {
      case 1: return '1. Foto e Descrição';
      case 2: return '2. Experiência e Especialidades';
      case 3: return '3. Preço e Unidade';
      case 4: return '4. Chave PIX e Áreas de Atendimento';
      default: return 'Detalhes do Serviço';
    }
  };

  const getMicrocopyText = () => {
    switch (currentServiceSubStep) {
      case 1: return 'Sua foto e uma breve descrição ajudam os clientes a te conhecerem.';
      case 2: return 'Conte-nos sobre sua experiência e os serviços que você oferece.';
      case 3: return 'Defina como você precifica seus serviços.';
      case 4: return 'Para receber pagamentos e informar suas áreas de atuação.';
      default: return '';
    }
  };

  const getBackButtonText = () => {
    if (currentServiceSubStep === 1) return 'Voltar para Cadastro'; // Assuming it goes back to provider-register/index
    if (currentServiceSubStep === 2) return 'Voltar para Foto/Descrição';
    if (currentServiceSubStep === 3) return 'Voltar para Experiência';
    if (currentServiceSubStep === 4) return 'Voltar para Preço';
    return 'Voltar';
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
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{`Etapa ${currentServiceSubStep} de ${totalSteps}`}</Text>
            </View>

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
                    <Image source={{ uri: formData.profilePhoto }} style={styles.uploadedImage} />
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
                  500, // MaxLength for description
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
                  (text) => { setFormData(prev => ({ ...prev, yearsOfExperience: text.replace(/[^0-9]/g, '') })); setYearsOfExperienceError(null); }, // Only numbers
                  'numeric',
                  false,
                  'time-outline',
                  2, // MaxLength for years of experience
                  yearsOfExperienceError,
                  validateSubStep2
                )}

                {/* Service Type Selection */}
                <View style={styles.serviceTypeContainer}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="home-outline" size={16} color="#2C3E50" /> Tipo de Serviço
                  </Text>
                  <View style={styles.serviceTypeGrid}>
                    {[
                      { id: 'residencial', label: 'Residencial', icon: 'home' },
                      { id: 'comercial', label: 'Comercial', icon: 'business' },
                      { id: 'escritorio', label: 'Escritório', icon: 'desktop' },
                      { id: 'pos_obra', label: 'Pós-Obra', icon: 'construct' }
                    ].map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={[
                          styles.serviceTypeCard,
                          formData.specialties.includes(service.id) && styles.serviceTypeCardSelected
                        ]}
                        onPress={() => {
                          setFormData(prev => ({
                            ...prev,
                            specialties: prev.specialties.includes(service.id)
                              ? prev.specialties.filter(s => s !== service.id)
                              : [...prev.specialties, service.id]
                          }));
                          setSpecialtiesError(null); // Clear error on selection
                        }}
                      >
                        <Ionicons
                          name={service.icon as any}
                          size={24}
                          color={formData.specialties.includes(service.id) ? '#FFFFFF' : '#A0D2EB'}
                        />
                        <Text style={[
                          styles.serviceTypeLabel,
                          formData.specialties.includes(service.id) && styles.serviceTypeLabelSelected
                        ]}>
                          {service.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {specialtiesError && <Text style={styles.inlineErrorMessage}>{specialtiesError}</Text>}
                </View>
              </View>
            )}

            {/* Sub-step 3: Price + Unit */}
            {currentServiceSubStep === 3 && (
              <View style={styles.formContainer}>
                <View style={styles.priceTypeContainer}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="pricetag-outline" size={16} color="#2C3E50" /> Tipo de Precificação
                  </Text>
                  <View style={styles.priceTypeGrid}>
                    {[
                      { id: 'hora', label: 'Por Hora' },
                      { id: 'quarto', label: 'Por Quarto' },
                      { id: 'metragem', label: 'Por m²' }
                    ].map((priceOption) => (
                      <TouchableOpacity
                        key={priceOption.id}
                        style={[
                          styles.priceTypeCard,
                          formData.priceUnit === priceOption.id && styles.priceTypeCardSelected
                        ]}
                        onPress={() => {
                          setFormData(prev => ({ ...prev, priceUnit: priceOption.id as PriceUnit }));
                          setPriceUnitError(null); // Clear error on selection
                        }}
                      >
                        <Text style={[
                          styles.priceTypeLabel,
                          formData.priceUnit === priceOption.id && styles.priceTypeLabelSelected
                        ]}>
                          {priceOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {priceUnitError && <Text style={styles.inlineErrorMessage}>{priceUnitError}</Text>}
                </View>

                {renderInputSection(
                  `Preço Base (${formData.priceUnit ? `por ${formData.priceUnit}` : 'do Serviço'})`,
                  getPriceInputPlaceholder(formData.priceUnit),
                  formData.basePrice,
                  (text) => { setFormData(prev => ({ ...prev, basePrice: text.replace(/[^0-9.]/g, '') })); setBasePriceError(null); }, // Only numbers and dot
                  'numeric',
                  false,
                  'cash-outline',
                  undefined, // No max length for price
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
                  'Ex: seuemail@email.com ou 000.000.000-00',
                  formData.pixKey,
                  (text) => { setFormData(prev => ({ ...prev, pixKey: text })); setPixKeyError(null); },
                  'default',
                  false,
                  'card-outline',
                  undefined, // No max length
                  pixKeyError,
                  validateSubStep4
                )}

                {renderInputSection(
                  'Áreas de Atendimento',
                  'Ex: Campinas (Centro, Cambuí), Valinhos, Vinhedo',
                  formData.serviceAreas.join(', '), // Display as comma-separated string
                  (text) => { setFormData(prev => ({ ...prev, serviceAreas: text.split(',').map(s => s.trim()).filter(s => s) })); setServiceAreasError(null); }, // Convert back to array
                  'default',
                  true,
                  'location-outline',
                  300, // MaxLength for service areas
                  serviceAreasError,
                  validateSubStep4
                )}
              </View>
            )}
            {generalError && <Text style={styles.inlineErrorMessageCentered}>{generalError}</Text>}

            {/* Navigation Buttons */}
            <View style={styles.navigationButtonsContainer}>
              {currentServiceSubStep > 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.backButton]}
                  onPress={handleBackSubStep}
                  disabled={isUploading}
                >
                  <Ionicons name="arrow-back-outline" size={20} color="#00BCD4" />
                  <Text style={styles.navButtonTextBack}>Voltar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.navButton, styles.continueButton, isUploading && styles.buttonDisabled]}
                onPress={handleNextSubStep}
                disabled={isUploading}
              >
                <LinearGradient
                  colors={['#A0D2EB', '#307cc9ff']}
                  style={styles.continueButtonGradient}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.continueButtonText}>
                        {currentServiceSubStep === totalSteps ? 'Finalizar Cadastro' : 'Próximo'}
                      </Text>
                      {currentServiceSubStep !== totalSteps && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
                      {currentServiceSubStep === totalSteps && <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
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

const styles = StyleSheet.create({
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
    // paddingTop: Platform.OS === 'ios' ? 50 : 30, // Removed as SafeAreaView handles it
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 70,
    justifyContent: 'center', // Center the title
    position: 'relative', // For absolute positioning of back button
  },
  backButtonHeader: {
    position: 'absolute',
    left: 0,
    bottom: 60,
    padding: 5,
    zIndex: 1, // Ensure it's above other elements
    flexDirection: 'row', // Align icon and text
    alignItems: 'center',
  },
  backButtonHeaderText: { // Style for the back button text in header
    color: '#2C3E50',
    fontSize: 14,
    marginLeft: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
    marginTop: 10,
    textAlign: 'center', // Ensure title is centered
    flex: 1, // Allow title to take up available space
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    
    marginBottom: 8, // Reduced margin
  },
  microcopyText: { // New style for microcopy
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 19, // Adjusted margin
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
  imageUploadContainer: { // Not directly used, but related to image upload
    marginBottom: 30,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
    alignSelf: 'flex-start',
    width: '100%',
  },
  imageUploadButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#A0D2EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
    left: 90,
    marginBottom: 20, // Added margin for separation
  },
  imageUploadButtonError: { // Style for error state
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
  },
  inputSection: {
    marginBottom: 20,
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
    elevation: 3,
    borderWidth: 1, // Added for error highlighting
    borderColor: 'transparent', // Default
  },
  inputContainerError: { // Style for error state
    borderColor: '#E53E3E',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2C3E50',
    borderRadius: 12,
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
  serviceTypeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceTypeCardSelected: {
    backgroundColor: '#a0a4ebff',
    borderColor: '#529ae2ff',
  },
  serviceTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  serviceTypeLabelSelected: {
    color: '#FFFFFF',
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  
    flex: 1, // Allow button to grow
    marginLeft: 10, // Space from back button
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12, // Apply borderRadius to the gradient too
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
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
    elevation: 3,
  },
  priceTypeCardSelected: {
    backgroundColor: '#a0a4ebff',
    borderColor: '#529ae2ff',
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
  progressWrapper: { // Not used in this component
  alignItems: 'center',
  marginBottom: 20,
},
progressOuter: { // Not used in this component
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderRadius: 100,
  paddingHorizontal: 5,
  height: 40,
  width: SCREEN_WIDTH - 40,
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 4,
  
},
progressInner: { // Not used in this component
  height: 30,
  borderRadius: 100,
  backgroundColor: '#4facfe',
  shadowColor: '#4facfe',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.6,
  shadowRadius: 8,
},
progressLabel: { // Not used in this component
  marginTop: 8,
  fontSize: 14,
  fontWeight: '600',
  color: '#2C3E50',
},
navigationButtonsContainer: { // New style for the navigation buttons
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
},
navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12, // Adjusted for new design
    minWidth: 120,
},
backButton: {
    backgroundColor: '#E9ECEF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    flex: 1, // Allow button to grow
    marginRight: 10, // Space from continue button
},
navButtonTextBack: {
    color: '#2C3E50', // Darker color for back button text
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
},
buttonDisabled: {
    opacity: 0.6, // Visual cue for disabled buttons
},
inlineErrorMessage: { // For inline field errors
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 4,
    marginBottom: -10, // Adjust to pull up next element
    marginLeft: 5,
    alignSelf: 'flex-start',
},
inlineErrorMessageCentered: { // For general errors, centered
    color: '#E53E3E',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
},
});