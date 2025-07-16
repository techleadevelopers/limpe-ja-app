// LimpeJaApp/app/(auth)/provider-register/index.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { Link, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// CORREÇÃO: Importar useAuth do caminho correto (contexts/AuthContext)
import { useAuth } from '../../../contexts/AuthContext';
import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext';
import { AUTH_ROUTES, PROVIDER_ROUTES } from '../../../constants/routes';
import { RegisterProviderDto } from '../../types/backend/auth'; // Importar RegisterProviderDto

const LOGO_IMAGE = require('../../../assets/images/logo2.png');

// CORREÇÃO: Importar AnimatedErrorMessage como exportação nomeada
import { AnimatedErrorMessage } from '../components/AnimatedErrorMessage';


const ErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return <Text style={styles.errorMessage}>{message}</Text>;
};

const mockFirebaseStorageApi = {
  uploadImage: async (uri: string) => {
    console.log("[mockFirebaseStorageApi] Iniciando upload simulado para:", uri);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockUrl = `https://firebasestorage.googleapis.com/v0/b/limpeja.appspot.com/o/avatars%2Fmock-avatar-${Date.now()}.jpg?alt=media`;
    console.log("[mockFirebaseStorageApi] Mock Firebase Storage URL gerada:", mockUrl);
    return mockUrl;
  },
};

// A interface ProviderRegistrationFormData foi removida, pois RegisterProviderDto é usado diretamente.

