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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Importa MaterialCommunityIcons
import * as ImagePicker from 'expo-image-picker'; // Importa ImagePicker
import { useAuth } from '../../../hooks/useAuth'; // Importe o useAuth
import { useProviderRegistration } from '../../../contexts/ProviderRegistrationContext'; // CORRIGIDO: Caminho para useProviderRegistration
import { AUTH_ROUTES, PROVIDER_ROUTES } from '../../../constants/routes'; // Importa as rotas para uso

// ATENÇÃO: Substitua pelo caminho correto do seu logo em formato "V" ou "FV" azul
// Assumindo que 'assets' está na raiz do projeto e 'app' é um subdiretório
const LOGO_IMAGE = require('../../../assets/images/logo2.png'); // Ajustado o caminho relativo

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

// Componente para exibir mensagens de erro inline (do service-details.tsx)
const ErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
    if (!message) return null;
    return <Text style={styles.errorMessage}>{message}</Text>;
};

// Simulação da API Firebase Storage (substituir pela implementação real)
const mockFirebaseStorageApi = {
    uploadImage: async (uri: string) => {
        console.log("[mockFirebaseStorageApi] Iniciando upload simulado para:", uri);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simula o tempo de upload
        const mockUrl = `https://firebasestorage.googleapis.com/v0/b/limpeja.appspot.com/o/avatars%2Fmock-avatar-${Date.now()}.jpg?alt=media`;
        console.log("[mockFirebaseStorageApi] Mock Firebase Storage URL gerada:", mockUrl);
        return mockUrl; // Retorna a URL da imagem mockada
    },
};


// Define um tipo mais abrangente para os dados do formulário
// (Não é o DTO final, apenas o que o formulário coleta)
interface ProviderRegistrationFormData {
  username: string;
  email: string;
  password: string;
  cpf: string; // NOVO CAMPO
  dateOfBirth: string; // NOVO CAMPO (formatoInvariantCulture-MM-DD)
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string; // NOVO CAMPO
  state: string;
}

