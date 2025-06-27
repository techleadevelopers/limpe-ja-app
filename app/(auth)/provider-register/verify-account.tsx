// app/(provider)/verify-account.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Para selecionar/tirar fotos

// ATENÇÃO: Substitua pelo caminho correto do seu logo em formato "V" ou "FV" azul
const LOGO_IMAGE = require('../../../assets/images/logo.png'); // Ajuste o caminho se necessário

// Componente AnimatedErrorMessage copiado de register-provider.tsx
const AnimatedErrorMessage: React.FC<{ message: string | null; centered?: boolean }> = ({ message, centered }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: message ? 1 : 0,
      duration: message ? 300 : 200,
      useNativeDriver: true,
    }).start();
  }, [message, fadeAnim]);

  if (!message) return null;
  return (
    <Animated.Text style={[styles.inlineErrorMessage, { opacity: fadeAnim, textAlign: centered ? 'center' : 'left' }]}>
      {message}
    </Animated.Text>
  );
};

// Mock de um serviço de upload e verificação no frontend
// No backend, você terá endpoints reais para isso
const mockVerificationService = {
  submitCpfForBackgroundCheck: async (cpf: string): Promise<void> => {
    console.log("Submitting CPF for background check:", cpf);
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulação de erro
    if (cpf === '11111111111') {
      throw new Error("CPF with pending issues detected.");
    }
    // No backend real, isso dispararia a consulta e atualizaria o status do provedor
  },
  uploadDocumentPhoto: async (uri: string, type: 'front' | 'back'): Promise<void> => {
    console.log(`Uploading document photo (${type}):`, uri);
    await new Promise(resolve => setTimeout(resolve, 2000));
    // No backend real, isso faria o upload para S3/GCS e associaria ao provedor
  },
  uploadSelfieWithDocument: async (uri: string): Promise<void> => {
    console.log("Uploading selfie with document:", uri);
    await new Promise(resolve => setTimeout(resolve, 2000));
    // No backend real, isso faria o upload e associaria ao provedor
  },
};

