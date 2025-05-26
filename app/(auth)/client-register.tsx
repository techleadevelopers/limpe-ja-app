// LimpeJaApp/app/(auth)/client-register.tsx
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Alert, 
    TouchableOpacity, 
    ScrollView, 
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator 
} from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth'; // Ajuste o caminho se 'hooks' estiver na raiz
import { Ionicons } from '@expo/vector-icons';
// import { registerClient } from '../../../services/authService'; // Descomente quando for implementar

export default function ClientRegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Adicionado campo de telefone
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // const { signIn } = useAuth(); // Descomente se o cadastro já logar o usuário

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro de Senha', 'As senhas não coincidem.');
      return;
    }
    // TODO: Adicionar validações mais robustas para email, telefone e força da senha.
    // Exemplo de validação de e-mail simples:
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        Alert.alert('Email Inválido', 'Por favor, insira um endereço de e-mail válido.');
        return;
    }
    if (password.length < 6) { // Exemplo de requisito de senha
        Alert.alert('Senha Fraca', 'Sua senha deve ter pelo menos 6 caracteres.');
        return;
    }

    setIsLoading(true);
    const userData = { name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim() };
    console.log("[ClientRegister] Registrando com dados:", userData);

    // TODO: Implementar chamada real ao authService.registerClient
    // try {
    //   // const response = await registerClient(userData); // API pode retornar { user, tokens } ou apenas sucesso
    //   // Se retornar user e tokens e você quiser auto-login:
    //   // await signIn(response.user, response.tokens); 
    //   // router.replace('/(client)/explore');
    //   // Se não tiver auto-login:
    //   Alert.alert('Cadastro Realizado!', 'Sua conta foi criada com sucesso. Por favor, faça o login.');
    //   router.push('/(auth)/login');
    // } catch (error: any) {
    //   Alert.alert('Falha no Cadastro', error.message || 'Não foi possível criar sua conta. Tente novamente.');
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulação de sucesso
    setTimeout(() => {
      Alert.alert('Sucesso! (Simulado)', 'Conta de cliente criada com sucesso! Por favor, faça o login.');
      router.push('/(auth)/login');
      setIsLoading(false);
    }, 1500);
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
        <Stack.Screen options={{ title: 'Criar Conta de Cliente' }} />
        
        <View style={styles.headerContainer}>
            <Ionicons name="person-add-outline" size={48} color="#007AFF" />
            <Text style={styles.title}>Crie sua Conta</Text>
            <Text style={styles.subtitle}>É rápido e fácil. Comece a agendar seus serviços!</Text>
        </View>

        {/* Nome Completo */}
        <Text style={styles.label}>Nome Completo</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput 
                style={styles.input} 
                placeholder="Seu nome completo" 
                value={name} 
                onChangeText={setName} 
                autoCapitalize="words"
                textContentType="name"
            />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput 
                style={styles.input} 
                placeholder="seu.email@exemplo.com" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none"
                textContentType="emailAddress"
            />
        </View>

        {/* Telefone */}
        <Text style={styles.label}>Telefone</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput 
                style={styles.input} 
                placeholder="(XX) XXXXX-XXXX" 
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                maxLength={15} // Ex: (11) 98888-7777
            />
        </View>

        {/* Senha */}
        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput 
                style={styles.input} 
                placeholder="Crie uma senha (mín. 6 caracteres)" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword}
                textContentType="newPassword" // Ajuda o gerenciador de senhas
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#8A8A8E" />
            </TouchableOpacity>
        </View>

        {/* Confirmar Senha */}
        <Text style={styles.label}>Confirmar Senha</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput 
                style={styles.input} 
                placeholder="Repita a senha" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry={!showConfirmPassword}
                textContentType="newPassword"
            />
             <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#8A8A8E" />
            </TouchableOpacity>
        </View>

        {/* TODO: Adicionar Checkbox para Termos e Condições */}
        <View style={styles.termsContainer}>
            <Text style={styles.termsText}>Ao se cadastrar, você concorda com nossos </Text>
            <Link href="/termos" asChild><TouchableOpacity><Text style={styles.linkText}>Termos de Serviço</Text></TouchableOpacity></Link>
            <Text style={styles.termsText}> e </Text>
            <Link href="/privacidade" asChild><TouchableOpacity><Text style={styles.linkText}>Política de Privacidade</Text></TouchableOpacity></Link>
            <Text style={styles.termsText}>.</Text>
        </View>


        <TouchableOpacity 
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]} 
            onPress={handleRegister}
            disabled={isLoading}
        >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.registerButtonText}>Criar Conta</Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginText}>Já tem uma conta? </Text>
        <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
                <Text style={styles.loginLink}>Faça Login</Text>
            </TouchableOpacity>
        </Link>
      </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1, // Permite que o conteúdo cresça e o justifyContent funcione
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginTop: 10,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 7,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 10,
    marginBottom: 10, // Espaço abaixo de cada input container
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#212529',
  },
  eyeIcon: {
    padding: 5, // Aumenta a área de toque
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Permite quebra de linha
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  linkText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 18,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // Reduzido pois termos já dão espaço
    minHeight: 50,
  },
  registerButtonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    paddingBottom: 20, // Espaço no final da tela
  },
  loginText: {
    fontSize: 15,
    color: '#6C757D',
  },
  loginLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 5,
  }
});