export default function RegisterProviderScreen() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Personal Info, 2: Address Info, 3: Service Details

  // Estados da Etapa 1: Informações Pessoais
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados da Etapa 2: Informações de Endereço
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Estados da Etapa 3: Detalhes do Serviço (vindos de service-details.tsx)
  const { serviceDetails, setServiceDetails, submitRegistration } = useProviderRegistration();
  const [experiencia, setExperiencia] = useState(''); // Mapeia para Provider.bio
  const [servicosOferecidos, setServicosOferecidos] = useState(''); // String para ProviderService
  const [estruturaPreco, setEstruturaPreco] = useState(''); // Texto livre
  const [areasAtendimento, setAreasAtendimento] = useState(''); // Texto livre
  const [anosExperiencia, setAnosExperiencia] = useState(''); // Mapeia para Provider.yearsOfExperience
  const [pixKey, setPixKey] = useState(''); // Mapeia para Provider.pixKey
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Erros da Etapa 3
  const [experienciaError, setExperienciaError] = useState<string | null>(null);
  const [servicosOferecidosError, setServicosOferecidosError] = useState<string | null>(null);
  const [estruturaPrecoError, setEstruturaPrecoError] = useState<string | null>(null);
  const [areasAtendimentoError, setAreasAtendimentoError] = useState<string | null>(null);
  const [anosExperienciaError, setAnosExperienciaError] = useState<string | null>(null);
  const [pixKeyError, setPixKeyError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);


  const [isLoading, setIsLoading] = useState(false); // Usado para Etapas 1 e 2
  const [isSubmitting, setIsSubmitting] = useState(false); // Usado para Etapa 3
  const [generalError, setGeneralError] = useState<string | null>(null); // Erro geral para Etapas 1 e 2

  const router = useRouter();
  const { signUpProvider, setIsRegistrationInProgress } = useAuth();

  const mainElementsOpacity = useRef(new Animated.Value(0)).current;
  const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

  // Animações para os elementos da tela (do service-details.tsx) - MOVIDO PARA O ESCOPO PRINCIPAL
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;

  // Estilos animados para o cabeçalho e o formulário (MOVIDO PARA O ESCOPO PRINCIPAL)
  const headerAnimatedStyle = {
      opacity: headerAnim,
      transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  const formAnimatedStyle = {
      opacity: formAnim,
      transform: [{ scale: formAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
  };

  // Funções para animação do avatar - MOVIDO PARA O ESCOPO PRINCIPAL
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

  // Função para lidar com a seleção de imagem - MOVIDO PARA O ESCOPO PRINCIPAL
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
        setAvatarUrl(null); // Limpa URL do servidor para forçar re-upload se necessário
        console.log("[ImagePicker] Imagem selecionada com URI:", pickerResult.assets[0].uri);
    } else {
        console.log("[ImagePicker] Seleção de imagem cancelada ou falhou.");
    }
  };


  useEffect(() => {
    Animated.parallel([
      Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
      Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
    ]).start();
  }, [mainElementsOpacity, mainElementsTranslateY]);

  // useEffect para carregar serviceDetails (do service-details.tsx)
  useEffect(() => {
    if (currentStep === 3 && serviceDetails) { // Só carrega se estiver na Etapa 3
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
    // Animações para a etapa atual
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


  // Funções de validação "puras" (não alteram o estado de erro, apenas retornam boolean)
  const pureValidateStep1 = useCallback(() => {
    console.log("[Validation] Validando Step 1 (Informações Pessoais)...");
    if (!username.trim() || !email.trim() || !password.trim() || !cpf.trim() || !dateOfBirth.trim()) {
      console.log("[Validation] Step 1 falhou: campos obrigatórios vazios.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log("[Validation] Step 1 falhou: email inválido.");
      return false;
    }
    if (password.length < 6) {
      console.log("[Validation] Step 1 falhou: senha muito curta (mínimo 6 caracteres).");
      return false;
    }
    // Validação básica de CPF (11 dígitos numéricos)
    if (cpf.trim().length !== 11 || !/^\d+$/.test(cpf.trim())) {
        console.log("[Validation] Step 1 falhou: CPF inválido (deve ter 11 dígitos numéricos).");
        return false;
    }
    // Validação básica de Data de Nascimento (formatoInvariantCulture-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth.trim())) {
        console.log("[Validation] Step 1 falhou: Data de Nascimento inválida (esperadoInvariantCulture-MM-DD).");
        return false;
    }
    console.log("[Validation] Step 1 válido.");
    return true;
  }, [username, email, password, cpf, dateOfBirth]);

  const pureValidateStep2 = useCallback(() => {
    console.log("[Validation] Validando Step 2 (Informações de Endereço)...");
    if (!cep.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
      console.log("[Validation] Step 2 falhou: campos de endereço vazios.");
      return false;
    }
    console.log("[Validation] Step 2 válido.");
    return true;
  }, [cep, street, number, neighborhood, city, state]);

  // Validação para a Etapa 3 (Service Details) - Copiado de service-details.tsx
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


  // Lógica de avanço de etapa unificada
  const handleNext = async () => { // Marcado como async para lidar com chamadas de API
    console.log(`[RegisterProvider] handleNext: Tentando avançar do Step ${currentStep}.`);
    setGeneralError(null); // Limpa erros gerais antes de validar

    if (currentStep === 1) {
      if (pureValidateStep1()) {
        setCurrentStep(2);
        console.log("[RegisterProvider] handleNext: Avançando para o Step 2.");
      } else {
        setGeneralError('Por favor, preencha todos os campos pessoais corretamente.');
        console.warn("[RegisterProvider] handleNext: Falha ao avançar: Step 1 inválido.");
      }
    } else if (currentStep === 2) {
      if (pureValidateStep2()) {
        // Antes de ir para a Etapa 3, faz o registro inicial do usuário com AuthContext
        setIsLoading(true); // Usando isLoading para a chamada inicial de registro
        try {
          const providerData = {
            email: email.trim(),
            password: password.trim(),
            fullName: username.trim(),
            cpf: cpf.trim(),
            dateOfBirth: dateOfBirth.trim(),
            address: {
              cep: cep.trim(),
              street: street.trim(),
              number: number.trim(),
              neighborhood: neighborhood.trim(),
              city: city.trim(),
              state: state.trim(),
              complement: '',
            },
          };
          console.log("[RegisterProvider] handleNext (Step 2): Chamando signUpProvider do AuthContext.");
          await signUpProvider(providerData as any);
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


  // Função de submissão dos detalhes do serviço (baseado no handleFinalRegister de service-details.tsx)
  const handleServiceDetailsSubmit = async () => {
    console.log("[ServiceDetailsSubmit] Botão 'Finalizar Cadastro' pressionado na Etapa 3.");
    if (!pureValidateStep3()) { // Usa a validação específica da Etapa 3
      Alert.alert("Campos Inválidos", "Por favor, corrija os erros nos campos de detalhes do serviço antes de finalizar.");
      console.warn("[ServiceDetailsSubmit] Validação do formulário (Step 3) falhou. Abortando submissão.");
      return;
    }

    setIsSubmitting(true); // Usa isSubmitting para esta etapa
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

        setServiceDetails(currentServiceDetails); // Salva no contexto de registro
        console.log("[ServiceDetailsSubmit] Detalhes do serviço salvos no contexto ProviderRegistrationContext.");

        console.log("[ServiceDetailsSubmit] Chamando submitRegistration do ProviderRegistrationContext.");
        await submitRegistration(); // Finaliza o registro com os detalhes do serviço
        console.log("[ServiceDetailsSubmit] submitRegistration concluído. Preparando redirecionamento para o Dashboard.");

        // Após o sucesso, resetar a flag de registro em andamento e redirecionar
        setIsRegistrationInProgress(false); // Reseta a flag AGORA que o fluxo está completo
        Alert.alert(
          "Cadastro Finalizado!",
          "Seu perfil de provedor foi criado e está pronto!",
          [{ text: "OK", onPress: () => {
            console.log("[ServiceDetailsSubmit] Alerta 'OK' pressionado. Redirecionando para o Dashboard.");
            router.replace(PROVIDER_ROUTES.DASHBOARD as any); // Redireciona para o dashboard
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

  const signUpButtonAnims = createButtonAnimations(); // Usado para o botão "Finalizar Cadastro" na Etapa 2/3
  const nextButtonAnims = createButtonAnimations(); // Usado para o botão "Avançar" na Etapa 1


  // A validação do botão "Finalizar Cadastro" agora depende da Etapa 3
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
        {/* Stack.Screen options={{ headerShown: false }} é agora gerenciado no _layout.tsx do grupo */}

        <Animated.View style={[styles.contentWrapper, { opacity: mainElementsOpacity, transform: [{translateY: mainElementsTranslateY}] }]}>
          <View style={styles.logoContainer}>
            <Image source={LOGO_IMAGE} style={styles.logo} />
          </View>

          <Text style={styles.welcomeSubtitle}>Crie sua conta</Text>

          {/* Renderização condicional das etapas */}

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <View>
              {/* Campos de Input da Etapa 1 */}
              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={20} color="#007BFF" />
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
                  <Ionicons name="mail-outline" size={20} color="#007BFF" />
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
                  <Ionicons name="lock-closed-outline" size={20} color="#007BFF" />
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

              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="card-outline" size={20} color="#007BFF" />
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
                  <Ionicons name="calendar-outline" size={20} color="#007BFF" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Data de Nascimento (AAAA-MM-DD)"
                  placeholderTextColor="#A0AEC0"
                  value={dateOfBirth}
                  onChangeText={(text) => { setDateOfBirth(text); if (generalError) setGeneralError(null);}}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <AnimatedErrorMessage message={generalError} centered />
            </View>
          )}

          {/* Step 2: Address Info */}
          {currentStep === 2 && (
            <View>
              {/* Campos de Input da Etapa 2 */}
              <View style={styles.inputWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="map-outline" size={20} color="#007BFF" />
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
                  <Ionicons name="navigate-outline" size={20} color="#007BFF" />
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
                  <Ionicons name="home-outline" size={20} color="#007BFF" />
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
                  <Ionicons name="business-outline" size={20} color="#007BFF" />
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
                  <Ionicons name="location-outline" size={20} color="#007BFF" /> {/* Alterado de 'city-outline' para 'location-outline' */}
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
                  <Ionicons name="location-outline" size={20} color="#007BFF" />
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

              <AnimatedErrorMessage message={generalError} centered />
            </View>
          )}

          {/* Step 3: Service Details (Integrado de service-details.tsx) */}
          {currentStep === 3 && (
            <Animated.View style={[styles.formSection, formAnimatedStyle]}> {/* 'formAnimatedStyle' está agora no escopo */}
              {/* Título e subtítulo da Etapa 3 - Modificado */}
              <Text style={styles.sectionTitle}>Serviços</Text> {/* Título alterado para "Serviços" */}
              <Text style={styles.sectionSubtitle}>Descreva os serviços que você oferece e sua experiência profissional.</Text> {/* Novo subtítulo */}

              {/* Foto de Perfil */}
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

              {/* Anos de Experiência */}
              <Text style={styles.label}>Anos de Experiência *</Text>
              <View style={styles.inputWrapperServiceDetails}> {/* Novo estilo para inputWrapper na Etapa 3 */}
                  <Ionicons name="briefcase-outline" size={20} color="#007BFF" style={styles.inputIcon} />
                  <TextInput
                      style={styles.inputServiceDetails} /* Novo estilo para input na Etapa 3 */
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

              {/* Principais Serviços Oferecidos */}
              <Text style={styles.label}>Principais Serviços Oferecidos *</Text>
              <View style={styles.inputWrapperServiceDetails}> 
                  <Ionicons name="construct-outline" size={20} color="#007BFF" style={styles.inputIcon} />
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

              {/* Descrição da Experiência Profissional */}
              <Text style={styles.label}>Descreva sua Experiência Profissional *</Text>
              <View style={styles.inputWrapperServiceDetails}> 
                  <MaterialCommunityIcons name="text-box-outline" size={20} color="#007BFF" style={styles.inputIcon} />
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

              {/* Estrutura de Preços */}
              <Text style={styles.label}>Sua Estrutura de Preços *</Text>
              <View style={styles.inputWrapperServiceDetails}> 
                  <MaterialCommunityIcons name="currency-usd" size={20} color="#007BFF" style={styles.inputIcon} />
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

              {/* Áreas de Atendimento */}
              <Text style={styles.label}>Principais Áreas/Bairros de Atendimento *</Text>
              <View style={styles.inputWrapperServiceDetails}> 
                  <Ionicons name="location-outline" size={20} color="#007BFF" style={styles.inputIcon} />
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

              {/* Chave PIX */}
              <Text style={styles.label}>Chave PIX *</Text>
              <View style={styles.inputWrapperServiceDetails}> 
                  <Ionicons name="key-outline" size={20} color="#007BFF" style={styles.inputIcon} />
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
          )}

          {/* Botões de Navegação */}
          {currentStep === 1 && ( // Botão "Avançar" visível apenas na Etapa 1
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

          {currentStep === 2 && ( // Botão "Finalizar Cadastro" (agora "Avançar para Detalhes") visível na Etapa 2
            <Animated.View style={{transform: [{scale: signUpButtonAnims.scaleAnim}]}}>
              <TouchableOpacity
                style={[styles.signUpButton, (isLoading || !isNextButtonEnabledStep2) && styles.buttonDisabled]}
                onPress={handleNext} // Chama handleNext que agora avança para Step 3
                onPressIn={signUpButtonAnims.onPressIn}
                onPressOut={signUpButtonAnims.onPressOut}
                disabled={isLoading || !isNextButtonEnabledStep2}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signUpButtonText}>Avançar para Detalhes</Text> // Texto atualizado
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {currentStep === 3 && ( // Botão "Finalizar Cadastro" na Etapa 3
            <Animated.View style={[styles.navigationButtons]}> {/* Usar styles.navigationButtons para flexbox */}
              <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => setCurrentStep(2)} disabled={isSubmitting}>
                  <Ionicons name="arrow-back-outline" size={20} color="#007AFF" />
                  <Text style={styles.navButtonTextBack}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.navButton, styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
                  onPress={handleServiceDetailsSubmit} // Chama a nova função de submissão
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

// ESTILOS REFEITOS PARA CORRESPONDER À IMAGEM FORNECIDA
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
    
  },
  logo: { // Ajuste para o logo V-shape
    width: 290, // Ajustado para o tamanho da imagem
    height: 300, // Ajustado para o tamanho da imagem
    resizeMode: 'contain',
    bottom: 20, // Espaço entre o logo e o título
    right: 15, // Ajustado para centralizar o logo
  },
  welcomeTitle: {
    fontSize: 24, // Ajustado
    fontWeight: 'bold',
    color: '#1D2029', // Cor escura, quase preta
    textAlign: 'center',
    marginBottom: 6,
    
  },
  welcomeSubtitle: {
    fontSize: 15, // Ajustado
    color: '#8A94A6', // Cinza médio
    textAlign: 'center',
    marginBottom: 30,
    bottom: 138, // Ajustado para centralizar o título
  },
  inputWrapper: { // Este é o contêiner branco pill-shape com sombra
    flexDirection: 'row', // Alinha os filhos horizontalmente (círculo do ícone e input)
    alignItems: 'center', // Centraliza verticalmente os filhos
    backgroundColor: '#FFFFFF',
    borderRadius: 28, // Totalmente arredondado
    height: 35, // Altura do input (ajustado para 50px)
    marginBottom: 20, // Espaçamento entre os inputs
    shadowColor: 'rgba(100, 100, 150, 0.15)', // Sombra mais suave
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
    paddingLeft: 5, // Pequeno padding à esquerda para o círculo do ícone
    paddingRight: 15, // Padding à direita para o TextInput e o olho
    bottom: 100, // Espaço entre o logo e o título
  },
  iconCircle: {
    width: 50,
    height: 50,
    right: 2,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 24.8, // Borda muito grossa que pode interferir na percepção da sombra
    borderColor: 'rgba(178, 139, 202, 0.19)',
    // Estilos de sombra para iOS
    shadowColor: 'rgba(178, 139, 202, 0.81)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 15,
    // Elevação para Android (pode ser obscurecida pela borda grossa)
    elevation: 8, // Considere aumentar, mas revise o borderWidth
    marginRight: 10,
  },
  input: {
    flex: 1, // Faz com que o TextInput ocupe o espaço restante
    fontSize: 15, // Ajustado
    color: '#2D3748',
    right: 8,
    height: '70%', // Garante que o input preencha a altura do wrapper
    paddingVertical: 0, // Remove padding vertical padrão que pode afetar a altura
  },
  eyeIconTouchable: {
    paddingHorizontal: 15, // Aumenta área de toque e dá espaço da borda
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
  // Novo estilo para o botão "Avançar"
  nextButton: {
    backgroundColor: '#40C0F0',
    borderRadius: 28,
    paddingVertical: 10,
    width: '100%', // Alterado para 100% para alinhamento e consistência
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    bottom: 0, // Ajustado para remover o bottom fixo
    marginBottom: 15, // Espaço entre o botão "Avançar" e o "Sign up" (se fosse visível)
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
  signUpButton: { // Renomeado de signInButton
    backgroundColor: '#007BFF',
    borderRadius: 28,
    paddingVertical: 10,
    width: '100%', // Alterado para 100% para alinhamento e consistência
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
  signUpButtonText: { // Renomeado de signInButtonText
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Novos estilos para as seções de detalhes do serviço (vindo de service-details.tsx)
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
    // Estilos para animação da seção de formulário (mantido para compatibilidade)
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 7,
    marginTop: 12,
  },
  inputIcon: { // Estilo para ícones dentro do inputWrapper
      marginRight: 10,
      color: '#007BFF', // Cor azul para os ícones
  },
  // Novos estilos para os inputs da Etapa 3 (service-details) para replicar o look da Etapa 2
  inputWrapperServiceDetails: { // Replicando o estilo do inputWrapper original
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 50, // Aumentado para melhor toque e visual
    marginBottom: 20,
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
    paddingLeft: 15, // Aumentado para consistência
    paddingRight: 15,
  },
  inputServiceDetails: { // Replicando o estilo do input original
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    height: '100%',
    paddingVertical: 0,
  },
  textAreaInputServiceDetails: { // Replicando o estilo do textAreaInput original
      height: 100, // Ajustado para ter mais espaço vertical
      paddingTop: 15,
      minHeight: 100,
  },
  errorMessage: { // Erro específico do ServiceDetailsScreen (para campos de lá)
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
  navigationButtons: { // Usado para os botões "Voltar" e "Finalizar Cadastro" na Etapa 3
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
  // nextButton já existe, usado para a Etapa 1 e agora para a Etapa 3 (com texto diferente)
  nextButtonDisabled: { backgroundColor: '#A0CFFF', elevation: 0, shadowOpacity: 0 },
  navButtonTextBack: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 5 },
  navButtonTextNext: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', marginRight: 5 },
});