import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Added MaterialCommunityIcons for text-box-outline
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { useAuth } from '../../../hooks/useAuth';
import {
  updateMyProviderProfile,
  addProviderServiceOffering,
  updateProviderServiceOffering,
  getProviderServicesOffered,
} from '../../../services/providerService';
import verificationService from '../../../services/verificationService';
import axios from 'axios'; // Importar axios para verificar o tipo de erro

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
  serviceAreas: string[]; // Added serviceAreas to formData
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
    serviceAreas: [], // Initialize serviceAreas
    priceUnit: null,
  });

  // NEW: State for current sub-step within service details
  const [currentServiceSubStep, setCurrentServiceSubStep] = useState(1); // 1: Photo/Desc, 2: Exp/Specialties, 3: Price, 4: PIX/Areas

  const [isUploading, setIsUploading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current; // Added for avatar animation

  // Adicionando a lógica da barra de progresso (already existed, keeping it)
  const totalSteps = 4; // Total sub-steps for service details
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
  }, [currentServiceSubStep]); // Re-run animation on sub-step change

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

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          profilePhoto: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  // NEW: Validation functions for each sub-step
  const validateSubStep1 = () => { // Photo + Description
    if (!formData.profilePhoto) {
      Alert.alert('Atenção', 'Por favor, adicione uma foto de perfil para continuar.');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Atenção', 'A descrição do serviço é obrigatória.');
      return false;
    }
    return true;
  };

  const validateSubStep2 = () => { // Experience + Specialties
    if (!formData.yearsOfExperience.trim() || isNaN(parseInt(formData.yearsOfExperience))) {
      Alert.alert('Atenção', 'Os anos de experiência são obrigatórios e devem ser um número.');
      return false;
    }
    if (formData.specialties.length === 0) {
      Alert.alert('Atenção', 'Por favor, selecione pelo menos um tipo de serviço.');
      return false;
    }
    return true;
  };

  const validateSubStep3 = () => { // Price + Unit
    if (!formData.priceUnit) {
      Alert.alert('Atenção', 'Por favor, selecione um tipo de precificação (por hora, quarto, ou metragem).');
      return false;
    }
    if (!formData.basePrice.trim() || isNaN(parseFloat(formData.basePrice))) {
      Alert.alert('Atenção', 'O preço base é obrigatório e deve ser um número.');
      return false;
    }
    return true;
  };

  const validateSubStep4 = () => { // PIX + Service Areas
    if (!formData.pixKey.trim()) {
      Alert.alert('Atenção', 'A chave PIX é obrigatória.');
      return false;
    }
    if (!formData.serviceAreas.length) { // Validate if serviceAreas is empty
      Alert.alert('Atenção', 'Por favor, informe suas áreas de atendimento.');
      return false;
    }
    return true;
  };

  const handleNextSubStep = async () => {
    if (currentServiceSubStep === 1 && validateSubStep1()) {
      setCurrentServiceSubStep(2);
    } else if (currentServiceSubStep === 2 && validateSubStep2()) {
      setCurrentServiceSubStep(3);
    } else if (currentServiceSubStep === 3 && validateSubStep3()) {
      setCurrentServiceSubStep(4);
    } else if (currentServiceSubStep === 4 && validateSubStep4()) {
      // If all sub-steps are valid, proceed to final submission
      handleFinalSubmission();
    }
  };

  const handleBackSubStep = () => {
    if (currentServiceSubStep > 1) {
      setCurrentServiceSubStep(currentServiceSubStep - 1);
    } else {
      router.back(); // Go back to previous screen if on first sub-step
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
      Alert.alert('Erro de Validação', 'Por favor, preencha todos os campos obrigatórios corretamente.');
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
        } else if (formData.priceUnit === 'metragem') { // This was the original 'metragem' condition
          serviceData.pricingType = PricingType.BY_SIZE;
          serviceData.pricePerSquareMeter = basePriceValue;
          serviceData.pricePerRoom = null;
          serviceData.price = 0;
        } else { // This 'else' was added by me in the previous turn, but it's redundant if 'metragem' is explicit
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
              Alert.alert('Erro', errorMessage);
          }
      } else if (error.message) {
          errorMessage = error.message;
          Alert.alert('Erro', errorMessage);
      } else {
          Alert.alert('Erro', 'Ocorreu um erro desconhecido ao salvar seus dados. Tente novamente.');
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
    maxLength?: number
  ) => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>
        <Ionicons name={icon as any} size={16} color="#2C3E50" /> {title}
      </Text>
      <View style={styles.inputContainer}>
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
        />
      </View>
    </View>
  );

  const getPriceInputPlaceholder = (unit: PriceUnit) => {
    switch (unit) {
      case 'hora':
        return 'Preço por hora';
      case 'quarto':
        return 'Preço por quarto';
      case 'metragem':
        return 'Preço por m²';
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

  return (
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

          {/* Sub-step 1: Photo + Description */}
          {currentServiceSubStep === 1 && (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Foto do Perfil</Text>
              <TouchableOpacity
                style={[styles.imageUploadButton, {transform: [{scale: avatarScaleAnim}]}]}
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

              {renderInputSection(
                'Descrição do Serviço',
                'Descreva sua experiência e especialidades...',
                formData.description,
                (text) => setFormData(prev => ({ ...prev, description: text })),
                'default',
                true,
                'document-text-outline',
                500 // MaxLength for description
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
                (text) => setFormData(prev => ({ ...prev, yearsOfExperience: text.replace(/[^0-9]/g, '') })), // Only numbers
                'numeric',
                false,
                'time-outline',
                2 // MaxLength for years of experience
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
                    { id: 'metragem', label: 'Metragem' }
                  ].map((priceOption) => (
                    <TouchableOpacity
                      key={priceOption.id}
                      style={[
                        styles.priceTypeCard,
                        formData.priceUnit === priceOption.id && styles.priceTypeCardSelected
                      ]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, priceUnit: priceOption.id as PriceUnit }));
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
              </View>

              {renderInputSection(
                `Preço Base (${formData.priceUnit ? `por ${formData.priceUnit}` : 'do Serviço'})`,
                getPriceInputPlaceholder(formData.priceUnit),
                formData.basePrice,
                (text) => setFormData(prev => ({ ...prev, basePrice: text.replace(/[^0-9.]/g, '') })), // Only numbers and dot
                'numeric',
                false,
                'cash-outline'
              )}
            </View>
          )}

          {/* Sub-step 4: PIX + Service Areas */}
          {currentServiceSubStep === 4 && (
            <View style={styles.formContainer}>
              {renderInputSection(
                'Chave PIX',
                'CPF, e-mail ou telefone',
                formData.pixKey,
                (text) => setFormData(prev => ({ ...prev, pixKey: text })),
                'default',
                false,
                'card-outline'
              )}

              {renderInputSection(
                'Áreas de Atendimento',
                'Ex: Campinas (Centro, Cambuí), Valinhos, Vinhedo',
                formData.serviceAreas.join(', '), // Display as comma-separated string
                (text) => setFormData(prev => ({ ...prev, serviceAreas: text.split(',').map(s => s.trim()).filter(s => s) })), // Convert back to array
                'default',
                true,
                'location-outline',
                300 // MaxLength for service areas
              )}
            </View>
          )}

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
                <Text style={styles.continueButtonText}>
                  {isUploading ? 'Salvando...' : (currentServiceSubStep === totalSteps ? 'Finalizar Cadastro' : 'Próximo')}
                </Text>
                {!isUploading && currentServiceSubStep !== totalSteps && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
                {!isUploading && currentServiceSubStep === totalSteps && <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'center', // Center the title
    position: 'relative', // For absolute positioning of back button
  },
  backButtonHeader: {
    position: 'absolute',
    left: 0,
    padding: 5,
    zIndex: 1, // Ensure it's above other elements
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: -2,
    marginTop: 20,
    textAlign: 'center', // Ensure title is centered
    flex: 1, // Allow title to take up available space
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 19,
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
  imageUploadContainer: {
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
    marginBottom: 20, // Added margin for separation
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flex: 1, // Allow button to grow
    marginLeft: 10, // Space from back button
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12, // Apply borderRadius to the gradient too
  },
  continueButtonText: {
    fontSize: 18,
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
  progressWrapper: {
  alignItems: 'center',
  marginBottom: 20,
},
progressOuter: {
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
progressInner: {
  height: 30,
  borderRadius: 100,
  backgroundColor: '#4facfe',
  shadowColor: '#4facfe',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.6,
  shadowRadius: 8,
},
progressLabel: {
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
});