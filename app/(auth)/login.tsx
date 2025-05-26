// LimpeJaApp/app/(auth)/login.tsx
import React, { useState } from 'react';
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
  Image // Para o logo
} from 'react-native';
import { Link, useRouter, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth'; // Ajuste o caminho se 'hooks' estiver na raiz
import { loginUser } from '../../services/authService'; // Ajuste o caminho se 'services' estiver na raiz
import { Ionicons } from '@expo/vector-icons'; // Para ícones

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Campos Vazios', 'Por favor, preencha seu e-mail e senha.');
      return;
    }
    // Validação de email simples
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        Alert.alert('Email Inválido', 'Por favor, insira um endereço de e-mail válido.');
        return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser({ email: email.trim().toLowerCase(), password });
      
      if (!response || !response.user || !response.tokens) {
          throw new Error("Resposta inválida do servidor de login.");
      }
      await signIn(response.user, response.tokens);
      
      // O redirecionamento principal é feito pelo app/_layout.tsx.
      // Esta navegação aqui é uma tentativa de otimizar a percepção de velocidade.
      // Se o _layout já estiver tratando bem, esta parte pode ser opcional.
      if (response.user.role === 'client') {
        router.replace('/(client)/explore');
      } else if (response.user.role === 'provider') {
        router.replace('/(provider)/dashboard');
      } else {
        console.warn("[LoginScreen] Usuário autenticado sem role definido ou role desconhecido.");
        router.replace('/'); // Fallback genérico
      }

    } catch (error: any) {
      console.error("[LoginScreen] Falha no Login:", error);
      Alert.alert('Falha no Login', error.message || 'Não foi possível fazer login. Verifique seus dados ou tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para os botões de teste
  const quickLoginClient = () => {
    setEmail('cliente@limpeja.com');
    setPassword('cliente123');
    // handleLogin(); // Opcional: chamar handleLogin automaticamente
  };
  const quickLoginProvider = () => {
    setEmail('pro@limpeja.com');
    setPassword('pro123');
    // handleLogin(); // Opcional: chamar handleLogin automaticamente
  };


  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* O Stack.Screen aqui é opcional se você já tem um header no (auth)/_layout.tsx
            ou se quiser um design sem header explícito nesta tela. */}
        <Stack.Screen options={{ headerShown: false }} /> 
        
        <View style={styles.logoContainer}>
          {/* Substitua pelo seu componente de Logo ou Image real */}
          {/* <Image source={require('../../../assets/images/logo_limpeja_grande.png')} style={styles.logo} /> */}
          <Text style={styles.appName}>LimpeJá</Text>
        </View>
        
        <Text style={styles.title}>Bem-vindo(a) de volta!</Text>
        <Text style={styles.subtitle}>Acesse sua conta para continuar.</Text>
        
        {/* Email Input */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="#ADB5BD"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                autoComplete="email"
            />
        </View>

        {/* Password Input */}
        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor="#ADB5BD"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password" // Ajuda com preenchimento automático de senhas
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#8A8A8E" />
            </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => Alert.alert("Esqueci Senha", "Funcionalidade a ser implementada.") /* TODO: router.push('/(auth)/forgot-password') */}>
            <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
            )}
        </TouchableOpacity>

        {/* TODO: Adicionar "Ou entre com" e botões de login social (Google, Apple) aqui */}

        <View style={styles.registerLinkContainer}>
            <Text style={styles.registerText}>Não tem uma conta? </Text>
            <Link href="/(auth)/register-options" asChild>
                <TouchableOpacity>
                    <Text style={styles.registerLink}>Cadastre-se</Text>
                </TouchableOpacity>
            </Link>
        </View>

        {/* Botões de teste rápido - Mantenha apenas em desenvolvimento */}
        {__DEV__ && ( // Mostra apenas em modo de desenvolvimento
            <View style={styles.testButtonsContainer}>
                <Text style={styles.testButtonsHeader}>Logins de Teste Rápido:</Text>
                <TouchableOpacity style={styles.testButton} onPress={quickLoginClient}>
                    <Text style={styles.testButtonText}>Cliente Teste</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.testButton} onPress={quickLoginProvider}>
                    <Text style={styles.testButtonText}>Provedor Teste</Text>
                </TouchableOpacity>
            </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Um fundo suave para a tela
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30, // Maior padding horizontal
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  // logo: { width: 150, height: 150, resizeMode: 'contain' }, // Estilo para seu logo
  appName: { // Se preferir usar texto para o logo
    fontSize: 40,
    fontWeight: 'bold',
    color: '#007AFF', // Cor primária do app
  },
  title: {
    fontSize: 26, // Ajustado
    fontWeight: 'bold',
    color: '#1C3A5F', // Um azul escuro
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D', // Cinza para o subtítulo
    textAlign: 'center',
    marginBottom: 35,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057', // Cinza escuro para labels
    marginBottom: 8,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA', // Borda mais suave
    borderRadius: 10, // Bordas mais arredondadas
    height: 52,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#212529', // Cor do texto do input
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPasswordText: {
    textAlign: 'right',
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 25,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#A0CFFF',
    elevation: 0,
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30, // Mais espaço
    paddingBottom: 20, // Para garantir visibilidade no scroll
  },
  registerText: {
    fontSize: 15,
    color: '#6C757D',
  },
  registerLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  testButtonsContainer: { // Estilos para os botões de teste
    marginTop: 25,
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    paddingTop: 15,
  },
  testButtonsHeader: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 13,
    color: 'gray',
  },
  testButton: {
    backgroundColor: '#E9ECEF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 8,
  },
  testButtonText: {
    color: '#495057',
    fontWeight: '500',
  }
});