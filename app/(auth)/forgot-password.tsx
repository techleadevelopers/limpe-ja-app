// LimpeJaApp/app/(auth)/forgot-password.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Já estava importado corretamente
// import { sendPasswordReset } from '../../services/authService'; // Importe o authService real

// Simulação do authService.ts para demonstração
const mockAuthService = {
  sendPasswordReset: async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (email === 'cliente@limpeja.com' || email === 'pro@limpeja.com') {
      return true; // Sucesso
    } else {
      throw new Error("E-mail não encontrado em nossos registros.");
    }
  },
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    setMessage(null);
    setIsSuccess(false);

    if (!email.trim()) {
      setMessage('Por favor, insira seu e-mail.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage('Por favor, insira um endereço de e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      // Use o 'sendPasswordReset' do seu authService.ts real aqui
      await mockAuthService.sendPasswordReset(email.trim().toLowerCase());
      setMessage('Um link para redefinir sua senha foi enviado para seu e-mail. Verifique sua caixa de entrada (e spam)!');
      setIsSuccess(true);
    } catch (error: any) {
      console.error("[ForgotPasswordScreen] Erro ao redefinir senha:", error);
      setMessage(error.message || 'Não foi possível enviar o link de redefinição. Tente novamente mais tarde.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: 'Esqueci a Senha' }} />

        <View style={styles.headerSection}>
            <Ionicons name="lock-closed-outline" size={60} color="#007AFF" style={styles.headerIcon} />
            <Text style={styles.mainTitle}>Redefinir Senha</Text>
            <Text style={styles.subtitle}>
                Informe o e-mail associado à sua conta e enviaremos um link para você redefinir sua senha.
            </Text>
        </View>

        <Text style={styles.label}>E-mail</Text>
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

        {message && (
            <Text style={[styles.message, isSuccess ? styles.successMessage : styles.errorMessage]}>
                {message}
            </Text>
        )}

        <TouchableOpacity 
            style={[styles.resetButton, isLoading && styles.resetButtonDisabled]} 
            onPress={handleResetPassword}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={styles.resetButtonText}>Enviar Link de Redefinição</Text>
            )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backToLoginButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color="#007AFF" />
            <Text style={styles.backToLoginText}>Voltar para o Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingVertical: 20 },
  headerSection: { alignItems: 'center', marginBottom: 30 },
  headerIcon: { marginBottom: 15 },
  mainTitle: { fontSize: 26, fontWeight: 'bold', color: '#1C3A5F', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6C757D', textAlign: 'center', marginBottom: 30, paddingHorizontal: 10 },
  label: { fontSize: 15, fontWeight: '600', color: '#495057', marginBottom: 8, marginTop: 10 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#212529' },
  message: { fontSize: 13, textAlign: 'center', marginBottom: 15 },
  errorMessage: { color: '#D32F2F' },
  successMessage: { color: '#388E3C' },
  resetButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Platform.select({
      ios: { shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
      android: { elevation: 6 },
    }),
  },
  resetButtonDisabled: { backgroundColor: '#A0CFFF', elevation: 0, shadowOpacity: 0 },
  resetButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  backToLoginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  backToLoginText: { fontSize: 15, color: '#007AFF', fontWeight: '600', marginLeft: 5 },
});