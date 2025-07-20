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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [formData, setFormData] = useState<ServiceDetailsFormData>({
    profilePhoto: null,
    description: '',
    yearsOfExperience: '',
    basePrice: '',
    pixKey: '',
    specialties: [],
    serviceAreas: []
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
            <Text style={styles.headerSubtitle}>
              Complete seu perfil profissional para começar a receber solicitações
            </Text>
          </View>

          {/* Image Upload */}
          {renderImageUploadSection()}

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

            {renderInputSection(
              'Preço Base por Serviço (R$)',
              'Ex: 150.00',
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
            onPress={() => {
              // Implementar navegação para próxima etapa
              console.log('Form Data:', formData);
            }}
          >
            <LinearGradient
              colors={['#A0D2EB', '#2C3E50']}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  imageUploadContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
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
    fontSize: 16,
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
    backgroundColor: '#A0D2EB',
    borderColor: '#2C3E50',
  },
  serviceTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 8,
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
});