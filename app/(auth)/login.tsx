// LimpeJaApp/app/(auth)/login.tsx
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
import { useAuth } from '../../hooks/useAuth'; // Ajuste o caminho se 'hooks' estiver na raiz
import { Ionicons } from '@expo/vector-icons';

// ATENÇÃO: Substitua pelo caminho correto do seu logo em formato "V" ou "FV" azul
const LOGO_IMAGE = require('/assets/images/icon.png'); // << SUBSTITUA PELO SEU LOGO CORRETO

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

const mockAuthService = {
  loginUser: async (credentials: { email: string; password: string }): Promise<{ user: { id: string; email: string; role: 'client' | 'provider'; name: string; }; tokens: { accessToken: string; refreshToken: string; }; }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Usaremos 'username' como email para a lógica, mas o placeholder é 'Username'
    if (credentials.email === 'cliente@limpeja.com' && credentials.password === 'cliente123') {
      return { user: { id: 'user1', email: 'cliente@limpeja.com', role: 'client', name: 'Cliente Teste' }, tokens: { accessToken: 'mock_client_token', refreshToken: 'mock_refresh_client_token' } };
    } else if (credentials.email === 'pro@limpeja.com' && credentials.password === 'pro123') {
      return { user: { id: 'user2', email: 'pro@limpeja.com', role: 'provider', name: 'Profissional Teste' }, tokens: { accessToken: 'mock_provider_token', refreshToken: 'mock_refresh_provider_token' } };
    }
    throw new Error("Invalid credentials. Please check your username and password.");
  },
};

