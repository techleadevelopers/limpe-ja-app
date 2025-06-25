// LimpeJaApp/app/(auth)/client-register.tsx
// Este arquivo não precisa de alterações diretas para a correção do AsyncStorage,
// pois a lógica de armazenamento do token está encapsulada no useAuth hook.

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
import { useAuth } from '../../hooks/useAuth'; // Importar useAuth
import { RegisterClientDto, CreateAddressDto } from '../types/backend/auth'; // Importar DTOs

// ATENÇÃO: Substitua pelo caminho correto do seu logo em formato "V" ou "FV" azul
const LOGO_IMAGE = require('../../assets/images/logo.png'); // << CONFIRMADO: Este é o caminho que você deseja

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

export default function ClientRegisterScreen() { // Renomeado de RegisterOptionsScreen
  const [currentStep, setCurrentStep] = useState(1); // 1: Personal Info, 2: Address Info

  const [username, setUsername] = useState(''); // Será mapeado para fullName
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [state, setState] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const router = useRouter();
  const { signUpClient } = useAuth(); // Usar o hook useAuth para acessar signUpClient

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
      setGeneralError('Por favor, preencha todos os campos de informações pessoais.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
        setGeneralError('Formato de e-mail inválido.');
        return false;
    }
    if (password.length < 6) {
        setGeneralError('A senha deve ter no mínimo 6 caracteres.');
        return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setGeneralError(null);
    if (!cep.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !state.trim()) {
      setGeneralError('Por favor, preencha todos os campos de endereço.');
      return false;
    }
    // Adicionar validações mais específicas para CEP, número, etc., se necessário
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setGeneralError(null); // Limpa erros anteriores
    }
  };

  const handleSignUp = async () => {
    if (!validateStep1() || !validateStep2()) { // Valida todas as etapas antes do registro final
        return;
    }
    setIsLoading(true);
    try {
      // Mapear os dados do formulário para o RegisterClientDto
      const registerData: RegisterClientDto = {
        email: email.trim().toLowerCase(),
        // CORREÇÃO AQUI: Alterado de 'passwordHash' para 'password'
        password: password,
        fullName: username.trim(),
        phone: '', // (opcional, se coletado),
        address: {
          cep: cep.trim(),
          street: street.trim(),
          number: number.trim(),
          neighborhood: neighborhood.trim(),
          city: '', // Cidade não está sendo coletada nesta tela, precisa ser adicionada ou inferida
          state: state.trim(),
          complement: '', // Complemento não está sendo coletado, precisa ser adicionado ou opcional
        } as CreateAddressDto, // Cast para garantir conformidade com CreateAddressDto
      };

      // AÇÃO 1.1: A correção do erro AsyncStorage e os console.logs
      // devem ser implementados DENTRO da função signUpClient
      // no arquivo '../../hooks/useAuth.ts' (ou onde signUpClient estiver definido).
      // O `signUpClient` é quem faz a chamada à API e processa a resposta,
      // incluindo o armazenamento do token.
      await signUpClient(registerData);

      // O AuthContext (via signUpClient) já lida com o redirecionamento e o alerta de sucesso.
      // Removido Alert.alert e router.replace daqui.
      console.log("[ClientRegisterScreen] Registro de cliente iniciado. AuthContext cuidará do resto.");

    } catch (error: any) {
      console.error("[ClientRegisterScreen] Erro ao registrar cliente:", error);
      setGeneralError(error.message || 'Falha no registro. Por favor, tente novamente.');
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

  const signUpButtonAnims = createButtonAnimations();
  const nextButtonAnims = createButtonAnimations(); // Animações para o botão "Avançar"

  const isSignUpButtonEnabled = currentStep === 2 && cep.trim() && street.trim() && number.trim() && neighborhood.trim() && state.trim();

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


            <Text style={styles.welcomeSubtitle}>Crie sua conta no LimpeJá !</Text>

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
                            placeholder="Nome de Usuário"
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

                    <AnimatedErrorMessage message={generalError} centered />

                    {/* Next Button */}
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

                    {/* NOTA: Cidade e Complemento não são coletados nesta tela, mas são necessários para CreateAddressDto. */}
                    {/* Você precisará adicionar campos para eles ou garantir que sejam opcionais no DTO do backend. */}
                    {/* Ex: <TextInput placeholder="Cidade" ... /> */}
                    {/* Ex: <TextInput placeholder="Complemento" ... /> */}

                    <AnimatedErrorMessage message={generalError} centered />

                    {/* Sign up Button */}
                    <Animated.View style={{transform: [{scale: signUpButtonAnims.scaleAnim}]}}>
                        <TouchableOpacity
                        style={[styles.signUpButton, (!isSignUpButtonEnabled || isLoading) && styles.buttonDisabled]}
                        onPress={handleSignUp}
                        onPressIn={signUpButtonAnims.onPressIn}
                        onPressOut={signUpButtonAnims.onPressOut}
                        disabled={!isSignUpButtonEnabled || isLoading}
                        >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.signUpButtonText}>Cadastrar</Text>
                        )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
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
    width: 50,   // Tamanho do círculo
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
    elevation: 8,        // Mantido para um efeito mais sofisticado no Android
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
