// LimpeJaApp/app/(provider)/withdraw.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; // Import para haptics premium (iOS/Android)
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Para alinhamento robusto do header (iOS notch/status bar)

// ✅ Importar a tipagem correta
import { RequestWithdrawalDto, PixKeyType } from '../../../types/backend/payments';

// 🔗 Importar serviços reais
import { requestWithdrawal } from '../../../services/paymentService';
import api from '../../../services/api';
import NotificationUIService from '../../../services/notificationUIService'; // Para toasts premium

// ===== Design Tokens (Premium UI - Clean, iOS/Android consistente) =====
const Colors = {
  primary: '#007AFF', // Azul Apple-like para iOS, vibrante no Android
  primaryDark: '#0056B3',
  link: '#007AFF',
  bgSoft: '#F8F9FD', // Fundo suave premium
  surface: '#FFFFFF',
  border: '#E5E5EA', // Subtil para iOS, clean no Android
  fieldBg: '#F8F9FA',
  text: '#1D1D1F', // Escuro premium
  textMuted: '#6C757D',
  textSubtle: '#868E96',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  shadow: 'rgba(0, 0, 0, 0.05)', // Sombra sutil para iOS, elevation no Android
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
};

const Radii = { xl: 20, pill: 28, lg: 16, md: 12, sm: 8 };
const Spacing = { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 };

const easeOut = Easing.out(Easing.ease);

// Helper para formatar moeda (ex: R$ 1.234,56) - Premium com locale BR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Helper para validar CPF (simples, premium com feedback)
const isValidCPF = (cpf: string) => {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0, remainder;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf.charAt(10));
};

