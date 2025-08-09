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
import { Ionicons } from '@expo/vector-icons';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

enum PricingType {
  FIXED_PRICE = 'FIXED_PRICE',
  HOURLY = 'HOURLY',
  BY_SIZE = 'BY_SIZE',
  CUSTOM_QUOTE = 'CUSTOM_QUOTE',
}

const SERVICE_MAPPINGS: { [key: string]: string } = {
  'residencial': '282e4bd7-6518-4d35-b097-7729f40df64e',
  'comercial': '30aec804-d85c-4c41-b978-53105b2437e4',
  'pos_obra': 'c8cbf3c1-2ac7-4507-8097-b00ad2ba3c2f',
  'escritorio': '662ea63b-d901-47c0-985f-86542f3f78d9',
  'passadoria': '7dad59ef-3b0a-431b-b700-cd18ded427ee',
  'vidros': 'a0fa793-9b0e-43d4-956d-e9b2b4aee1f4',
  'estofados': 'b6b120c6-51c0-4e82-be95-0e3c6a9fc261',
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

  const [isUploading, setIsUploading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  const handleContinue = async () => {
    console.log("[handleContinue] Iniciando processamento do formulário.");
    console.log("[handleContinue] Dados do formulário:", formData);

    if (!user || !user.token || !user.providerDetails?.id) {
        Alert.alert('Erro de autenticação', 'Usuário não logado ou detalhes do provedor ausentes. Por favor, faça login novamente.');
        console.error("[handleContinue] Erro: Usuário não autenticado ou providerDetails.id ausente.");
        return;
    }

    if (!formData.profilePhoto) {
      Alert.alert('Atenção', 'Por favor, adicione uma foto de perfil para continuar.');
      console.error("[handleContinue] Erro de validação: Foto de perfil ausente.");
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Atenção', 'A descrição do serviço é obrigatória.');
      console.error("[handleContinue] Erro de validação: Descrição ausente.");
      return;
    }
    if (!formData.yearsOfExperience.trim() || isNaN(parseInt(formData.yearsOfExperience))) {
      Alert.alert('Atenção', 'Os anos de experiência são obrigatórios e devem ser um número.');
      console.error("[handleContinue] Erro de validação: Anos de experiência inválidos.");
      return;
    }
    if (!formData.basePrice.trim() || isNaN(parseFloat(formData.basePrice))) {
      Alert.alert('Atenção', 'O preço base é obrigatório e deve ser um número.');
      console.error("[handleContinue] Erro de validação: Preço base inválido.");
      return;
    }
    if (formData.specialties.length === 0) {
      Alert.alert('Atenção', 'Por favor, selecione pelo menos um tipo de serviço.');
      console.error("[handleContinue] Erro de validação: Nenhuma especialidade selecionada.");
      return;
    }
    if (!formData.priceUnit) {
      Alert.alert('Atenção', 'Por favor, selecione um tipo de precificação (por hora, quarto, ou metragem).');
      console.error("[handleContinue] Erro de validação: Tipo de precificação não selecionado.");
      return;
    }
    
    setIsUploading(true);
    console.log("[handleContinue] Todas as validações passadas. Iniciando o fluxo de atualização.");

    try {
      const providerId = user.providerDetails.id;
      let avatarUrl: string | null | undefined = user.providerDetails.avatarUrl;
      console.log(`[handleContinue] URL do avatar inicial (do user.providerDetails): ${avatarUrl}`);

      if (formData.profilePhoto && formData.profilePhoto.startsWith('file://')) {
        console.log("[handleContinue] URI local detectada. Tentando fazer upload da foto de perfil...");
        try {
          const uploadResponse = await verificationService.uploadAvatar(formData.profilePhoto);
          if (uploadResponse && uploadResponse.url) {
            avatarUrl = uploadResponse.url;
            console.log("[handleContinue] Upload de foto de perfil concluído. Nova URL do avatar:", avatarUrl);
          } else {
            console.error("[handleContinue] Erro: O serviço de upload de avatar não retornou uma URL válida.");
            throw new Error('O serviço de upload de avatar não retornou uma URL válida.');
          }
        } catch (uploadError: any) {
          console.error("[handleContinue] Erro durante o upload da foto de perfil:", uploadError);
          throw new Error("Não foi possível fazer o upload da foto de perfil.");
        }
      }

      console.log("[handleContinue] Preparando dados para a atualização do perfil do provedor.");
      const profileUpdateData = {
        avatarUrl: avatarUrl,
        bio: formData.description,
        yearsOfExperience: parseInt(formData.yearsOfExperience, 10),
        pixKey: formData.pixKey,
      };
      console.log("[handleContinue] Dados de atualização do perfil:", profileUpdateData);
      
      await updateMyProviderProfile(profileUpdateData);
      console.log("[handleContinue] Perfil do provedor atualizado com sucesso.");

      console.log(`[handleContinue] Buscando serviços existentes para o providerId: ${providerId}`);
      const existingProviderServices = await getProviderServicesOffered(providerId);
      console.log(`[handleContinue] Encontrados ${existingProviderServices.length} serviços existentes.`);

      for (const specialty of formData.specialties) {
        const serviceId = SERVICE_MAPPINGS[specialty];
        if (!serviceId) {
          console.warn(`[handleContinue] Aviso: ServiceId não encontrado para a especialidade: ${specialty}. Pulando.`);
          continue;
        }
        console.log(`[handleContinue] Processando especialidade: ${specialty} (serviceId: ${serviceId})`);

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
            console.warn(`[handleContinue] Aviso: Tipo de precificação desconhecido para ${specialty}. Pulando.`);
            continue;
        }
        
        const existingService = existingProviderServices.find((s: any) => s.serviceId === serviceId);

        if (existingService) {
          console.log(`[handleContinue] Serviço existente encontrado para ${specialty}. Atualizando...`);
          const updatedServiceData = { ...serviceData };
          delete updatedServiceData.serviceId;
          await updateProviderServiceOffering(providerId, existingService.id, updatedServiceData);
          console.log(`[handleContinue] Serviço ${existingService.id} atualizado com sucesso.`);
        } else {
          console.log(`[handleContinue] Serviço não existente para ${specialty}. Criando novo...`);
          await addProviderServiceOffering(providerId, serviceData);
          console.log(`[handleContinue] Novo serviço criado com sucesso para ${specialty}.`);
        }
      }

      console.log("[handleContinue] Todos os serviços processados. Sucesso!");
      
      // Chamada para avançar o status de verificação no backend
      await verificationService.advanceVerificationStatus(); 
      // Atualiza o estado do usuário no AuthContext para refletir o novo status
      await updateUser(); 

      setIsRegistrationInProgress(false);
      Alert.alert('Sucesso', 'Seu perfil foi salvo! Agora vamos verificar seus documentos.');
      router.push('/provider-register/verify-account');

    } catch (error: any) {
      console.error('Erro ao salvar os dados do provedor:', error.response?.data || error.message, error.stack);
      Alert.alert('Erro', `Ocorreu um erro ao salvar seus dados: ${error.response?.data?.message || error.message}. Tente novamente.`);
    } finally {
      setIsUploading(false);
      console.log("[handleContinue] Processo de atualização finalizado.");
    }
};

const renderImageUploadSection = () => (
    <View style={styles.imageUploadContainer}>
      <Text style={styles.sectionTitle}>Foto do Perfil</Text>
      <TouchableOpacity
        style={styles.imageUploadButton}
        onPress={handleImagePicker}
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
    </View>
  );

  const renderInputSection = (
    title: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    keyboardType: any = 'default',
    multiline: boolean = false,
    icon: string = 'text-outline'
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
          </View>

          {/* Image Upload */}
          {renderImageUploadSection()}
          <Text style={styles.headerSubtitle}>
            Complete seu perfil profissional para começar a receber solicitações
          </Text>

          {/* Form Sections */}
          <View style={styles.formContainer}>
            {renderInputSection(
              'Descrição do Serviço',
              'Descreva sua experiência e especialidades...',
              formData.description,
              (text) => setFormData(prev => ({ ...prev, description: text })),
              'default',
              true,
              'document-text-outline'
            )}

            {renderInputSection(
              'Anos de Experiência',
              'Ex: 5',
              formData.yearsOfExperience,
              (text) => setFormData(prev => ({ ...prev, yearsOfExperience: text })),
              'numeric',
              false,
              'time-outline'
            )}

            {/* Nova seção de seleção do tipo de precificação */}
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
              (text) => setFormData(prev => ({ ...prev, basePrice: text })),
              'numeric',
              false,
              'cash-outline'
            )}

            {renderInputSection(
              'Chave PIX',
              'CPF, e-mail ou telefone',
              formData.pixKey,
              (text) => setFormData(prev => ({ ...prev, pixKey: text })),
              'default',
              false,
              'card-outline'
            )}
          </View>

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

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={isUploading}
          >
            <LinearGradient
              colors={['#A0D2EB', '#307cc9ff']}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>{isUploading ? 'Salvando...' : 'Continuar'}</Text>
              {!isUploading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            </LinearGradient>
          </TouchableOpacity>
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
    marginBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: -2,
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 19,
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
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
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
});