export default function LoginScreen() {
  const [username, setUsername] = useState(''); // Visualmente "Username", mas usado como email na lógica
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { signIn, isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const router = useRouter();

  const mainElementsOpacity = useRef(new Animated.Value(0)).current;
  const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      const targetRoute = user?.role === 'client' ? '/(client)/explore' : user?.role === 'provider' ? '/(provider)/dashboard' : '/';
      router.replace(targetRoute);
    } else if (!isAuthenticated) {
        Animated.parallel([
            Animated.timing(mainElementsOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
            Animated.timing(mainElementsTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
        ]).start();
    }
  }, [isAuthenticated, authIsLoading, user, router, mainElementsOpacity, mainElementsTranslateY]);

  const validateInputs = () => {
    setGeneralError(null);
    if (!username.trim() || !password.trim()) {
      setGeneralError('Por favor, insira seu nome de usuário e senha.'); // Translated
      return false;
    }
    // A validação de e-mail pode ser mantida se "Username" for, de fato, um e-mail
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(username.trim())) {
    //     setGeneralError('Invalid email format for username field.');
    //     return false;
    // }
    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    setIsLoading(true);
    try {
      // Passando 'username' como 'email' para o mockAuthService
      const response = await mockAuthService.loginUser({ email: username.trim().toLowerCase(), password });
      await signIn(response.user, response.tokens);
    } catch (error: any) {
      setGeneralError(error.message || 'Falha no login. Por favor, tente novamente.'); // Translated
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mantendo para preenchimento rápido, mas agora eles usam 'username' para o campo de email
  const quickLoginClient = () => { setUsername('cliente@limpeja.com'); setPassword('cliente123'); setGeneralError(null); };
  const quickLoginProvider = () => { setUsername('pro@limpeja.com'); setPassword('pro123'); setGeneralError(null); };

  const createButtonAnimations = () => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
    const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
    return { scaleAnim, onPressIn, onPressOut };
  };

  const signInButtonAnims = createButtonAnimations();
  const googleButtonAnims = createButtonAnimations();
  const facebookButtonAnims = createButtonAnimations();
  const twitterButtonAnims = createButtonAnimations();

  if (authIsLoading || (!authIsLoading && isAuthenticated)) {
    return (
      <View style={styles.fullScreenLoadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.fullScreenLoadingText}>Carregando sua sessão...</Text> {/* Translated */}
      </View>
    );
  }

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
            
            <Text style={styles.welcomeTitle}>Bem-vindo de volta!</Text> {/* Translated */}
            <Text style={styles.welcomeSubtitle}>Faça login em sua conta</Text> {/* Translated */}
            
            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={20} color="#00BCD4" /> {/* Cor do ícone CIANO */}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nome de usuário" // Translated
                placeholderTextColor="#A0AEC0"
                value={username} 
                onChangeText={(text) => { setUsername(text); if (generalError) setGeneralError(null);}}
                keyboardType="email-address" 
                autoCapitalize="none"
                textContentType="username" 
                autoComplete="username" 
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.iconCircle}>
                 <Ionicons name="lock-closed-outline" size={20} color="#00BCD4" /> {/* Cor do ícone CIANO */}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Senha" // Translated
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

            <Animated.View style={{transform: [{scale: signInButtonAnims.scaleAnim}]}}>
                <TouchableOpacity 
                style={[styles.signInButton, isLoading && styles.buttonDisabled]} 
                onPress={handleLogin}
                onPressIn={signInButtonAnims.onPressIn}
                onPressOut={signInButtonAnims.onPressOut}
                disabled={isLoading}
                >
                {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.signInButtonText}>Entrar</Text> // Translated
                )}
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.orSeparatorContainer}>
              <View style={styles.dashedLine} />
              <Text style={styles.orText}>Ou faça login com</Text> {/* Translated */}
              <View style={styles.dashedLine} />
            </View>

            <View style={styles.socialLoginContainer}>
                <Animated.View style={{transform: [{scale: googleButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity 
                        style={styles.socialButton}
                        onPress={() => Alert.alert("Login Social", "Login com Google (não implementado).")} // Translated
                        onPressIn={googleButtonAnims.onPressIn}
                        onPressOut={googleButtonAnims.onPressOut}
                    >
                        <Ionicons name="logo-google" size={22} color="#DB4437" />
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{transform: [{scale: facebookButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity 
                        style={styles.socialButton}
                        onPress={() => Alert.alert("Login Social", "Login com Facebook (não implementado).")} // Translated
                        onPressIn={facebookButtonAnims.onPressIn}
                        onPressOut={facebookButtonAnims.onPressOut}
                    >
                        <Ionicons name="logo-facebook" size={22} color="#4267B2" />
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{transform: [{scale: twitterButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity 
                        style={styles.socialButton}
                        onPress={() => Alert.alert("Login Social", "Login com Twitter (não implementado).")} // Translated
                        onPressIn={twitterButtonAnims.onPressIn}
                        onPressOut={twitterButtonAnims.onPressOut}
                    >
                        <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
                    </TouchableOpacity>
                </Animated.View>
            </View>

            <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Não tem uma conta? </Text> {/* Translated */}
                <Link href="/(auth)/register-options" asChild>
                    <TouchableOpacity>
                        <Text style={styles.signUpLink}>Cadastre-se aqui</Text> {/* Translated */}
                    </TouchableOpacity>
                </Link>
            </View>

            {__DEV__ && (
            <View style={styles.testButtonsContainer}>
                <Text style={styles.testButtonsHeader}>Logins de Teste (Preencher Campos):</Text>
                <TouchableOpacity style={styles.testButton} onPress={quickLoginClient}>
                    <Text style={styles.testButtonText}>Cliente Teste</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.testButton} onPress={quickLoginProvider}>
                    <Text style={styles.testButtonText}>Provedor Teste</Text>
                </TouchableOpacity>
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
    marginBottom: 0, // Menos margem
    marginTop: 80, // Mais espaço no topo para o logo
  },
  logo: { // Ajuste para o logo V-shape
    width: 200, 
    height: 200,
    resizeMode: 'contain',
  },
  welcomeTitle: {
    fontSize: 24, // Ajustado
    // fontFamily: 'Poppins-Bold', 
    fontWeight: 'bold',
    color: '#1D2029', // Cor escura, quase preta
    textAlign: 'center',
    marginBottom: 6,  
  },
  welcomeSubtitle: {
    fontSize: 15, // Ajustado
    // fontFamily: 'Poppins-Regular', 
    color: '#8A94A6', // Cinza médio
    textAlign: 'center',
    marginBottom: 30, 
  },
  inputWrapper: { // Este é o contêiner branco pill-shape com sombra
    flexDirection: 'row', // Alinha os filhos horizontalmente (círculo do ícone e input)
    alignItems: 'center', // Centraliza verticalmente os filhos
    backgroundColor: '#FFFFFF',
    borderRadius: 28, // Totalmente arredondado
    height: 36, // Altura do input
    marginBottom: 17, 
    shadowColor: 'rgba(100, 100, 150, 0.15)', // Sombra mais suave
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 1, 
    shadowRadius: 15,  
    elevation: 5,     
    paddingLeft: 5, // Pequeno padding à esquerda para o círculo do ícone
    paddingRight: 15, // Padding à direita para o TextInput e o olho
  },
  iconCircle: { // Estilo para o círculo do ícone dentro do input
    width: 50,  // Tamanho do círculo
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
    elevation: 8,      // Mantido para um efeito mais sofisticado no Android
    marginRight: 10, // Espaço entre o círculo do ícone e o TextInput
},
  input: {
    flex: 1, // Faz com que o TextInput ocupe o espaço restante
    fontSize: 15, // Ajustado
    // fontFamily: 'Poppins-Regular', // Comentado pois não temos a fonte Poppins
    color: '#2D3748',
    right: 8, 
    height: '70%', // Garante que o input preencha a altura do wrapper
    paddingVertical: 0, // Remove padding vertical padrão que pode afetar a altura
    // Não precisa de paddingLeft/Right aqui, pois o padding do inputWrapper e o marginRight do ícone já cuidam do espaçamento
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
  signInButton: {
    backgroundColor: '#007BFF', 
    borderRadius: 28, 
    paddingVertical: 10, // Ajustado
    width: '80%',
    left: 31,
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
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 14, // Ajustado
    // fontFamily: 'Poppins-SemiBold', // Comentado pois não temos a fonte Poppins
    fontWeight: '600',
  },
  orSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25, // Ajustado
  },
  dashedLine: { // NOVO: Estilo para a linha tracejada
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderColor: '#DCE0E5', // Cor da linha tracejada
    borderStyle: 'dashed',
  },
  orText: { // Alterado de socialLoginLabel
    fontSize: 13, // Ajustado
    color: '#A0AEC0', 
    textAlign: 'center',
    marginHorizontal: 12, // Ajustado
    // fontFamily: 'Poppins-Regular', // Comentado pois não temos a fonte Poppins
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Centraliza os botões se houver menos que 3 ou para espaçamento uniforme
    marginBottom: 30, 
    width: '100%', 
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    width: 46,  // Ajustado
    height: 46, // Ajustado
    borderRadius: 28, 
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(100, 100, 150, 0.1)', // Sombra mais sutil
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 1, 
    shadowRadius: 8,   
    elevation: 4,      
    marginHorizontal: 12, // Espaço entre botões sociais
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 18, 
    paddingTop: 15, // Ajustado   
  },
  signUpText: {
    fontSize: 12, // Ajustado
    color: '#718096',
    // fontFamily: 'Poppins-Regular', // Comentado pois não temos a fonte Poppins
  },
  signUpLink: {
    fontSize: 14, // Ajustado
    color: '#007BFF', 
    // fontFamily: 'Poppins-SemiBold', // Comentado pois não temos a fonte Poppins
    fontWeight: '600',
    marginLeft: 4, 
  },
  // Estilos para os botões de teste (mantidos, mas ajustados para consistência)
  testButtonsContainer: {
    marginTop: 20, 
    borderTopWidth: 1,
    borderTopColor: '#EAF0F6', // Linha divisória mais sutil
    paddingTop: 20, 
    alignItems: 'center', 
  },
  testButtonsHeader: {
    textAlign: 'center',
    marginBottom: 10, 
    fontSize: 12,   // Ajustado
    color: '#718096',
    // fontFamily: 'Poppins-Regular', // Comentado pois não temos a fonte Poppins
  },
  testButton: {
    backgroundColor: '#EDF2F7', 
    paddingVertical: 9,   
    paddingHorizontal: 18, 
    borderRadius: 18,      
    alignItems: 'center',
    marginBottom: 9,     
    minWidth: 176,       
  },
  testButtonText: {
    color: '#4A5568', 
    fontWeight: '500',
    // fontFamily: 'Poppins-Medium', // Comentado pois não temos a fonte Poppins
    fontSize: 12, 
  },
  fullScreenLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC', // Consistente com o fundo da tela
  },
  fullScreenLoadingText: {
    marginTop: 13, 
    fontSize: 14, 
    // fontFamily: 'Poppins-Regular', // Comentado pois não temos a fonte Poppins
    color: '#4A5568',
  },
});