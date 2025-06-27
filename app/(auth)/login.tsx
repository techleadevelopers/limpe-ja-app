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
  Dimensions,
  Button
} from 'react-native';
import { Link, useRouter, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../types/backend/auth';

// CORREÇÃO: Revertido para caminho absoluto, conforme feedback de que funciona sem erros
const LOGO_IMAGE = require('../../assets/images/logo2.png');

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

export default function LoginScreen() {
  const [username, setUsername] = useState(''); // Este será o email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { signIn, isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const router = useRouter();

  const mainElementsOpacity = useRef(new Animated.Value(0)).current;
  const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

  const showTestLogins = process.env.EXPO_PUBLIC_SHOW_TEST_LOGINS === 'true' || __DEV__;

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      const targetRoute = user?.role === 'CLIENT' ? '/(client)/explore' : user?.role === 'PROVIDER' ? '/(provider)/dashboard' : '/';
      router.replace(targetRoute as any);
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
      setGeneralError('Por favor, insira seu nome de usuário e senha.');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    setIsLoading(true);
    try {
      await signIn({ email: username.trim().toLowerCase(), password: password });
    } catch (error: any) {
      setGeneralError(error.message || 'Falha no login. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // MODIFICAÇÃO: Passe livre (navegação direta) para os botões de teste
  const navigateToClientDashboard = () => {
    router.replace('/(client)/explore');
  };

  const navigateToProviderDashboard = () => {
    router.replace('/(provider)/dashboard');
  };

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
        <Text style={styles.fullScreenLoadingText}>Carregando sua sessão...</Text>
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

            
            <Text style={styles.welcomeSubtitle}>Faça login em sua conta</Text>

            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={18} color="#00BCD4" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nome de usuário"
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
                    <Ionicons name="lock-closed-outline" size={18} color="#00BCD4" />
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
                    <Text style={styles.signInButtonText}>Entrar</Text>
                )}
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.orSeparatorContainer}>
              <View style={styles.dashedLine} />
              <Text style={styles.orText}>Ou faça login com</Text>
              <View style={styles.dashedLine} />
            </View>

            <View style={styles.socialLoginContainer}>
                <Animated.View style={{transform: [{scale: googleButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => Alert.alert("Login Social", "Login com Google (não implementado).")}
                        onPressIn={googleButtonAnims.onPressIn}
                        onPressOut={googleButtonAnims.onPressOut}
                    >
                        <Ionicons name="logo-google" size={22} color="#DB4437" />
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{transform: [{scale: facebookButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => Alert.alert("Login Social", "Login com Facebook (não implementado).")}
                        onPressIn={facebookButtonAnims.onPressIn}
                        onPressOut={facebookButtonAnims.onPressOut}
                    >
                        <Ionicons name="logo-facebook" size={22} color="#4267B2" />
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{transform: [{scale: twitterButtonAnims.scaleAnim}]}}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => Alert.alert("Login Social", "Login com Twitter (não implementado).")}
                        onPressIn={twitterButtonAnims.onPressIn}
                        onPressOut={twitterButtonAnims.onPressOut}
                    >
                        <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
                    </TouchableOpacity>
                </Animated.View>
            </View>

            <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Não tem uma conta? </Text>
                <Link href="/(auth)/register-options" asChild>
                    <TouchableOpacity>
                        <Text style={styles.signUpLink}>Cadastre-se aqui</Text>
                    </TouchableOpacity>
                </Link>
            </View>

            {/* Link "Esqueceu a Senha?" - Nova Melhoria */}
            <View style={styles.forgotPasswordContainer}>
                <Link href="/(auth)/forgot-password" asChild>
                    <TouchableOpacity>
                        <Text style={styles.forgotPasswordLink}>Esqueceu a senha?</Text>
                    </TouchableOpacity>
                </Link>
            </View>

            {showTestLogins && (
            <View style={styles.testButtonsContainer}>
                <Text style={styles.testButtonsHeader}>Preencher Campos de Teste:</Text>
                {/* MODIFICAÇÃO: Renomeado e alterado para navegação direta */}
                <TouchableOpacity style={styles.testButton} onPress={navigateToClientDashboard}>
                    <Text style={styles.testButtonText}>Teste Cliente</Text>
                </TouchableOpacity>
                {/* MODIFICAÇÃO: Renomeado e alterado para navegação direta */}
                <TouchableOpacity style={styles.testButton} onPress={navigateToProviderDashboard}>
                    <Text style={styles.testButtonText}>Teste Provedor</Text>
                </TouchableOpacity>
                {/* MODIFICAÇÃO: Botão "Ir para Teste de Conexão API" REMOVIDO */}
            </View>
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
    top: 142, // Ajuste para centralizar o logo
    right: 13,
    alignItems: 'center',
    
  },
  logo: {
    width: 280,
    height: 310,
    resizeMode: 'contain',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1D2029',
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#8A94A6',
    textAlign: 'center',
    marginBottom: 60,
    top: 15, // Espaço entre o logo e o título
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 36,
    marginBottom: 17,
    // Estilos de sombra para iOS
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    // Elevação para Android (pode precisar de um valor maior em dispositivos físicos)
    elevation: 5, // Considere aumentar para 8 ou 10 para maior visibilidade no Android
    paddingLeft: 5,
    paddingRight: 15,
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
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    right: 8,
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
  signInButton: {
    backgroundColor: 'rgba(64, 192, 240, 0.85)',
    borderRadius: 28,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 25,
    // Estilos de sombra para iOS
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Elevação para Android
    elevation: 8, // Considere aumentar para 10 ou 12 para maior visibilidade
  },
  buttonDisabled: {
    backgroundColor: '#A0CFFF',
    elevation: 0,
    shadowOpacity: 0,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  orSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderColor: '#DCE0E5',
    borderStyle: 'dashed',
  },
  orText: {
    fontSize: 13,
    color: '#A0AEC0',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    width: '100%',
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    width: 46,
    height: 46,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    // Estilos de sombra para iOS
    shadowColor: 'rgba(100, 100, 150, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    // Elevação para Android
    elevation: 4, // Considere aumentar para 6 ou 8
    marginHorizontal: 12,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 18,
    paddingTop: 15,
  },
  signUpText: {
    fontSize: 12,
    color: '#718096',
  },
  signUpLink: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordLink: {
    fontSize: 13,
    color: '#007BFF',
    fontWeight: '500',
  },
  testButtonsContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EAF0F6',
    paddingTop: 20,
    alignItems: 'center',
  },
  testButtonsHeader: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 12,
    color: '#718096',
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
    fontSize: 12,
  },
  fullScreenLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
  },
  fullScreenLoadingText: {
    marginTop: 13,
    fontSize: 14,
    color: '#4A5568',
  },
});
