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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Importações do Reanimated para as novas animações
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const LOGO_IMAGE = require('../../assets/images/logo2.png');

// Constantes para animações e layout
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { signIn, isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const router = useRouter();

  const mainElementsOpacity = useRef(new Animated.Value(0)).current;
  const mainElementsTranslateY = useRef(new Animated.Value(18)).current;

  // ANIMAÇÕES PARA MÚLTIPLAS MINI BOLHAS
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;
  const bubble4 = useRef(new Animated.Value(0)).current;
  const bubble5 = useRef(new Animated.Value(0)).current;
  const bubble6 = useRef(new Animated.Value(0)).current;
  const bubble7 = useRef(new Animated.Value(0)).current;
  const bubble8 = useRef(new Animated.Value(0)).current;

  // Valores compartilhados para as animações da logo (Reanimated)
  const logoRotateY = useSharedValue(0);
  const logoPulseScale = useSharedValue(1);

  useEffect(() => {
    // ANIMAÇÕES DAS MINI BOLHAS
    const startBubbleAnimations = () => {
      const bubbles = [bubble1, bubble2, bubble3, bubble4, bubble5, bubble6, bubble7, bubble8];
      
      bubbles.forEach((bubble, index) => {
        const delay = index * 800;
        const duration = 3000 + (index * 500);
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(bubble, {
              toValue: 1,
              duration: duration,
              delay: delay,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(bubble, {
              toValue: 0,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    };

    // Função para iniciar as animações de loop da logo
    const startLogoLoopAnimations = () => {
      logoRotateY.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      logoPulseScale.value = withRepeat(
        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    };

    if (!authIsLoading && isAuthenticated) {
      const targetRoute = user?.role === 'CLIENT' ? '/(client)/explore' : user?.role === 'PROVIDER' ? '/(provider)/dashboard' : '/';
      router.replace(targetRoute as any);
    } else if (!isAuthenticated) {
      Animated.parallel([
        Animated.timing(mainElementsOpacity, { 
          toValue: 1, 
          duration: 700, 
          delay: 200, 
          useNativeDriver: true 
        }),
        Animated.timing(mainElementsTranslateY, { 
          toValue: 0, 
          duration: 700, 
          delay: 200, 
          useNativeDriver: true 
        })
      ]).start(() => {
        startLogoLoopAnimations();
        startBubbleAnimations();
      });
    }
  }, [isAuthenticated, authIsLoading, user, router]);

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

  const createButtonAnimations = () => {
    const scaleAnimButton = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scaleAnimButton, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
    const onPressOut = () => Animated.spring(scaleAnimButton, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
    return { scaleAnim: scaleAnimButton, onPressIn, onPressOut };
  };

  const signInButtonAnims = createButtonAnimations();
  const googleButtonAnims = createButtonAnimations();
  const facebookButtonAnims = createButtonAnimations();
  const twitterButtonAnims = createButtonAnimations();

  // Estilo animado para a logo principal (Reanimated)
  const animatedLogoStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      logoRotateY.value,
      [0, 0.5, 1],
      [-5, 0, 5],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: logoPulseScale.value },
        { rotateY: `${rotation}deg` },
      ],
    };
  });

  // LOADING ORIGINAL MANTIDO
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
      
      {/* Fundo com gradiente */}
      <LinearGradient
        colors={['#F0F4F8', '#E2E8F0', '#F7FAFC']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* MÚLTIPLAS MINI BOLHAS AZUIS */}
      <Animated.View style={[
        styles.miniBubble1,
        {
          transform: [
            { 
              translateY: bubble1.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT + 50, -100]
              })
            },
            { 
              translateX: bubble1.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 30, -20]
              })
            }
          ],
          opacity: bubble1.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0]
          })
        }
      ]}>
        <LinearGradient
          colors={['rgba(66, 165, 245, 0.3)', 'rgba(144, 202, 249, 0.2)']}
          style={styles.bubbleGradient}
        />
      </Animated.View>

      <Animated.View style={[
        styles.miniBubble2,
        {
          transform: [
            { 
              translateY: bubble2.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT + 50, -100]
              })
            },
            { 
              translateX: bubble2.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, -25, 35]
              })
            }
          ],
          opacity: bubble2.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0]
          })
        }
      ]}>
        <LinearGradient
          colors={['rgba(30, 144, 255, 0.25)', 'rgba(100, 149, 237, 0.15)']}
          style={styles.bubbleGradient}
        />
      </Animated.View>

      <Animated.View style={[
        styles.miniBubble3,
        {
          transform: [
            { 
              translateY: bubble3.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT + 50, -100]
              })
            },
            { 
              translateX: bubble3.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 40, -15]
              })
            }
          ],
          opacity: bubble3.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0]
          })
        }
      ]}>
        <LinearGradient
          colors={['rgba(135, 206, 250, 0.2)', 'rgba(173, 216, 230, 0.15)']}
          style={styles.bubbleGradient}
        />
      </Animated.View>

      <Animated.View style={[
        styles.miniBubble4,
        {
          transform: [
            { 
              translateY: bubble4.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT + 50, -100]
              })
            },
            { 
              translateX: bubble4.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, -30, 25]
              })
            }
          ],
          opacity: bubble4.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0]
          })
        }
      ]}>
        <LinearGradient
          colors={['rgba(70, 130, 180, 0.3)', 'rgba(176, 196, 222, 0.2)']}
          style={styles.bubbleGradient}
        />
      </Animated.View>

      <Animated.View style={[
        styles.miniBubble5,
        {
          transform: [
            { 
              translateY: bubble5.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT + 50, -100]
              })
            },
            { 
              translateX: bubble5.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 20, -40]
              })
            }
          ],
          opacity: bubble5.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0]
          })
        }
      ]}>
        <LinearGradient
          colors={['rgba(65, 105, 225, 0.25)', 'rgba(123, 104, 238, 0.15)']}
          style={styles.bubbleGradient}
        />
      </Animated.View>

      <Animated.View style={[
        styles.miniBubble6,
        {
          transform: [
            { 
              translateY: bubble6.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT + 50, -100]
              })
            },
            { 
              translateX: bubble6.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, -35, 30]
              })
            }
          ],
          opacity: bubble6.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0]
          })
        }
      ]}>
        <LinearGradient
          colors={['rgba(95, 158, 160, 0.2)', 'rgba(175, 238, 238, 0.15)']}
          style={styles.bubbleGradient}
        />
      </Animated.View>

      <Animated.View style={[
        styles.miniBubble7,
        {
          transform: [
            { 
              translateY: bubble7.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT + 50, -100]
              })
            },
            { 
              translateX: bubble7.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 45, -10]
              })
            }
          ],
          opacity: bubble7.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0]
          })
        }
      ]}>
        <LinearGradient
          colors={['rgba(72, 61, 139, 0.2)', 'rgba(147, 112, 219, 0.15)']}
          style={styles.bubbleGradient}
        />
      </Animated.View>

      <Animated.View style={[
        styles.miniBubble8,
        {
          transform: [
            { 
              translateY: bubble8.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT + 50, -100]
              })
            },
            { 
              translateX: bubble8.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, -20, 50]
              })
            }
          ],
          opacity: bubble8.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0]
          })
        }
      ]}>
        <LinearGradient
          colors={['rgba(106, 90, 205, 0.25)', 'rgba(221, 160, 221, 0.15)']}
          style={styles.bubbleGradient}
        />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <Animated.View style={[
          styles.contentWrapper, 
          { 
            opacity: mainElementsOpacity, 
            transform: [{ translateY: mainElementsTranslateY }] 
          }
        ]}>
          {/* LOGO COM DIMENSÕES ORIGINAIS RESTAURADAS */}
          <View style={styles.logoContainer}>
            <AnimatedReanimated.Image source={LOGO_IMAGE} style={[styles.logo, animatedLogoStyle]} />
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

          <View style={styles.forgotPasswordContainer}>
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordLink}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    paddingBottom: 10,
  },
  contentWrapper: {
    paddingHorizontal: 35,
    paddingTop: Platform.OS === 'ios' ? 20 : 15,
  },

  // ESTILOS PARA MINI BOLHAS AZUIS
  miniBubble1: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.1,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    overflow: 'hidden',
  },
  miniBubble2: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.15,
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  miniBubble3: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.25,
    width: 12,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  miniBubble4: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.3,
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
  },
  miniBubble5: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.05,
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  miniBubble6: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.05,
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  miniBubble7: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.4,
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
  },
  miniBubble8: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.4,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    overflow: 'hidden',
  },
  bubbleGradient: {
    flex: 1,
  },

  // LOGO COM DIMENSÕES ORIGINAIS RESTAURADAS
  logoContainer: {
    top: 73,
    right: 10,
    alignItems: 'center',
  },
  logo: {
    width: 235,
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
    marginBottom: 50,
    bottom: 55,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 33,
    bottom: 55,
    marginBottom: 10,
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
    paddingLeft: 5,
    paddingRight: 15,
  },
  iconCircle: {
    width: 50,
    height: 30,
    right: 2,
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
    paddingVertical: 7,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    bottom: 55,
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
    top: 40,
  },
  orText: {
    fontSize: 13,
    color: '#A0AEC0',
    textAlign: 'center',
    top: 40,
    marginHorizontal: 12,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    top: 50,
    width: '100%',
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    width: 46,
    height: 46,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(100, 100, 150, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 12,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 200,
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
    bottom: 195,
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