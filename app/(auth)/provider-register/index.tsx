// app/(auth)/register-provider.tsx
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
import { Link, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ATENÇÃO: Substitua pelo caminho correto do seu logo em formato "V" ou "FV" azul
// Assumindo que 'assets' está na raiz do projeto e 'app' é um subdiretório
const LOGO_IMAGE = require('../../../assets/images/logo.png'); // Ajustado o caminho relativo

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

// Define um tipo mais abrangente para as credenciais de registro, incluindo os novos campos de provedor
interface ProviderRegistrationCredentials {
  username: string;
  email: string;
  password: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  state: string;
  yearsExperience?: string; // Novo campo para provedor
  servicesOffered?: string; // Novo campo para provedor (string separada por vírgulas)
}

const mockAuthService = {
  // Atualizado o tipo de retorno para incluir 'status'
  registerUser: async (credentials: ProviderRegistrationCredentials): Promise<{ user: { id: string; email: string; name: string; status: string }; tokens: { accessToken: string; refreshToken: string; }; }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (credentials.email === 'admin@limpeja.com') {
      throw new Error("Email already registered.");
    }
    // Log para fins de depuração, mostrando todos os dados recebidos
    console.log("Registering provider with:", credentials);
    // SIMULAÇÃO: No backend real, o status inicial seria PENDING_DOCUMENTS_UPLOAD
    return { 
      user: { id: 'newprovider', email: credentials.email, name: credentials.username, status: 'PENDING_DOCUMENTS_UPLOAD' }, 
      tokens: { accessToken: 'mock_new_provider_token', refreshToken: 'mock_new_provider_token' } 
    };
  },
};