export default function VerifyAccountScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [currentVerificationStep, setCurrentVerificationStep] = useState(1); // 1: CPF, 2: Document Photo, 3: Selfie
  
  // Estados para a verificação
  const [cpf, setCpf] = useState('');
  const [documentPhotoFront, setDocumentPhotoFront] = useState<string | null>(null);
  // const [documentPhotoBack, setDocumentPhotoBack] = useState<string | null>(null); // Opcional, se precisar do verso
  const [selfieWithDocument, setSelfieWithDocument] = useState<string | null>(null);

  // Animações
  const mainElementsOpacity = useRef(new Animated.Value(0)).current;
  const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
        Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
        Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
    ]).start();
  }, [mainElementsOpacity, mainElementsTranslateY]);

  const createButtonAnimations = () => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
    return { scaleAnim, onPressIn, onPressOut };
  };

  const nextButtonAnims = createButtonAnimations(); // Para o botão "Próximo"
  const finalButtonAnims = createButtonAnimations(); // Para o botão "Finalizar Verificação"

  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    setGeneralError(null);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async (setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    setGeneralError(null);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão Necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validateStep1 = () => {
    if (!cpf.trim() || cpf.trim().length !== 11 || isNaN(Number(cpf.trim()))) {
      setGeneralError("Por favor, insira um CPF válido (11 dígitos numéricos).");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!documentPhotoFront) {
      setGeneralError("Por favor, envie a foto da frente do seu documento.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!selfieWithDocument) {
      setGeneralError("Por favor, envie sua selfie segurando o documento.");
      return false;
    }
    return true;
  };

  const handleNextVerificationStep = async () => {
    setGeneralError(null);
    setIsLoading(true);
    try {
      if (currentVerificationStep === 1) {
        if (!validateStep1()) {
          return;
        }
        await mockVerificationService.submitCpfForBackgroundCheck(cpf.trim());
        setCurrentVerificationStep(2);
      } else if (currentVerificationStep === 2) {
        if (!validateStep2()) {
          return;
        }
        await mockVerificationService.uploadDocumentPhoto(documentPhotoFront!, 'front');
        setCurrentVerificationStep(3);
      } else if (currentVerificationStep === 3) {
        if (!validateStep3()) {
          return;
        }
        await mockVerificationService.uploadSelfieWithDocument(selfieWithDocument!);
        
        Alert.alert(
          "Verificação Enviada!",
          "Suas informações de verificação foram enviadas com sucesso e estão sob análise. Você será notificado quando sua conta for ativada.",
          [{ text: "OK", onPress: () => router.replace('/(provider)/dashboard' as any) }]
        );
      }
    } catch (error: any) {
      setGeneralError(error.message || "Ocorreu um erro na verificação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const isNextButtonEnabled = 
    (currentVerificationStep === 1 && validateStep1()) ||
    (currentVerificationStep === 2 && validateStep2()) ||
    (currentVerificationStep === 3 && validateStep3());

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <StatusBar barStyle="dark-content" backgroundColor={styles.scrollView.backgroundColor} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen options={{ headerShown: false }} />
        
        <Animated.View style={[styles.contentWrapper, { opacity: mainElementsOpacity, transform: [{translateY: mainElementsTranslateY}] }]}>
            <View style={styles.logoContainer}>
              <Image source={LOGO_IMAGE} style={styles.logo} />
            </View>
            
            <Text style={styles.welcomeSubtitle}>Verificação de Conta</Text>
            <Text style={styles.verificationInstructions}>
              Para ativar sua conta, precisamos verificar algumas informações de segurança.
            </Text>

            {/* Step 1: CPF for Background Check */}
            {currentVerificationStep === 1 && (
                <View>
                    <Text style={styles.stepHeader}>Passo 1 de 3: Antecedentes Criminais</Text>
                    <Text style={styles.stepDescription}>
                      Por favor, insira seu CPF para que possamos realizar uma consulta de antecedentes criminais.
                    </Text>
                    <View style={styles.inputWrapper}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="document-text-outline" size={20} color="#007BFF" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="CPF (apenas números)"
                            placeholderTextColor="#A0AEC0"
                            value={cpf} 
                            onChangeText={(text) => { setCpf(text); if (generalError) setGeneralError(null);}}
                            keyboardType="numeric"
                            maxLength={11}
                        />
                    </View>
                    <Text style={styles.consentText}>
                      Ao prosseguir, você concorda que a LimpeJá realize uma consulta de antecedentes criminais em seu nome para fins de segurança da plataforma.
                    </Text>
                </View>
            )}

            {/* Step 2: Document Photo Upload */}
            {currentVerificationStep === 2 && (
                <View>
                    <Text style={styles.stepHeader}>Passo 2 de 3: Foto do Documento</Text>
                    <Text style={styles.stepDescription}>
                      Envie uma foto nítida da frente do seu documento de identidade (RG ou CNH).
                    </Text>
                    <View style={styles.imageUploadWrapper}>
                        {documentPhotoFront ? (
                            <Image source={{ uri: documentPhotoFront }} style={styles.uploadedImage} />
                        ) : (
                            <Ionicons name="image-outline" size={80} color="#A0AEC0" />
                        )}
                        <View style={styles.imageUploadButtons}>
                            <TouchableOpacity style={styles.uploadButton} onPress={() => takePhoto(setDocumentPhotoFront)}>
                                <Ionicons name="camera-outline" size={24} color="#fff" />
                                <Text style={styles.uploadButtonText}>Tirar Foto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setDocumentPhotoFront)}>
                                <Ionicons name="folder-open-outline" size={24} color="#fff" />
                                <Text style={styles.uploadButtonText}>Galeria</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Opcional: Adicionar upload do verso se necessário */}
                </View>
            )}

            {/* Step 3: Selfie with Document Upload */}
            {currentVerificationStep === 3 && (
                <View>
                    <Text style={styles.stepHeader}>Passo 3 de 3: Selfie com Documento</Text>
                    <Text style={styles.stepDescription}>
                      Tire uma selfie clara segurando seu documento de identidade ao lado do rosto.
                    </Text>
                    <View style={styles.imageUploadWrapper}>
                        {selfieWithDocument ? (
                            <Image source={{ uri: selfieWithDocument }} style={styles.uploadedImage} />
                        ) : (
                            <Ionicons name="person-circle-outline" size={80} color="#A0AEC0" />
                        )}
                        <View style={styles.imageUploadButtons}>
                            <TouchableOpacity style={styles.uploadButton} onPress={() => takePhoto(setSelfieWithDocument)}>
                                <Ionicons name="camera-outline" size={24} color="#fff" />
                                <Text style={styles.uploadButtonText}>Tirar Foto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setSelfieWithDocument)}>
                                <Ionicons name="folder-open-outline" size={24} color="#fff" />
                                <Text style={styles.uploadButtonText}>Galeria</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            <AnimatedErrorMessage message={generalError} centered /> 

            {/* Renderização Condicional dos Botões */}
            {currentVerificationStep < 3 && ( 
                <Animated.View style={{transform: [{scale: nextButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity 
                        style={[styles.nextButton, (!isNextButtonEnabled || isLoading) && styles.buttonDisabled]} 
                        onPress={handleNextVerificationStep}
                        onPressIn={nextButtonAnims.onPressIn}
                        onPressOut={nextButtonAnims.onPressOut}
                        disabled={!isNextButtonEnabled || isLoading}
                    >
                        <Text style={styles.nextButtonText}>Próximo</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {currentVerificationStep === 3 && ( 
                <Animated.View style={{transform: [{scale: finalButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity 
                        style={[styles.signUpButton, (!isNextButtonEnabled || isLoading) && styles.buttonDisabled]} 
                        onPress={handleNextVerificationStep} 
                        onPressIn={finalButtonAnims.onPressIn}
                        onPressOut={finalButtonAnims.onPressOut}
                        disabled={!isNextButtonEnabled || isLoading}
                    >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.signUpButtonText}>Finalizar Verificação</Text> 
                    )}
                    </TouchableOpacity>
                </Animated.View>
            )}

            {currentVerificationStep > 1 && (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setCurrentVerificationStep(prev => prev - 1)}
                    disabled={isLoading}
                >
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ESTILOS COPIADOS E ADAPTADOS DE register-provider.tsx
const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F8FC', // Fundo branco ou muito claro como na imagem
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center', 
    paddingBottom: 20, 
  },
  contentWrapper: {
    paddingHorizontal: 35,
    paddingTop: Platform.OS === 'ios' ? 20 : 15, // Menos padding no topo
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: -60, // Menos margem
    marginTop: -90, // Mais espaço no topo para o logo
  },
  logo: { // Ajuste para o logo V-shape
    width: 200, // Ajustado para o tamanho da imagem
    height: 300, // Ajustado para o tamanho da imagem
    resizeMode: 'contain',
  },
  welcomeTitle: { // Mantido, mas não usado diretamente, welcomeSubtitle é mais adequado
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#1D2029', 
    textAlign: 'center',
    marginBottom: 6,    
  },
  welcomeSubtitle: { // Usado como título principal da tela de verificação
    fontSize: 22, // Um pouco maior para ser um título
    fontWeight: 'bold',
    color: '#1D2029', // Cor escura
    textAlign: 'center',
    marginBottom: 10, 
  },
  verificationInstructions: { // Novo estilo para as instruções abaixo do título
    fontSize: 15, 
    color: '#8A94A6', // Cinza médio
    textAlign: 'center',
    marginBottom: 30, 
  },
  stepHeader: { // Título para cada passo da verificação
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#007BFF', // Azul primário
    textAlign: 'center',
    marginBottom: 10,
  },
    consentText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
    lineHeight: 20,
  },
  stepDescription: { // Descrição para cada passo
    fontSize: 14, 
    color: '#2D3748', // Cinza escuro
    textAlign: 'center',
    marginBottom: 20, 
  },
  inputWrapper: { // Este é o contêiner branco pill-shape com sombra
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
    borderRadius: 28, 
    height: 50, // Altura do input
    marginBottom: 20, 
    shadowColor: 'rgba(100, 100, 150, 0.15)', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 1, 
    shadowRadius: 15,   
    elevation: 5,     
    paddingLeft: 5, 
    paddingRight: 15, 
  },
  iconCircle: { // Estilo para o círculo do ícone dentro do input
    width: 40,    
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EBF3FF', // Fundo azul claro para o círculo
    marginRight: 10, 
  },
  input: {
    flex: 1, 
    fontSize: 15, 
    color: '#2D3748',
    height: '100%', 
    paddingVertical: 0, 
  },
  eyeIconTouchable: { // Não usado nesta tela, mas mantido nos estilos para consistência
    paddingHorizontal: 15, 
    height: '100%',
    justifyContent: 'center',
  },
  inlineErrorMessage: { 
    color: '#E53E3E', 
    fontSize: 13, 
    textAlign: 'center',
    marginBottom: 15, 
    marginTop: -12, 
  },
  nextButton: { // Botão "Próximo"
    backgroundColor: '#40C0F0', 
    borderRadius: 28, 
    paddingVertical: 15, // Aumentado para corresponder ao novo signUpButton
    width: '80%',
    left: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,       
    marginBottom: 15, 
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8,    
    elevation: 8,       
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16, 
    fontWeight: '600',
  },
  signUpButton: { // Botão "Finalizar Verificação" (usando o estilo do "Sign Up")
    backgroundColor: '#007BFF', 
    borderRadius: 28, 
    paddingVertical: 15, 
    width: '80%', 
    left: 31, 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,      
    marginBottom: 25, 
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8,    
    elevation: 8,       
  },
  buttonDisabled: { 
    backgroundColor: '#A0CFFF',
    elevation: 0,
    shadowOpacity: 0,
  },
  signUpButtonText: { 
    color: '#FFFFFF',
    fontSize: 16, 
    fontWeight: '600',
  },
  backButton: { // Botão "Voltar"
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#007BFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imageUploadWrapper: { // Novo estilo para o contêiner de upload de imagem, simulando o inputWrapper
    flexDirection: 'column', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
    borderRadius: 28, 
    paddingVertical: 20, // Padding vertical para dar espaço
    marginBottom: 20, 
    shadowColor: 'rgba(100, 100, 150, 0.15)', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 1, 
    shadowRadius: 15,   
    elevation: 5,     
  },
  uploadedImage: {
    width: '90%', // Ocupa a maior parte da largura
    height: 180, // Altura fixa para a imagem
    borderRadius: 15,
    resizeMode: 'contain', // Garante que a imagem se ajuste sem cortar
    marginBottom: 15,
    borderWidth: 1, // Adiciona uma borda sutil
    borderColor: '#EBF3FF',
  },
  imageUploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%', // Botões ocupam a maior parte da largura
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40C0F0', // Cor do botão "Avançar"
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    flex: 1, // Para que os botões se dividam igualmente
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 5,
    fontWeight: '600',
  },
});