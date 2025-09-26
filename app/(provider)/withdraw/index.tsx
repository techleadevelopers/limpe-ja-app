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
// ✅ Importar a tipagem correta
import { RequestWithdrawalDto, PixKeyType } from '../../../types/backend/payments';


// 🔗 Importar serviços reais
import { requestWithdrawal } from '../../../services/paymentService';
import api from '../../../services/api';



// ===== Design Tokens (Premium UI) =====
const Colors = {
  primary: 'rgba(0,122,255,0.9)',
  primaryDark: 'rgba(0,122,255,0.7)',
  link: '#007AFF',
  bgSoft: '#E3F2FD',
  surface: '#FFFFFF',
  border: '#E9ECEF',
  fieldBg: '#F8F9FA',
  text: '#212529',
  textMuted: '#6C757D',
  textSubtle: '#868E96',
  danger: '#D32F2F',
  success: '#2E7D32',
  shadow: 'rgba(0,122,255,0.3)',
};

const Radii = { xl: 20, pill: 25, sm: 10 };
const Spacing = { xs: 6, sm: 10, md: 15, lg: 20, xl: 28 };

const easeOut = Easing.out(Easing.ease);

// Helper para formatar moeda (ex: R$ 1.234,56)
const formatCurrency = (value: number) => {
  return `R$ ${value
    .toFixed(2)
    .replace('.', ',')
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
};

export default function WithdrawScreen() {
  const router = useRouter();

  const [amount, setAmount] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] =
    useState<boolean>(false);
  const [isWithdrawalSuccessful, setIsWithdrawalSuccessful] =
    useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Animated values for screen transitions
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
        const response = await api.get<{ balance: number }>(
          '/payments/balance'
        );
        if (isMounted.current) {
          setAvailableBalance(response.data.balance);
        }
      } catch (err) {
        console.error('Erro ao buscar saldo:', err);
        if (isMounted.current) {
          Alert.alert('Erro', 'Não foi possível carregar o saldo.');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          // Armazenar a referência da animação composta
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

  const handleConfirmWithdrawal = async () => {
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Por favor, insira um valor válido para saque.');
      return;
    }

    if (parsedAmount > availableBalance) {
      setFormError('O valor do saque excede o saldo disponível.');
      return;
    }

    const pixData: RequestWithdrawalDto = {
      amount: parsedAmount,
      pixKeyType: PixKeyType.CPF,
      pixKey: '123.456.789-00', // TODO: trocar para chave real
    };

    if (isMounted.current) {
      setIsProcessingWithdrawal(true);
      setFormError(null);
    }

    try {
      await requestWithdrawal(pixData);

      if (isMounted.current) {
        setIsWithdrawalSuccessful(true);
        setAvailableBalance((prev) => prev - parsedAmount);
        Alert.alert(
          'Sucesso',
          `Saque de ${formatCurrency(parsedAmount)} solicitado com sucesso!`
        );
      }
    } catch (error: any) {
      console.error('Erro ao solicitar saque:', error);
      if (isMounted.current) {
        Alert.alert(
          'Erro',
          error?.message || 'Não foi possível processar o saque. Tente novamente.'
        );
        setIsWithdrawalSuccessful(false);
      }
    } finally {
      if (isMounted.current) {
        setIsProcessingWithdrawal(false);
      }
    }
  };

  const handleReceiveStatement = (type: 'email' | 'download') => {
    Alert.alert(
      'Funcionalidade em desenvolvimento',
      `Gerar extrato via ${type === 'email' ? 'e-mail' : 'download'}.`
    );
  };

  const handleSkipStatement = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando saldo...</Text>
      </View>
    );
  }

  if (isWithdrawalSuccessful) {
    return (
      <View style={styles.outerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View
          style={[
            styles.successContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={100}
            color={Colors.success}
          />
          <Text style={styles.successTitle}>Saque Solicitado!</Text>
          <Text style={styles.successMessage}>
            Seu pedido de saque foi enviado com sucesso e está aguardando
            processamento.
          </Text>

          <View style={styles.statementOptions}>
            <Text style={styles.statementText}>Receber extrato via:</Text>
            <View style={styles.statementButtons}>
              <TouchableOpacity
                style={styles.statementButton}
                onPress={() => handleReceiveStatement('email')}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.statementButtonText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statementButton}
                onPress={() => handleReceiveStatement('download')}
              >
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.statementButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButtonPrimary}
            onPress={handleSkipStatement}
          >
            <Text style={styles.actionButtonPrimaryText}>
              Voltar para Ganhos
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const isConfirmButtonEnabled =
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= availableBalance &&
    !isProcessingWithdrawal;

  return (
    <KeyboardAvoidingView
      style={styles.outerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />

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
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar Saque</Text>
        <View style={styles.headerActionIconPlaceholder} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Valor do Saque</Text>
          <TextInput
            style={[styles.amountInput, formError ? styles.inputError : {}]}
            placeholder="R$ 0,00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={handleAmountChange}
            autoFocus
          />
          <Text style={styles.availableBalanceText}>
            Saldo Disponível:{' '}
            <Text style={{ color: Colors.primary }}>
              {formatCurrency(availableBalance)}
            </Text>
          </Text>
          {!!formError && (
            <Text style={styles.formErrorText}>{formError}</Text>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Sacar Para</Text>
          <TouchableOpacity style={styles.accountOption}>
            <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>Conta PIX Principal</Text>
              <Text style={styles.accountDetails}>CPF: ***.***.***-00</Text>
            </View>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBeneficiaryButton}>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.addBeneficiaryButtonText}>
              Adicionar Nova Conta PIX
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.saveButtonContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButtonPrimary,
              !isConfirmButtonEnabled && styles.actionButtonDisabled,
            ]}
            onPress={handleConfirmWithdrawal}
            disabled={!isConfirmButtonEnabled || isProcessingWithdrawal}
          >
            {isProcessingWithdrawal ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonPrimaryText}>
                Confirmar Saque
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  scrollViewContent: {
    paddingBottom: 40,
    paddingHorizontal: 15,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgSoft,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.textMuted,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIconPlaceholder: {
    width: 24,
    marginLeft: 15,
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
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  availableBalanceText: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
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
    borderRadius: Radii.sm,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  accountInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  accountDetails: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  addBeneficiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.fieldBg,
    marginTop: Spacing.sm,
  },
  addBeneficiaryButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: Spacing.xs,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 25,
    alignItems: 'center',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  actionButtonDisabled: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.6,
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonContainer: {
    marginTop: Spacing.lg,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.bgSoft,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statementButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
});