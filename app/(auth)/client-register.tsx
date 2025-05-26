// LimpeJaApp/app/(auth)/client-register.tsx
import React, { useState } from 'react';
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
import { useAuth } from '../../hooks/useAuth'; // Ajuste o caminho se necessário
import { Ionicons } from '@expo/vector-icons';
// import { registerClient } from '../../services/authService';

export default function ClientRegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // const { signIn } = useAuth();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos marcados com *.');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Termos e Condições', 'Você precisa aceitar os Termos de Serviço e a Política de Privacidade para continuar.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro de Senha', 'As senhas não coincidem.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        Alert.alert('Email Inválido', 'Por favor, insira um endereço de e-mail válido.');
        return;
    }
    if (password.length < 6) {
        Alert.alert('Senha Fraca', 'Sua senha deve ter pelo menos 6 caracteres.');
        return;
    }

    setIsLoading(true);
    const userData = { name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim() };
    console.log("[ClientRegister] Registrando com dados:", userData);

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
            <Text style={styles.title}>Crie sua Conta no LimpeJá</Text>
            <Text style={styles.subtitle}>É rápido, fácil e abre portas para um mundo de limpeza e praticidade!</Text>
        </View>

        {/* Campos de Input como na sua versão anterior */}
        <Text style={styles.label}>Nome Completo *</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Seu nome completo" value={name} onChangeText={setName} autoCapitalize="words" textContentType="name"/>
        </View>

        <Text style={styles.label}>Email *</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="seu.email@exemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" autoComplete="email"/>
        </View>

        <Text style={styles.label}>Telefone *</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="(XX) XXXXX-XXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" maxLength={15}/>
        </View>

        <Text style={styles.label}>Senha *</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} textContentType="newPassword"/>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#8A8A8E" />
            </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirmar Senha *</Text>
        <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Repita a senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} textContentType="newPassword"/>
             <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#8A8A8E" />
            </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.termsCheckboxContainer} onPress={() => setAgreedToTerms(!agreedToTerms)}>
            <Ionicons name={agreedToTerms ? "checkbox" : "square-outline"} size={24} color={agreedToTerms ? "#007AFF" : "#8A8A8E"} />
            <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>Eu li e concordo com os </Text>
                {/* CORRIGIDO OS CAMINHOS ABAIXO */}
                <Link href="/(common)/" asChild><TouchableOpacity><Text style={styles.linkText}>Termos de Serviço</Text></TouchableOpacity></Link>
                <Text style={styles.termsText}> e a </Text>
                <Link href="/(common)/privacidade" asChild><TouchableOpacity><Text style={styles.linkText}>Política de Privacidade</Text></TouchableOpacity></Link>
                <Text style={styles.termsText}>.</Text>
            </View>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.registerButton, (isLoading || !agreedToTerms) && styles.registerButtonDisabled]} 
            onPress={handleRegister}
            disabled={isLoading || !agreedToTerms}
        >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.registerButtonText}>Criar Minha Conta</Text>
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

// Seus estilos (mantidos da versão anterior)
const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F8F9FA', },
  scrollView: { flex: 1, },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingVertical: 20, },
  headerContainer: { alignItems: 'center', marginBottom: 25, },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1C3A5F', marginTop: 8, marginBottom: 6, textAlign: 'center', },
  subtitle: { fontSize: 15, color: '#6C757D', textAlign: 'center', lineHeight: 22, marginBottom: 20, },
  label: { fontSize: 15, fontWeight: '600', color: '#495057', marginBottom: 7, marginTop: 12, },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 10, height: 52, paddingHorizontal: 12, marginBottom: 12, },
  inputIcon: { marginRight: 10, },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#212529', },
  eyeIcon: { paddingLeft: 10, },
  termsCheckboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, },
  termsTextContainer: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: 10, flex: 1, },
  termsText: { fontSize: 13, color: '#6C757D', lineHeight: 19, },
  linkText: { fontSize: 13, color: '#007AFF', fontWeight: '600', textDecorationLine: 'underline', lineHeight: 19, },
  registerButton: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 15, minHeight: 52, shadowColor: "#000", shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.20, shadowRadius: 2.62, elevation: 4, },
  registerButtonDisabled: { backgroundColor: '#A0CFFF', elevation: 0, shadowOpacity: 0, },
  registerButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold', },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25, paddingBottom: 20, },
  loginText: { fontSize: 15, color: '#6C757D', },
  loginLink: { fontSize: 15, color: '#007AFF', fontWeight: 'bold', marginLeft: 5, }
});