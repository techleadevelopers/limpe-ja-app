import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AuthService from '../../services/authService';

export default function ResetPasswordScreen() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setMessage(null);
    if (!token.trim() || !newPassword.trim()) {
      setMessage('Informe o token e a nova senha.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.confirmPasswordReset(token.trim(), newPassword);
      router.replace('/auth/login');
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível redefinir a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'Confirmar nova senha' }} />
      <View style={styles.content}>
        <Text style={styles.title}>Confirme sua nova senha</Text>
        <TextInput
          placeholder="Código recebido"
          style={styles.input}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Nova senha"
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Confirmar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#0F172A',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#CBD5F5',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  message: {
    color: '#DC2626',
    textAlign: 'center',
    marginVertical: 8,
  },
});