export default function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Robust header alignment (iOS: notch/status bar, Android: 0)

  const [amount, setAmount] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [pixKey, setPixKey] = useState<string>(''); // Chave PIX dinâmica
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(PixKeyType.CPF); // Tipo selecionado
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState<boolean>(false);
  const [isWithdrawalSuccessful, setIsWithdrawalSuccessful] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>(''); // Notas opcionais

  // Animated values for premium transitions (fade + slide)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Adicionado ref para verificar se o componente está montado
  const isMounted = useRef(true);
  // Ref para armazenar a animação composta
  const initialAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    isMounted.current = true; // Componente montado

    const fetchBalance = async () => {
      if (isMounted.current) {
        setIsLoading(true);
      }
      try {
        // Backend endpoint para saldo (ajuste se necessário, integrado ao payments)
        const response = await api.get<{ balance: number }>('/providers/me/metrics'); // Usa metrics para totalBookings/earnings proxy
        if (isMounted.current) {
          // Simula saldo baseado em earnings (ajuste backend se preciso)
          setAvailableBalance(response.data.acceptanceRate * 100 || 0); // Placeholder: use real earnings field
        }
      } catch (err: any) {
        console.error('Erro ao buscar saldo:', err);
        if (isMounted.current) {
          NotificationUIService.showError('Não foi possível carregar o saldo. Tente novamente.', 'Erro de Saldo');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          // Armazenar a referência da animação composta (premium entrance)
          initialAnimationRef.current = Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              easing: easeOut,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              easing: easeOut,
              useNativeDriver: true,
            }),
          ]);
          initialAnimationRef.current.start();
        }
      }
    };
    fetchBalance();

    return () => {
      isMounted.current = false; // Componente desmontado
      // Parar a animação se ela estiver em andamento
      if (initialAnimationRef.current) {
        initialAnimationRef.current.stop();
      }
    };
  }, []);

  const handleAmountChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.,]/g, '');
    const formattedText = cleanedText.replace(',', '.');
    const parts = formattedText.split('.');
    if (parts.length > 2) {
      setAmount(`${parts[0]}.${parts.slice(1).join('')}`);
    } else {
      setAmount(formattedText);
    }
    setFormError(null);
  };

  const handlePixKeyChange = (text: string) => {
    setPixKey(text.replace(/\D/g, '')); // Limpa não-dígitos (premium validation)
    setFormError(null);
  };

  const handlePixKeyTypeChange = (type: PixKeyType) => {
    setPixKeyType(type);
    setPixKey(''); // Limpa chave ao trocar tipo
    setFormError(null);
  };

  const validateForm = (): string | null => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return 'Por favor, insira um valor válido para saque (mínimo R$ 10,00).';
    }
    if (parsedAmount > availableBalance) {
      return `O valor do saque excede o saldo disponível (R$ ${formatCurrency(availableBalance)}).`;
    }
    if (!pixKey.trim()) {
      return 'Por favor, insira uma chave PIX válida.';
    }
    // Validação premium por tipo
    switch (pixKeyType) {
      case PixKeyType.CPF:
        if (!isValidCPF(pixKey) || pixKey.length !== 11) {
          return 'CPF inválido. Digite apenas números (ex: 12345678900).';
        }
        break;
      case PixKeyType.CNPJ:
        if (pixKey.length !== 14 || !/^\d{14}$/.test(pixKey)) {
          return 'CNPJ inválido. Digite apenas números (ex: 12345678000199).';
        }
        break;
      case PixKeyType.EMAIL:
        if (!/\S+@\S+\.\S+/.test(pixKey)) {
          return 'E-mail inválido.';
        }
        break;
      case PixKeyType.PHONE:
        if (!/^(\+55)?\s?(\(?\d{2}\)?\s?)?(\d{4,5}-\d{4})$/.test(pixKey)) {
          return 'Telefone inválido (ex: +55 11 99999-9999).';
        }
        break;
      case PixKeyType.RANDOM:
        if (pixKey.length < 32 || pixKey.length > 77) {
          return 'Chave aleatória inválida (UUID ou chave gerada pelo banco).';
        }
        break;
    }
    return null;
  };

  const handleConfirmWithdrawal = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Haptic premium para erro (iOS)
      }
      return;
    }

    const pixData: RequestWithdrawalDto = {
      amount: parseFloat(amount.replace(',', '.')),
      pixKeyType,
      pixKey,
      notes: notes.trim() || undefined, // Opcional
    };

    if (isMounted.current) {
      setIsProcessingWithdrawal(true);
      setFormError(null);
    }

    try {
      await requestWithdrawal(pixData);
      if (isMounted.current) {
        setIsWithdrawalSuccessful(true);
        setAvailableBalance((prev) => prev - pixData.amount); // Atualiza saldo local
        NotificationUIService.showSuccess(`Saque de ${formatCurrency(pixData.amount)} solicitado com sucesso! O valor será processado em até 24h.`, 'Saque Enviado');
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Haptic premium para sucesso (iOS)
        }
      }
    } catch (error: any) {
      console.error('Erro ao solicitar saque:', error);
      if (isMounted.current) {
        const errorMsg = error?.message || 'Não foi possível processar o saque. Verifique os dados e tente novamente.';
        setFormError(errorMsg);
        NotificationUIService.showError(errorMsg, 'Erro no Saque');
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Haptic para erro
        }
      }
    } finally {
      if (isMounted.current) {
        setIsProcessingWithdrawal(false);
      }
    }
  };

  const handleReceiveStatement = (type: 'email' | 'download') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Haptic sutil
    }
    Alert.alert(
      'Funcionalidade Premium',
      `Gerar extrato via ${type === 'email' ? 'e-mail' : 'download'} (em desenvolvimento).`,
      [{ text: 'OK' }]
    );
  };

  const handleSkipStatement = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  if (isLoading) {
    return (
      <View style={[styles.centeredContainer, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando saldo disponível...</Text>
      </View>
    );
  }

  if (isWithdrawalSuccessful) {
    return (
      <KeyboardAvoidingView style={styles.outerContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View
          style={[
            styles.successContainer,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }] 
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={100} color={Colors.success} />
          <Text style={styles.successTitle}>Saque Solicitado com Sucesso!</Text>
          <Text style={styles.successMessage}>
            Seu pedido de saque foi enviado e está em processamento. O valor será transferido em até 24h úteis para a chave PIX informada.
          </Text>

          <View style={styles.statementOptions}>
            <Text style={styles.statementText}>Receber extrato via:</Text>
            <View style={styles.statementButtons}>
              <TouchableOpacity
                style={styles.statementButton}
                onPress={() => handleReceiveStatement('email')}
                accessibilityRole="button"
                accessibilityLabel="Enviar extrato por e-mail"
                accessibilityHint="Toque para receber o extrato por e-mail."
              >
                <Ionicons name="mail-outline" size={20} color={Colors.primary} accessibilityHidden />
                <Text style={styles.statementButtonText}>E-mail</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statementButton}
                onPress={() => handleReceiveStatement('download')}
                accessibilityRole="button"
                accessibilityLabel="Baixar extrato"
                accessibilityHint="Toque para baixar o extrato."
              >
                <Ionicons name="download-outline" size={20} color={Colors.primary} accessibilityHidden />
                <Text style={styles.statementButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButtonPrimary}
            onPress={handleSkipStatement}
            accessibilityRole="button"
            accessibilityLabel="Voltar para Ganhos"
            accessibilityHint="Retorne à tela de ganhos."
          >
            <Text style={styles.actionButtonPrimaryText}>Voltar para Ganhos</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  }

  const isConfirmButtonEnabled = parseFloat(amount.replace(',', '.')) > 0 && parseFloat(amount.replace(',', '.')) <= availableBalance && !isProcessingWithdrawal && !!pixKey.trim();

  return (
    <KeyboardAvoidingView
      style={styles.outerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 100 : 0} // Robust offset com insets
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Robusto (Premium: Alinhado com SafeArea no iOS, fixo no Android) */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
            paddingTop: Platform.OS === 'ios' ? insets.top + 16 : 16, // Robust: insets.top para iOS status bar/notch
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.headerBackButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorne à tela anterior."
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar Saque</Text>
        <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para balanceamento */}
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        {/* Card: Saldo e Valor do Saque */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Saldo Disponível</Text>
          <Text style={styles.availableBalanceText}>
            R$ {formatCurrency(availableBalance)}
          </Text>
          <Text style={styles.availableBalanceSubtitle}>Valor total de ganhos acumulados</Text>

          <Text style={[styles.cardTitle, { marginTop: Spacing.xl }]}>Valor do Saque</Text>
          <TextInput
            style={[styles.amountInput, formError ? styles.inputError : {}]}
            placeholder="0,00"
            placeholderTextColor={Colors.textSubtle}
            keyboardType="decimal-pad" // Premium: Teclado numérico com vírgula (iOS/Android)
            value={amount}
            onChangeText={handleAmountChange}
            autoFocus
            accessibilityLabel="Valor do saque"
            accessibilityHint="Digite o valor em reais para sacar."
          />
          {formError && <Text style={styles.formErrorText}>{formError}</Text>}
        </Animated.View>

        {/* Card: Chave PIX (Premium: Seleção de tipo + validação real-time) */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Transferir Para (PIX)</Text>
          <View style={styles.pixTypeSelector}>
            {Object.values(PixKeyType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pixTypeButton,
                  pixKeyType === type && styles.pixTypeButtonActive,
                ]}
                onPress={() => handlePixKeyTypeChange(type)}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar chave ${type.toLowerCase()}`}
                accessibilityHint={`Toque para usar chave do tipo ${type.toLowerCase()}.`}
              >
                <Text style={[
                  styles.pixTypeButtonText,
                  pixKeyType === type && styles.pixTypeButtonTextActive,
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.pixKeyInput}
            placeholder={pixKeyType === PixKeyType.CPF ? "123.456.789-00" : pixKeyType === PixKeyType.EMAIL ? "seu@email.com" : "Digite a chave PIX"}
            placeholderTextColor={Colors.textSubtle}
            value={pixKey}
            onChangeText={handlePixKeyChange}
            keyboardType={pixKeyType === PixKeyType.PHONE ? "phone-pad" : "default"}
            autoCapitalize="none"
            accessibilityLabel="Chave PIX"
            accessibilityHint="Digite a chave PIX do tipo selecionado."
          />
          <Text style={styles.pixKeyHelper}>
            {pixKeyType === PixKeyType.CPF && pixKey.length === 11 && !isValidCPF(pixKey) && 'CPF inválido. Verifique os dígitos.'}
            {pixKeyType === PixKeyType.CPF && pixKey.length < 11 && pixKey.length > 0 && 'Digite o CPF completo (11 dígitos).'}
          </Text>
        </Animated.View>

        {/* Card: Notas Opcionais (Premium: Opcional com limite de chars) */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Observações (Opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ex: Saque para despesas operacionais..."
            placeholderTextColor={Colors.textSubtle}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={200}
            characterCount={notes.length}
            accessibilityLabel="Observações do saque"
            accessibilityHint="Adicione notas opcionais para o saque (máx. 200 caracteres)."
          />
          <Text style={styles.charCount}>{notes.length}/200</Text>
        </Animated.View>

        {/* Botão Confirmar (Premium: Desabilitado com feedback visual/haptic) */}
        <Animated.View
          style={[
            styles.saveButtonContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButtonPrimary,
              (!isConfirmButtonEnabled || isProcessingWithdrawal) && styles.actionButtonDisabled,
            ]}
            onPress={handleConfirmWithdrawal}
            disabled={!isConfirmButtonEnabled || isProcessingWithdrawal}
            accessibilityRole="button"
            accessibilityLabel="Confirmar Saque"
            accessibilityHint="Toque para confirmar e processar o saque."
            accessibilityState={{ disabled: !isConfirmButtonEnabled || isProcessingWithdrawal }}
          >
            {isProcessingWithdrawal ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionButtonPrimaryText}>
                Confirmar Saque de {formatCurrency(parseFloat(amount.replace(',', '.') || 0))}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ===== Styles (Premium: Clean iOS-like com shadows suaves, elevation Android) =====
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  scrollViewContent: {
    paddingBottom: 40,
    paddingHorizontal: Spacing.md,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgSoft,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 16,
    color: Colors.textMuted,
  },
  // Header Robusto (Alinhado com SafeArea no iOS, fixo no Android)
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerBackButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  headerActionIconPlaceholder: {
    width: 24,
    height: 24,
    marginRight: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, // Sutil para iOS clean
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  availableBalanceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  availableBalanceSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  amountInput: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.sm,
  },
  formErrorText: {
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  pixTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    padding: Spacing.sm,
  },
  pixTypeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.sm,
    backgroundColor: 'transparent',
  },
  pixTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  pixTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  pixTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  pixKeyInput: {
    fontSize: 16,
    color: Colors.text,
    padding: Spacing.lg,
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  pixKeyHelper: {
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
  },
  notesInput: {
    fontSize: 16,
    color: Colors.text,
    padding: Spacing.lg,
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.xs,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSubtle,
    textAlign: 'right',
  },
  saveButtonContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionButtonDisabled: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.6,
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.bgSoft,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  statementOptions: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statementText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statementButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.fieldBg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statementButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});