export default function RegisterProviderScreen() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Personal Info, 2: Address Info, 3: Service Info

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [state, setState] = useState('');

  // Novos estados para a Etapa 3 (Informações de Serviço)
  const [yearsExperience, setYearsExperience] = useState('');
  const [servicesOffered, setServicesOffered] = useState(''); // Armazenado como string separada por vírgulas

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const router = useRouter();

  const mainElementsOpacity = useRef(new Animated.Value(0)).current;
  const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
        Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
        Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
    ]).start();
  }, [mainElementsOpacity, mainElementsTranslateY]);

  const validateStep1 = () => {
    setGeneralError(null);
    if (!username.trim() || !email.trim() || !password.trim()) {
      setGeneralError('Please fill in all personal information fields.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        setGeneralError('Invalid email format.');
        return false;
    }
    if (password.length < 6) {
        setGeneralError('Password must be at least 6 characters long.');
        return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setGeneralError(null);
    if (!cep.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !state.trim()) {
      setGeneralError('Please fill in all address fields.');
      return false;
    }
    return true;
  };

  // Nova função de validação para a Etapa 3
  const validateStep3 = () => {
    setGeneralError(null);
    if (!yearsExperience.trim() || !servicesOffered.trim()) {
      setGeneralError('Please fill in all service information fields.');
      return false;
    }
    // Validação básica para anos de experiência (deve ser um número não negativo)
    if (isNaN(Number(yearsExperience.trim())) || Number(yearsExperience.trim()) < 0) {
        setGeneralError('Years of experience must be a non-negative number.');
        return false;
    }
    return true;
  };

  // Lógica de avanço de etapa unificada
  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        setGeneralError(null); // Limpa erros anteriores
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3); // Avança para a Etapa 3
        setGeneralError(null); // Limpa erros anteriores
      }
    }
  };

  // Função de registro final, chamada apenas na Etapa 3
  const handleFinalRegistration = async () => {
    // Valida todas as etapas antes do registro final
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
        return;
    }
    setIsLoading(true);
    try {
      // Não precisamos capturar a resposta aqui, pois o redirecionamento é fixo
      await mockAuthService.registerUser({
        username,
        email,
        password,
        cep,
        street,
        number,
        neighborhood,
        state,
        yearsExperience: yearsExperience.trim(), // Inclui dados da Etapa 3
        servicesOffered: servicesOffered.trim(), // Inclui dados da Etapa 3
      });
      
      // ALERTA: Mensagem para o usuário sobre a próxima etapa
      Alert.alert(
        "Cadastro Realizado!", 
        "Sua conta foi criada com sucesso! Agora, precisamos de algumas informações para verificar seu perfil e ativar sua conta. Você será redirecionado para a próxima etapa.",
        [{ text: "OK", onPress: () => {
            // REDIRECIONAMENTO PARA A NOVA TELA DE VERIFICAÇÃO
            // Usar asserção de tipo para a rota, conforme já estava
            router.replace('/(provider)/verify-account' as any); 
        }}]
      );

    } catch (error: any) {
      setGeneralError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createButtonAnimations = () => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
    return { scaleAnim, onPressIn, onPressOut };
  };

  const signUpButtonAnims = createButtonAnimations(); // Usado para o botão "Finalizar Cadastro"
  const nextButtonAnims = createButtonAnimations(); // Usado para o botão "Avançar"

  // A validação do botão "Sign up" agora depende da Etapa 3
  const isFinalSignUpButtonEnabled = currentStep === 3 && validateStep3();

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
            
            <Text style={styles.welcomeSubtitle}>Create your account</Text>
            
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
                <View>
                    {/* Username Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="person-outline" size={20} color="#007BFF" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#A0AEC0"
                            value={username} 
                            onChangeText={(text) => { setUsername(text); if (generalError) setGeneralError(null);}}
                            autoCapitalize="none"
                            textContentType="username" 
                            autoComplete="username" 
                        />
                    </View>

                    {/* Email Input */}
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

                    {/* Password Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="lock-closed-outline" size={20} color="#007BFF" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
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

                    <AnimatedErrorMessage message={generalError} centered /> 
                </View>
            )}

            {/* Step 2: Address Info */}
            {currentStep === 2 && (
                <View>
                    {/* CEP Input */}
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

                    {/* Rua Input */}
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

                    {/* Número Input */}
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

                    {/* Bairro Input */}
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

                    {/* Estado Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="location-outline" size={20} color="#007BFF" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Estado"
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

            {/* Step 3: Service Info (Nova Etapa) */}
            {currentStep === 3 && (
                <View>
                    {/* Anos de Experiência Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="briefcase-outline" size={20} color="#007BFF" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Anos de Experiência"
                            placeholderTextColor="#A0AEC0"
                            value={yearsExperience}
                            onChangeText={(text) => { setYearsExperience(text); if (generalError) setGeneralError(null); }}
                            keyboardType="numeric"
                            maxLength={2}
                        />
                    </View>

                    {/* Serviços Oferecidos Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="construct-outline" size={20} color="#007BFF" />
                        </View>
                        <TextInput
                            style={[styles.input, { height: 80, paddingTop: 15 }]} // Ajusta a altura para multiline
                            placeholder="Serviços Oferecidos (separados por vírgula)"
                            placeholderTextColor="#A0AEC0"
                            value={servicesOffered}
                            onChangeText={(text) => { setServicesOffered(text); if (generalError) setGeneralError(null); }}
                            autoCapitalize="sentences"
                            multiline // Permite múltiplas linhas
                            textAlignVertical="top" // Alinha o texto ao topo
                        />
                    </View>

                    <AnimatedErrorMessage message={generalError} centered />
                </View>
            )}

            {/* Renderização Condicional dos Botões */}
            {currentStep < 3 && ( // Botão "Avançar" visível nas Etapas 1 e 2
                <Animated.View style={{transform: [{scale: nextButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity 
                        style={[styles.nextButton, isLoading && styles.buttonDisabled]} 
                        onPress={handleNext}
                        onPressIn={nextButtonAnims.onPressIn}
                        onPressOut={nextButtonAnims.onPressOut}
                        disabled={isLoading}
                    >
                        <Text style={styles.nextButtonText}>Avançar</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {currentStep === 3 && ( // Botão "Finalizar Cadastro" visível apenas na Etapa 3
                <Animated.View style={{transform: [{scale: signUpButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity 
                        style={[styles.signUpButton, (!isFinalSignUpButtonEnabled || isLoading) && styles.buttonDisabled]} 
                        onPress={handleFinalRegistration} // Chama a função de registro final
                        onPressIn={signUpButtonAnims.onPressIn}
                        onPressOut={signUpButtonAnims.onPressOut}
                        disabled={!isFinalSignUpButtonEnabled || isLoading}
                    >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.signUpButtonText}>Finalizar Cadastro</Text> 
                    )}
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
    marginBottom: -60, // Menos margem
    marginTop: -90, // Mais espaço no topo para o logo
  },
  logo: { // Ajuste para o logo V-shape
    width: 200, // Ajustado para o tamanho da imagem
    height: 300, // Ajustado para o tamanho da imagem
    resizeMode: 'contain',
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
  },
  iconCircle: { // Estilo para o círculo do ícone dentro do input
    width: 50,    // Tamanho do círculo
    height: 50, // Tamanho do círculo
    right: 2, // Mantido conforme sua solicitação
    borderRadius: 40, // Metade da largura/altura para ser um círculo perfeito
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fundo branco para o círculo
    borderWidth: 1,
    borderColor: '#EBF3FF', // Borda azul clara como na imagem
    shadowColor: 'rgba(50, 50, 50, 0.7)', // Sombra cinza escura para o fundo (ajustei a opacidade para um valor válido e mais visível)
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 1, // Mantido conforme sua solicitação
    shadowRadius: 15, // Mantido para um efeito de brilho/sombra espalhado e robusto
    elevation: 8,       // Mantido para um efeito mais sofisticado no Android
    marginRight: 10, // Espaço entre o círculo do ícone e o TextInput
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
    fontSize: 13, // Ajustado
    textAlign: 'center',
    marginBottom: 15, 
    marginTop: -12, 
  },
  // Novo estilo para o botão "Avançar"
  nextButton: {
    backgroundColor: '#40C0F0', 
    borderRadius: 28, 
    paddingVertical: 10, 
    width: '80%',
    left: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,       
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
    paddingVertical: 10, // Ajustado
    width: '80%', // Ajustado
    left: 31, // Ajustado
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // Espaço após os inputs/erro, antes era 9      
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
});