export default function RegisterProviderScreen() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Personal Data, 3: Address Info

  // Step 1: Informações Básicas (Email, Nome, Telefone)
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // será mapeado para fullName
  const [phone, setPhone] = useState('');

  // Step 2: Dados Pessoais (CPF, Data Nascimento, Senha)
  const [cpf, setCpf] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(''); // Data no formato DD/MM/AAAA
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: Endereço (CEP, Rua, Número, Bairro, Cidade, Estado)
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const { serviceDetails, setServiceDetails, submitRegistration } = useProviderRegistration();
  const [experiencia, setExperiencia] = useState('');
  const [servicosOferecidos, setServicosOferecidos] = useState('');
  const [estruturaPreco, setEstruturaPreco] = useState('');
  const [areasAtendimento, setAreasAtendimento] = useState('');
  const [anosExperiencia, setAnosExperiencia] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [experienciaError, setExperienciaError] = useState<string | null>(null);
  const [servicosOferecidosError, setServicosOferecidosError] = useState<string | null>(null);
  const [estruturaPrecoError, setEstruturaPrecoError] = useState<string | null>(null);
  const [areasAtendimentoError, setAreasAtendimentoError] = useState<string | null>(null);
  const [anosExperienciaError, setAnosExperienciaError] = useState<string | null>(null);
  const [pixKeyError, setPixKeyError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const router = useRouter();
  // CORREÇÃO: Destructuring de signUpProvider e setIsRegistrationInProgress
  const { signUpProvider, setIsRegistrationInProgress } = useAuth();

  const mainElementsOpacity = useRef(new Animated.Value(0)).current;
  const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;

  const headerAnimatedStyle = {
    opacity: headerAnim,
    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  const formAnimatedStyle = {
    opacity: formAnim,
    transform: [{ scale: formAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
  };

  const onPressInAvatar = () => {
    console.log("[Avatar] Animação de pressionar avatar: In.");
    Animated.spring(avatarScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutAvatar = () => {
    console.log("[Avatar] Animação de pressionar avatar: Out.");
    Animated.spring(avatarScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePickImage = async () => {
    console.log("[ImagePicker] Tentando escolher imagem...");
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão Necessária", "Você precisa permitir o acesso à galeria para escolher uma foto.");
      console.warn("[ImagePicker] Permissão da galeria negada.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      setAvatarUri(pickerResult.assets[0].uri);
      setAvatarError(null);
      setAvatarUrl(null);
      console.log("[ImagePicker] Imagem selecionada com URI:", pickerResult.assets[0].uri);
    } else {
      console.log("[ImagePicker] Seleção de imagem cancelada ou falhou.");
    }
  };

  // NOVO: Função para formatar a data para DD/MM/AAAA
  const formatDateForDisplay = (text: string) => {
    // Remove qualquer coisa que não seja número
    const cleanedText = text.replace(/\D/g, '');
    let formattedText = '';

    // Aplica a máscara DD/MM/AAAA
    if (cleanedText.length > 0) {
      formattedText += cleanedText.substring(0, 2);
      if (cleanedText.length > 2) {
        formattedText += '/' + cleanedText.substring(2, 4);
      }
      if (cleanedText.length > 4) {
        formattedText += '/' + cleanedText.substring(4, 8);
      }
    }
    return formattedText;
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
      Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
    ]).start();
  }, [mainElementsOpacity, mainElementsTranslateY]);

  useEffect(() => {
    if (currentStep === 3 && serviceDetails) {
      console.log("[ServiceDetailsScreen] Carregando serviceDetails do contexto:", serviceDetails);
      setExperiencia(serviceDetails.experiencia);
      setServicosOferecidos(serviceDetails.servicosOferecidos);
      setEstruturaPreco(serviceDetails.estruturaPreco);
      setAreasAtendimento(serviceDetails.areasAtendimento);
      setAnosExperiencia(String(serviceDetails.anosExperiencia));
      setPixKey(serviceDetails.pixKey || '');
      setAvatarUri(serviceDetails.avatarUri);
      setAvatarUrl(serviceDetails.avatarUrl || null);
    }
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => console.log(`[RegisterProviderScreen] Animações para Step ${currentStep} concluídas.`));
  }, [currentStep, serviceDetails, headerAnim, formAnim]);

  const pureValidateStep1 = useCallback(() => {
    console.log("[Validation] Validando Step 1 (Informações Básicas)...");
    if (!email.trim() || !username.trim() || !phone.trim()) {
      console.log("[Validation] Step 1 falhou: campos básicos vazios.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
        console.log("[Validation] Erro: Email inválido:", email.trim());
        return false;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
        console.log("[Validation] Erro: Telefone inválido:", cleanedPhone.length);
        return false;
    }

    console.log("[Validation] Step 1 válido.");
    return true;
  }, [email, username, phone]);

  const pureValidateStep2 = useCallback(() => {
    console.log("[Validation] Validando Step 2 (Dados Pessoais)...");
    if (!cpf.trim() || !dateOfBirth.trim() || !password.trim()) {
      console.log("[Validation] Step 2 falhou: campos pessoais vazios.");
      return false;
    }

    const cleanedCpf = cpf.replace(/\D/g, '');
    if (cleanedCpf.length !== 11) {
        console.log("[Validation] Erro: CPF inválido (length !== 11):", cleanedCpf.length);
        return false;
    }

    if (password.length < 6) {
        console.log("[Validation] Erro: Senha muito curta (< 6 caracteres).");
        return false;
    }

    // Validação simples de data de nascimento (formato DD/MM/AAAA)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dateOfBirth)) {
        console.log("[Validation] Erro: Data de nascimento em formato inválido:", dateOfBirth, "(esperado DD/MM/AAAA)");
        return false;
    }

    // Verificar se a data é válida
    const [day, month, year] = dateOfBirth.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day); // month é 0-indexed
    if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
        console.log("[Validation] Erro: Data de nascimento inexistente).");
        return false;
    }

    console.log("[Validation] Step 2 válido.");
    return true;
  }, [cpf, dateOfBirth, password]);

  const pureValidateStep3 = useCallback(() => {
    console.log("[Validation] Iniciando validação do formulário de detalhes do serviço (Step 3).");
    let isValid = true;

    if (!experiencia.trim()) { setExperienciaError('Sua experiência é obrigatória.'); isValid = false; console.log("[Validation] Erro: Experiência vazia."); } else { setExperienciaError(null); }
    if (!servicosOferecidos.trim()) { setServicosOferecidosError('Liste os serviços que você oferece.'); isValid = false; console.log("[Validation] Erro: Serviços Oferecidos vazios."); } else { setServicosOferecidosError(null); }
    if (!estruturaPreco.trim()) { setEstruturaPrecoError('Descreva sua estrutura de preços.'); isValid = false; console.log("[Validation] Erro: Estrutura de Preços vazia."); } else { setEstruturaPrecoError(null); }
    if (!areasAtendimento.trim()) { setAreasAtendimentoError('Informe suas áreas de atendimento.'); isValid = false; console.log("[Validation] Erro: Áreas de Atendimento vazias."); } else { setAreasAtendimentoError(null); }
    if (isNaN(Number(anosExperiencia)) || Number(anosExperiencia) < 0 || anosExperiencia.trim() === '') { setAnosExperienciaError('Anos de experiência inválidos.'); isValid = false; console.log("[Validation] Erro: Anos de Experiência inválidos."); } else { setAnosExperienciaError(null); }
    if (!pixKey.trim()) { setPixKeyError('A chave PIX é obrigatória para pagamentos.'); isValid = false; console.log("[Validation] Erro: Chave PIX vazia."); } else { setPixKeyError(null); }
    if (!avatarUri) { setAvatarError('Uma foto de perfil é obrigatória.'); isValid = false; console.log("[Validation] Erro: Avatar não selecionado."); } else { setAvatarError(null); }

    console.log("[Validation] Validação do formulário (Step 3) concluída. Válido:", isValid);
    return isValid;
  }, [experiencia, servicosOferecidos, estruturaPreco, areasAtendimento, anosExperiencia, pixKey, avatarUri]);

  // FUNÇÃO handleNext CORRIGIDA PARA NAVEGAR ENTRE ETAPAS E CHAMAR API NA HORA CERTA
  const handleNext = async () => {
    console.log(`[RegisterProvider] handleNext: Tentando avançar do Step ${currentStep}.`);
    setGeneralError(null); // Limpa erros gerais antes de validar

    if (currentStep === 1) {
      // APENAS valida Step 1 e avança para Step 2 (Endereço)
      if (pureValidateStep1()) {
        setCurrentStep(2);
        console.log("[RegisterProvider] handleNext: Avançando para o Step 2 (Endereço).");
      } else {
        setGeneralError('Por favor, preencha todos os campos pessoais corretamente.');
        console.warn("[RegisterProvider] handleNext: Falha ao avançar: Step 1 inválido.");
      }
    } else if (currentStep === 2) {
      // Valida Step 2 e, se OK, chama a API de registro inicial e avança para Step 3
      if (pureValidateStep2()) {
        setIsLoading(true); // Ativa o loading para a chamada inicial de registro
        try {
          // Converte a data de nascimento para o formato AAAA-MM-DD antes de enviar
          const [day, month, year] = dateOfBirth.split('/').map(Number);
          const formattedDateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const providerData: RegisterProviderDto = { // Explicitly type as RegisterProviderDto
            email: email.trim(),
            password: password.trim(),
            fullName: username.trim(),
            cpf: cpf.trim(),
            dateOfBirth: formattedDateOfBirth, // Usa a data formatada
            phone: phone.replace(/\D/g, ''), // Ensure phone is cleaned and included
            address: {
              cep: cep.trim(),
              street: street.trim(),
              number: number.trim(),
              neighborhood: neighborhood.trim(),
              city: city.trim(),
              state: state.trim(),
              complement: '', // Mantenha, se houver um campo para ele no seu formulário
            },
          };
          console.log("[RegisterProvider] handleNext (Step 2): Chamando signUpProvider do AuthContext.");
          await signUpProvider(providerData); // AQUI é onde a API é chamada!
          console.log("[RegisterProvider] handleNext (Step 2): signUpProvider do AuthContext retornou sucesso. Avançando para Step 3.");
          setCurrentStep(3); // Avança para a Etapa 3 (Detalhes do Serviço)
        } catch (error: any) {
          console.error("[RegisterProvider] handleNext (Step 2): Erro durante o registro inicial:", error.message);
          setGeneralError(error.message || 'Falha no registro inicial. Por favor, tente novamente.');
          // Não avança para a próxima etapa em caso de erro
        } finally {
          setIsLoading(false);
          console.log("[RegisterProvider] handleNext (Step 2): isLoading definido como false.");
        }
      } else {
        setGeneralError('Por favor, preencha todos os campos de endereço corretamente.');
        console.warn("[RegisterProvider] handleNext: Falha ao avançar: Step 2 inválido.");
      }
    } else if (currentStep === 3) {
      // Se estamos na Etapa 3, o botão "Finalizar Cadastro" chama handleServiceDetailsSubmit
      handleServiceDetailsSubmit();
    }
  };

  const handleServiceDetailsSubmit = async () => {
    console.log("[ServiceDetailsSubmit] Botão 'Finalizar Cadastro' pressionado na Etapa 3.");
    if (!pureValidateStep3()) {
      Alert.alert("Campos Inválidos", "Por favor, corrija os erros nos campos de detalhes do serviço antes de finalizar.");
      console.warn("[ServiceDetailsSubmit] Validação do formulário (Step 3) falhou. Abortando submissão.");
      return;
    }

    setIsSubmitting(true);
    console.log("[ServiceDetailsSubmit] isSubmitting definido como true.");
    try {
        let finalAvatarServerUrl: string | null = avatarUrl;
        if (avatarUri && !avatarUrl) {
            console.log("[ServiceDetailsSubmit] Avatar URI presente, mas URL do servidor ausente. Iniciando upload.");
            finalAvatarServerUrl = await mockFirebaseStorageApi.uploadImage(avatarUri);
            console.log("[ServiceDetailsSubmit] Upload de avatar concluído. URL:", finalAvatarServerUrl);
        } else if (avatarUrl) {
            console.log("[ServiceDetailsSubmit] Avatar URL já presente. Não é necessário fazer upload novamente.");
        } else {
            console.warn("[ServiceDetailsSubmit] Nenhuma URI ou URL de avatar para processar.");
        }

        const currentServiceDetails = {
            experiencia: experiencia.trim(),
            servicosOferecidos: servicosOferecidos.trim(),
            estruturaPreco: estruturaPreco.trim(),
            areasAtendimento: areasAtendimento.trim(),
            anosExperiencia: Number(anosExperiencia),
            pixKey: pixKey.trim(),
            avatarUri,
            avatarUrl: finalAvatarServerUrl,
        };
        console.log("[ServiceDetailsSubmit] Detalhes do serviço a serem salvos no contexto:", currentServiceDetails);

        setServiceDetails(currentServiceDetails);
        console.log("[ServiceDetailsSubmit] Detalhes do serviço salvos no contexto ProviderRegistrationContext.");

        console.log("[ServiceDetailsSubmit] Chamando submitRegistration do ProviderRegistrationContext.");
        await submitRegistration();
        console.log("[ServiceDetailsSubmit] submitRegistration concluído. Preparando redirecionamento para o Dashboard.");

        // Set the registration in progress flag to false after successful completion
        setIsRegistrationInProgress(false);
        Alert.alert(
          "Cadastro Finalizado!",
          "Seu perfil de provedor foi criado e está pronto!",
          [{ text: "OK", onPress: () => {
            console.log("[ServiceDetailsSubmit] Alerta 'OK' pressionado. Redirecionando para o Dashboard.");
            router.replace(PROVIDER_ROUTES.DASHBOARD as any);
          }}]
        );

    } catch (error: any) {
        console.error("[ServiceDetailsSubmit] Erro ao finalizar cadastro de detalhes do serviço:", error);
        Alert.alert('Falha no Cadastro', error.message || 'Não foi possível finalizar seu cadastro. Tente novamente mais tarde.');
    } finally {
        setIsSubmitting(false);
        console.log("[ServiceDetailsSubmit] isSubmitting definido como false. Processo de detalhes do serviço finalizado.");
    }
  };

  const createButtonAnimations = () => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
    return { scaleAnim, onPressIn, onPressOut };
  };

  const signUpButtonAnims = createButtonAnimations();
  const nextButtonAnims = createButtonAnimations();

  const isFinalSignUpButtonEnabled = currentStep === 3 && pureValidateStep3();
  const isNextButtonEnabledStep1 = currentStep === 1 && pureValidateStep1();
  const isNextButtonEnabledStep2 = currentStep === 2 && pureValidateStep2();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <StatusBar barStyle="dark-content" backgroundColor={styles.scrollView.backgroundColor} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled" >
        <Stack.Screen options={{ headerShown: false }} /> {/* Adicionado Stack.Screen aqui */}
        <Animated.View style={[styles.contentWrapper, { opacity: mainElementsOpacity, transform: [{translateY: mainElementsTranslateY}] }]}>
          <View style={styles.logoContainer}>
            <Image source={LOGO_IMAGE} style={styles.logo} />
          </View>

          <Text style={styles.welcomeSubtitle}>
      {currentStep === 1 ? 'Informações Básicas' :
       currentStep === 2 ? 'Dados Pessoais' :
       'Endereço'}
    </Text>

          {currentStep === 1 && (
            <View>
              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo / Nome de Usuário"
                  placeholderTextColor="#A0AEC0"
                  value={username}
                  onChangeText={(text) => { setUsername(text); if (generalError) setGeneralError(null);}}
                  autoCapitalize="words"
                  textContentType="name"
                  autoComplete="name"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#A0AEC0"
                  value={email}
                  onChangeText={(text) => { setEmail(text); if (generalError) setGeneralError(null);}}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="call-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Telefone"
                  placeholderTextColor="#A0AEC0"
                  value={phone}
                  onChangeText={(text) => { setPhone(text); if (generalError) setGeneralError(null);}}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>

              <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
            </View>
          )}

          {currentStep === 2 && (
            <View>
              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="card-outline" size={20} color="#00BCD4" />
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

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Data de Nascimento (DD/MM/AAAA)"
                  placeholderTextColor="#A0AEC0"
                  value={dateOfBirth}
                  onChangeText={(text) => { setDateOfBirth(formatDateForDisplay(text)); if (generalError) setGeneralError(null);}}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="lock-closed-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#A0AEC0"
                  value={password}
                  onChangeText={(text) => { setPassword(text); if (generalError) setGeneralError(null);}}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconTouchable}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#A0AEC0" />
                </TouchableOpacity>
              </View>

              <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />
            </View>
          )}

          {/* Este bloco de endereço agora faz parte do Step 3, conforme a estrutura original do seu código */}
          {currentStep === 3 && (
            <View>
              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="map-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="CEP"
                  placeholderTextColor="#A0AEC0"
                  value={cep}
                  onChangeText={(text) => { setCep(text); if (generalError) setGeneralError(null);}}
                  keyboardType="numeric"
                  maxLength={8}
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="navigate-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Rua"
                  placeholderTextColor="#A0AEC0"
                  value={street}
                  onChangeText={(text) => { setStreet(text); if (generalError) setGeneralError(null);}}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="home-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Número"
                  placeholderTextColor="#A0AEC0"
                  value={number}
                  onChangeText={(text) => { setNumber(text); if (generalError) setGeneralError(null);}}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="business-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Bairro"
                  placeholderTextColor="#A0AEC0"
                  value={neighborhood}
                  onChangeText={(text) => { setNeighborhood(text); if (generalError) setGeneralError(null);}}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Cidade"
                  placeholderTextColor="#A0AEC0"
                  value={city}
                  onChangeText={(text) => { setCity(text); if (generalError) setGeneralError(null);}}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location-outline" size={20} color="#00BCD4" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Estado (UF)"
                  placeholderTextColor="#A0AEC0"
                  value={state}
                  onChangeText={(text) => { setState(text); if (generalError) setGeneralError(null);}}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>

              <AnimatedErrorMessage message={generalError} isVisible={!!generalError} centered={true} />

              {/* Seção de Detalhes do Serviço, também dentro do Step 3 */}
              <Animated.View style={[styles.formSection, formAnimatedStyle]}>
                <Text style={styles.sectionTitle}>Serviços</Text>
                <Text style={styles.sectionSubtitle}>Descreva os serviços que você oferece e sua experiência profissional.</Text>

                <Text style={styles.label}>Foto de Perfil *</Text>
                <TouchableOpacity
                    onPress={handlePickImage}
                    onPressIn={onPressInAvatar}
                    onPressOut={onPressOutAvatar}
                    style={[styles.avatarPicker, { transform: [{ scale: avatarScaleAnim }] }]}
                >
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="camera-outline" size={40} color="#ADB5BD" />
                            <Text style={styles.avatarPlaceholderText}>Toque para escolher uma foto</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <ErrorMessage message={avatarError} />

                <Text style={styles.label}>Anos de Experiência *</Text>
                <View style={styles.inputWrapperServiceDetails}>
                    <Ionicons name="briefcase-outline" size={20} color="#00BCD4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputServiceDetails}
                        value={anosExperiencia}
                        onChangeText={setAnosExperiencia}
                        onBlur={() => setAnosExperienciaError(isNaN(Number(anosExperiencia)) || Number(anosExperiencia) < 0 || anosExperiencia.trim() === '' ? 'Anos de experiência inválidos.' : null)}
                        placeholder="Ex: 5"
                        keyboardType="numeric"
                        maxLength={2}
                        placeholderTextColor="#A0AEC0"
                    />
                </View>
                <ErrorMessage message={anosExperienciaError} />

                <Text style={styles.label}>Principais Serviços Oferecidos *</Text>
                <View style={styles.inputWrapperServiceDetails}>
                    <Ionicons name="construct-outline" size={20} color="#00BCD4" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputServiceDetails, styles.textAreaInputServiceDetails]}
                        value={servicosOferecidos}
                        onChangeText={setServicosOferecidos}
                        onBlur={() => setServicosOferecidosError(servicosOferecidos.trim() ? null : 'Liste os serviços que você oferece.')}
                        placeholder="Liste os serviços que você realiza (ex: Limpeza padrão, Limpeza pesada, Passar roupas, Limpeza de vidros, etc.)"
                        multiline
                        numberOfLines={3}
                        maxLength={300}
                        textAlignVertical="top"
                        placeholderTextColor="#A0AEC0"
                    />
                </View>
                <ErrorMessage message={servicosOferecidosError} />

                <Text style={styles.label}>Descreva sua Experiência Profissional *</Text>
                <View style={styles.inputWrapperServiceDetails}>
                    <MaterialCommunityIcons name="text-box-outline" size={20} color="#00BCD4" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputServiceDetails, styles.textAreaInputServiceDetails]}
                        value={experiencia}
                        onChangeText={setExperiencia}
                        onBlur={() => setExperienciaError(experiencia.trim() ? null : 'Sua experiência é obrigatória.')}
                        placeholder="Ex: Tenho 5 anos de experiência com limpeza residencial, sou detalhista e organizada..."
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                        textAlignVertical="top"
                        placeholderTextColor="#A0AEC0"
                    />
                </View>
                <ErrorMessage message={experienciaError} />

                <Text style={styles.label}>Sua Estrutura de Preços *</Text>
                <View style={styles.inputWrapperServiceDetails}>
                    <MaterialCommunityIcons name="currency-usd" size={20} color="#00BCD4" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputServiceDetails, styles.textAreaInputServiceDetails]}
                        value={estruturaPreco}
                        onChangeText={setEstruturaPreco}
                        onBlur={() => setEstruturaPrecoError(estruturaPreco.trim() ? null : 'Descreva sua estrutura de preços.')}
                        placeholder="Descreva como você cobra (ex: R$ XX por hora, preço fixo por tipo de limpeza, pacotes mensais, etc.)"
                        multiline
                        numberOfLines={3}
                        maxLength={300}
                        textAlignVertical="top"
                        placeholderTextColor="#A0AEC0"
                    />
                </View>
                <ErrorMessage message={estruturaPrecoError} />

                <Text style={styles.label}>Principais Áreas/Bairros de Atendimento *</Text>
                <View style={styles.inputWrapperServiceDetails}>
                    <Ionicons name="location-outline" size={20} color="#00BCD4" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.inputServiceDetails, styles.textAreaInputServiceDetails]}
                        value={areasAtendimento}
                        onChangeText={setAreasAtendimento}
                        onBlur={() => setAreasAtendimentoError(areasAtendimento.trim() ? null : 'Informe suas áreas de atendimento.')}
                        placeholder="Ex: Cambuí, Centro (Campinas); Sumaré (cidade inteira)"
                        multiline
                        numberOfLines={3}
                        maxLength={300}
                        textAlignVertical="top"
                        placeholderTextColor="#A0AEC0"
                    />
                </View>
                <ErrorMessage message={areasAtendimentoError} />

                <Text style={styles.label}>Chave PIX *</Text>
                <View style={styles.inputWrapperServiceDetails}>
                    <Ionicons name="key-outline" size={20} color="#00BCD4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.inputServiceDetails}
                        value={pixKey}
                        onChangeText={setPixKey}
                        onBlur={() => setPixKeyError(pixKey.trim() ? null : 'A chave PIX é obrigatória.')}
                        placeholder="Sua chave PIX (CPF, Telefone, Email, Aleatória)"
                        placeholderTextColor="#A0AEC0"
                    />
                </View>
                <ErrorMessage message={pixKeyError} />
              </Animated.View>
            </View>
          )}

          {currentStep === 1 && (
            <Animated.View style={{transform: [{scale: nextButtonAnims.scaleAnim}]}}>
              <TouchableOpacity
                style={[styles.nextButton, (isLoading || !isNextButtonEnabledStep1) && styles.buttonDisabled]}
                onPress={handleNext}
                onPressIn={nextButtonAnims.onPressIn}
                onPressOut={nextButtonAnims.onPressOut}
                disabled={isLoading || !isNextButtonEnabledStep1}
              >
                <Text style={styles.nextButtonText}>Avançar</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {currentStep === 2 && (
            <Animated.View style={{transform: [{scale: signUpButtonAnims.scaleAnim}]}}>
              <TouchableOpacity
                style={[styles.signUpButton, (isLoading || !isNextButtonEnabledStep2) && styles.buttonDisabled]}
                onPress={handleNext}
                onPressIn={signUpButtonAnims.onPressIn}
                onPressOut={signUpButtonAnims.onPressOut}
                disabled={isLoading || !isNextButtonEnabledStep2}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signUpButtonText}>Avançar para Detalhes</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {currentStep === 3 && (
            <Animated.View style={[styles.navigationButtons]}>
              <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => setCurrentStep(2)} disabled={isSubmitting}>
                  <Ionicons name="arrow-back-outline" size={20} color="#007AFF" />
                  <Text style={styles.navButtonTextBack}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.navButton, styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
                  onPress={handleServiceDetailsSubmit}
                  disabled={isSubmitting || !isFinalSignUpButtonEnabled}
              >
                  {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.navButtonTextNext}>Finalizar Cadastro</Text>}
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  contentWrapper: {
    paddingHorizontal: 35,
    paddingTop: Platform.OS === 'ios' ? 20 : 15,
  },
  logoContainer: {
    alignItems: 'center',

  },
  logo: {
    width: 230,
    height: 300,
    resizeMode: 'contain',
    bottom: 16,
    right: 15,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D2029',
    textAlign: 'center',
    marginBottom: 6,

  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#8A94A6',
    textAlign: 'center',
    marginBottom: 30,
    bottom: 140,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 36,
    marginBottom: 9,
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
    paddingLeft: 5,
    paddingRight: 15,
    bottom: 120,
    right: 5,
  },
  iconCircle: {
    width: 50,
    height: 30,
    right: 3,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    right: 18,
    height: '70%',
    paddingVertical: 0,
  },
  eyeIconTouchable: {
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
  nextButton: {
    backgroundColor: '#40C0F0',
    borderRadius: 28,
    paddingVertical: 7,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    bottom: 110,
    marginBottom: 15,
    shadowColor: '#00BCD4',
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
  signUpButton: {
    backgroundColor: '#00BCD4',
    borderRadius: 28,
    paddingVertical: 8,
    bottom: 80,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 25,
    shadowColor: '#00BCD4',
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
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1D2029',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#8A94A6',
    textAlign: 'center',
    marginBottom: 30,
  },
  formSection: {

  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 7,
    marginTop: 12,
  },
  inputIcon: {
    marginRight: 10,
    color: '#00BCD4',
  },
  inputWrapperServiceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 50,
    marginBottom: 20,
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
    paddingLeft: 15,
    paddingRight: 15,
  },
  inputServiceDetails: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    height: '100%',
    paddingVertical: 0,
  },
  textAreaInputServiceDetails: {
    height: 100,
    paddingTop: 15,
    minHeight: 100,
  },
  errorMessage: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 5,
  },
  avatarPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E9ECEF',
    borderColor: '#CED4DA',
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 5,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 10,
    minWidth: 140,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: { backgroundColor: '#E9ECEF', borderWidth: 1, borderColor: '#CED4DA' },
  nextButtonDisabled: { backgroundColor: '#A0CFFF', elevation: 0, shadowOpacity: 0 },
  navButtonTextBack: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 5 },
  navButtonTextNext: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', marginRight: 5 },
});