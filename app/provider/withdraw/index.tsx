import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; // Import para haptics premium (iOS/Android)
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Para alinhamento robusto do header (iOS notch/status bar)

// ✅ Importar a tipagem correta
import { PixKeyType, RequestWithdrawalDto } from '../../../types/backend/payments';

// 🔗 Importar serviços reais
import { api } from '../../../services/api';
import NotificationUIService from '../../../services/notificationUIService'; // Para toasts premium
import { requestWithdrawal } from '../../../services/paymentService';
import { setSafeError, toastUserError } from '../../_shared/errors/uiFeedback';

// ===== Design Tokens (Premium UI - Clean, iOS/Android consistente) =====
const Colors = {
  primary: '#4A90E2', // Azul premium consistente com o app
  primaryDark: '#357ABD',
  link: '#4A90E2',
  bgSoft: '#F6F8FB', // Fundo suave premium (alinhado com mensagens/menu)
  surface: '#FFFFFF',
  border: '#E9ECEF', // Subtil para iOS, clean no Android
  fieldBg: '#F8F9FA',
  text: '#4A5568', // Cinza escuro premium para títulos (preto mais claro)
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
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
  const [formError, setFormError] = useState<string | null>(null); // Erros de submissão/API
  const [amountError, setAmountError] = useState<string | null>(null);
  const [pixKeyError, setPixKeyError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>(''); // Notas opcionais

  // Taxa fixa em R$ 0,00 (conforme instruções; ajuste se backend retornar taxa dinâmica)
  const taxa = 0;

  // Animated values for premium transitions (fade + slide)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Adicionado ref para verificar se o componente está montado
  const isMounted = useRef(true);
  // Ref para armazenar a animação composta (evita recriação desnecessária)
  const initialAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  // Flag para evitar múltiplas animações
  const hasAnimated = useRef(false);

  // Função para iniciar animação (useCallback para evitar recriações)
  const startEntranceAnimation = useCallback(() => {
    if (hasAnimated.current || !isMounted.current) return;

    hasAnimated.current = true;
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
    initialAnimationRef.current?.start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    isMounted.current = true; // Componente montado

    const fetchBalance = async () => {
      if (isMounted.current) {
        setIsLoading(true);
      }
      try {
        // Backend endpoint para saldo (ajuste se necessário, integrado ao payments)
        // CORREÇÃO: Tipagem expandida para incluir 'earnings' opcional (caso backend retorne mais campos)
        // Garantia de que response.data existe
        const response = await api.get<{ available?: number; balance?: number; earnings?: number } | null>('/payouts/balance');
        if (isMounted.current) {
          const data = response?.data || {};
          // CORREÇÃO: Usa 'available' ou 'balance' com fallback seguro (evita NaN ou undefined)
          const available = data.available ?? data.balance ?? data.earnings ?? 0;
          setAvailableBalance(Number(available) || 0);
          // Announce for accessibility quando saldo carrega (comentado para evitar issues; implemente se necessário)
          // AccessibilityInfo.announceForAccessibility(`Saldo disponível: ${formatCurrency(available)}`);
        }
      } catch (err: any) {
        console.error('Erro ao buscar saldo:', err);
        if (isMounted.current) {
          NotificationUIService.showError('Não foi possível carregar o saldo. Tente novamente.', 'Erro de Saldo');
          setAvailableBalance(0); // Fallback para 0 em erro
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          // Inicia animação apenas uma vez, após loading
          startEntranceAnimation();
        }
      }
    };
    fetchBalance();

    return () => {
      isMounted.current = false; // Componente desmontado
      // Parar a animação se ela estiver em andamento
      initialAnimationRef.current?.stop();
      hasAnimated.current = false; // Reset para possíveis remounts
    };
  }, [startEntranceAnimation]); // Dependência no callback memoizado

  // REMOVIDO: useEffect desnecessário de accessibility que poderia causar re-renders excessivos
  // (estava vazio e dependia de isConfirmButtonEnabled, que muda com states, potencial loop)

  const handleAmountChange = (text: string) => {
    // Evita loops: só atualiza se o texto mudou de fato
    const cleanedText = text.replace(/[^0-9.,]/g, '');
    const formattedText = cleanedText.replace(',', '.');
    const parts = formattedText.split('.');
    let newAmount = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : formattedText;
    
    // Evita setState desnecessário se igual
    if (newAmount !== amount) {
      setAmount(newAmount);
    }
    setAmountError(null);
    setFormError(null);
  };

  const handlePixKeyChange = (text: string) => {
    let cleanedText = text;
    switch (pixKeyType) {
      case PixKeyType.CPF:
      case PixKeyType.CNPJ:
      case PixKeyType.RANDOM:
        cleanedText = text.replace(/\D/g, ''); // Apenas dígitos para CPF/CNPJ/RANDOM
        break;
      case PixKeyType.EMAIL:
        cleanedText = text; // Permitir todos para email
        break;
      case PixKeyType.PHONE:
        cleanedText = text.replace(/[^\d+\s()-]/g, ''); // Permitir dígitos, +, espaço, -, ( )
        break;
    }
    // Evita setState desnecessário se igual
    if (cleanedText !== pixKey) {
      setPixKey(cleanedText);
    }
    setPixKeyError(null);
    setFormError(null);
  };

  const handlePixKeyTypeChange = useCallback((type: PixKeyType) => {
    setPixKeyType(type);
    setPixKey(''); // Limpa chave ao trocar tipo
    setPixKeyError(null);
    setFormError(null);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []); // Memoizado para evitar recriações

  // Função para chips de atalho (memoizada)
  const handleAmountShortcut = useCallback((percentage: number) => {
    const v = Math.max(10, Math.floor(availableBalance * percentage * 100) / 100); // Mínimo R$ 10
    Haptics.selectionAsync();
    const formatted = String(v).replace('.', ',');
    if (formatted !== amount) {
      setAmount(formatted);
    }
    setAmountError(null);
    setFormError(null);
  }, [availableBalance, amount]); // Dependências corretas

  const validateForm = useCallback((): boolean => {
    setAmountError(null);
    setPixKeyError(null);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      setAmountError('Insira um valor válido (mínimo R$ 10,00)');
      return false;
    }
    if (parsedAmount > availableBalance) {
      setAmountError(`O valor do saque excede o saldo disponível (${formatCurrency(availableBalance)}).`);
      return false;
    }
    if (!pixKey.trim()) {
      setPixKeyError('Por favor, insira uma chave PIX válida.');
      return false;
    }
    switch (pixKeyType) {
      case PixKeyType.CPF:
        if (!/^\d{11}$/.test(pixKey) || !isValidCPF(pixKey)) {
          setPixKeyError('CPF inválido (apenas números).');
          return false;
        }
        break;
      case PixKeyType.CNPJ:
        if (!/^\d{14}$/.test(pixKey)) {
          setPixKeyError('CNPJ inválido. Digite apenas números (ex: 12345678000199).');
          return false;
        }
        break;
      case PixKeyType.EMAIL:
        if (!/^\S+@\S+\.\S+$/.test(pixKey)) {
          setPixKeyError('E-mail inválido.');
          return false;
        }
        break;
      case PixKeyType.PHONE:
        // Aceita formatos com ou sem +55, com ou sem parênteses no DDD, com espaço opcional e com ou sem hífen
        if (!/^(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?(?:\d{4,5}-?\d{4})$/.test(pixKey)) {
          setPixKeyError('Telefone inválido (ex: +55 11 99999-9999).');
          return false;
        }
        break;
      case PixKeyType.RANDOM:
        if (pixKey.length < 32 || pixKey.length > 77) {
          setPixKeyError('Chave aleatória inválida (UUID ou chave gerada pelo banco).');
          return false;
        }
        break;
    }
    return true;
  }, [amount, availableBalance, pixKey, pixKeyType]);

  const handleConfirmWithdrawal = useCallback(async () => {
    setFormError(null);
    const isValid = validateForm();
    if (!isValid) {
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
        setAvailableBalance((prev) => Math.max(0, prev - pixData.amount)); // Atualiza saldo local com Math.max para evitar negativos
        NotificationUIService.showSuccess(`Saque de ${formatCurrency(pixData.amount)} solicitado com sucesso! O valor será processado em até 24h.`, 'Saque Enviado');
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Haptic premium para sucesso (iOS)
        }
      }
      } catch (error: any) {
        console.error('Erro ao solicitar saque:', error);
        if (isMounted.current) {
          setSafeError(setFormError, error);
          toastUserError(error, 'Erro no Saque');
          if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Haptic para erro
          }
        }
      } finally {
      if (isMounted.current) {
        setIsProcessingWithdrawal(false);
      }
    }
  }, [amount, pixKeyType, pixKey, notes, validateForm]); // Dependências corretas para memoização

  const handleViewEarnings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Haptic sutil
    }
    router.push('/earnings'); // Assumindo rota para Earnings; ajuste conforme sua estrutura expo-router
  }, [router]);

  const handleDownloadReceipt = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Haptic sutil
    }
    // Implementar download quando disponível
    Alert.alert('Comprovante', 'Funcionalidade de download em desenvolvimento.', [{ text: 'OK' }]);
  }, []);

  const handleViewServices = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/services'); // Assumindo rota para Meus Serviços/Avaliações; ajuste conforme necessário
  }, [router]);

  const handleSkipStatement = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  if (isLoading) {
    return (
      <View style={[styles.centeredContainer, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando saldo disponível...</Text>
      </View>
    );
  }

  // Estado saldo zero (empty state)
  if (availableBalance === 0) {
    return (
      <KeyboardAvoidingView style={styles.outerContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View
          style={[
            styles.emptyStateContainer,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }] 
            },
          ]}
        >
          <Ionicons name="wallet-outline" size={100} color={Colors.textMuted} />
          <Text style={styles.emptyStateTitle}>Você ainda não tem saldo disponível</Text>
          <Text style={styles.emptyStateMessage}>Ganhe mais realizando serviços e avaliações.</Text>
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={handleViewServices}
            accessibilityRole="button"
            accessibilityLabel="Ver como ganhar mais"
            accessibilityHint="Navegue para Meus Serviços para ganhar saldo."
          >
            <Text style={styles.actionButtonSecondaryText}>Ver como ganhar mais</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
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
          <Text style={styles.successTitle}>Seu saque foi solicitado com sucesso.</Text>
          <Text style={styles.successMessage}>Transferência até 24h.</Text>

          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.successCtaButton}
              onPress={handleViewEarnings}
              accessibilityRole="button"
              accessibilityLabel="Ver extrato de ganhos"
              accessibilityHint="Navegue para a tela de ganhos."
            >
              <Ionicons name="trending-up-outline" size={20} color={Colors.primary} />
              <Text style={styles.successCtaText}>Ver extrato de ganhos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successCtaButton}
              onPress={handleDownloadReceipt}
              accessibilityRole="button"
              accessibilityLabel="Baixar comprovante"
              accessibilityHint="Baixe o comprovante do saque."
            >
              <Ionicons name="download-outline" size={20} color={Colors.primary} />
              <Text style={styles.successCtaText}>Baixar comprovante</Text>
            </TouchableOpacity>
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

  const parsedAmount = parseFloat((amount || '0').replace(',', '.'));
  const netAmount = Math.max(0, parsedAmount - taxa);
  const isConfirmButtonEnabled = !isNaN(parsedAmount) && parsedAmount >= 10 && parsedAmount <= availableBalance && !!pixKey.trim() && !isProcessingWithdrawal;

  return (
    <KeyboardAvoidingView
      style={styles.outerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 100 : 0} // Robust offset com insets
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Robusto (Premium: Branco clean, alinhado com SafeArea no iOS, fixo no Android) */}
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
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar Saque</Text>
        <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para balanceamento */}
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        {/* Hero: resumo do saque e status rápido */}
        <Animated.View
          style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.heroTopRow}>
            <Text style={styles.heroEyebrow}>Solicitar Saque</Text>
            <View style={styles.heroPill}>
              <Ionicons name="flash-outline" size={14} color={Colors.primary} />
              <Text style={[styles.heroPillText, styles.heroInlineText]}>Liquidação até 24h</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{formatCurrency(availableBalance)}</Text>
          <Text style={styles.heroSubtitle}>Disponível para saque</Text>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
              <Text style={[styles.heroBadgeText, styles.heroInlineText]}>Taxa {formatCurrency(taxa)}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
              <Text style={[styles.heroBadgeText, styles.heroInlineText]}>Fluxo seguro</Text>
            </View>
          </View>
        </Animated.View>

        {/* Card: Valor do Saque com atalhos */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Quanto deseja transferir?</Text>
          <TextInput
            style={[styles.amountInput, amountError ? styles.inputError : {}]}
            placeholder="0,00"
            placeholderTextColor={Colors.textSubtle}
            keyboardType="decimal-pad" // Premium: Teclado numérico com vírgula (iOS/Android)
            value={amount}
            onChangeText={handleAmountChange}
            autoFocus
            accessibilityLabel="Valor do saque"
            accessibilityHint="Digite o valor em reais para sacar."
          />
          {amountError && <Text style={styles.formErrorText}>{amountError}</Text>}

          {/* Atalhos de valor (chips) */}
          <View style={styles.shortcutsContainer}>
            {([0.25, 0.5, 0.75, 1] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={styles.shortcutChip}
                onPress={() => handleAmountShortcut(p)}
                accessibilityRole="button"
                accessibilityLabel={`Sacar ${p*100}% do saldo`}
                accessibilityHint={`Preenche o valor com ${p*100}% do saldo disponível.`}
              >
                <Text style={styles.shortcutText}>{`${p*100}%`}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Linha de confirmação: Você receberá + Taxa */}
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Você receberá</Text>
            <Text style={styles.confirmationValue}>{formatCurrency(netAmount)}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Taxa</Text>
            <Text style={styles.confirmationValue}>{formatCurrency(taxa)}</Text>
          </View>
        </Animated.View>

        {/* Card: Chave PIX com selector de ícones */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Para qual chave PIX?</Text>
          <View style={styles.pixTypeSelector}>
            {([
              { type: PixKeyType.CPF, icon: 'id-card-outline' as React.ComponentProps<typeof Ionicons>['name'], subtitle: '11 dígitos', hint: 'apenas números' },
              { type: PixKeyType.CNPJ, icon: 'briefcase-outline' as React.ComponentProps<typeof Ionicons>['name'], subtitle: '14 dígitos', hint: 'apenas números' },
              { type: PixKeyType.EMAIL, icon: 'mail-outline' as React.ComponentProps<typeof Ionicons>['name'], subtitle: 'exemplo@domínio', hint: 'formato de e-mail' },
              { type: PixKeyType.PHONE, icon: 'call-outline' as React.ComponentProps<typeof Ionicons>['name'], subtitle: '+55 11 99999-9999', hint: 'formato de telefone' },
              { type: PixKeyType.RANDOM, icon: 'key-outline' as React.ComponentProps<typeof Ionicons>['name'], subtitle: 'chave UUID', hint: 'chave aleatória' },
            ] as { type: PixKeyType; icon: React.ComponentProps<typeof Ionicons>['name']; subtitle: string; hint: string }[]).map(({ type, icon, subtitle, hint }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pixTypeButton,
                  pixKeyType === type && styles.pixTypeButtonActive,
                ]}
                onPress={() => handlePixKeyTypeChange(type)}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar chave ${type.toLowerCase()}`}
                accessibilityHint={`Toque para usar chave do tipo ${type.toLowerCase()}. ${hint}`}
              >
                <View style={styles.pixTypeIconLabel}>
                  <Ionicons name={icon} size={16} color={pixKeyType === type ? '#fff' : Colors.textMuted} />
                  <Text style={[
                    styles.pixTypeButtonText,
                    pixKeyType === type && styles.pixTypeButtonTextActive,
                  ]}>
                    {type}
                  </Text>
                </View>
                <Text style={[
                  styles.pixTypeSubtitle,
                  pixKeyType === type && { color: '#fff' }
                ]}>
                  {subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.pixKeyInput, pixKeyError ? styles.inputError : {}]}
            placeholder={
              pixKeyType === PixKeyType.CPF ? "12345678900" :
              pixKeyType === PixKeyType.CNPJ ? "12345678000199" :
              pixKeyType === PixKeyType.EMAIL ? "seu@email.com" :
              pixKeyType === PixKeyType.PHONE ? "+55 11 99999-9999" :
              "Digite a chave PIX"
            }
            placeholderTextColor={Colors.textSubtle}
            value={pixKey}
            onChangeText={handlePixKeyChange}
            keyboardType={
              pixKeyType === PixKeyType.CPF || pixKeyType === PixKeyType.CNPJ ? "number-pad" :
              pixKeyType === PixKeyType.EMAIL ? "email-address" :
              pixKeyType === PixKeyType.PHONE ? "phone-pad" :
              "default"
            }
            autoCapitalize="none"
            accessibilityLabel="Chave PIX"
            accessibilityHint={`Digite a chave PIX do tipo ${pixKeyType.toLowerCase()}.`}
          />
          <Text style={styles.pixKeyHelper}>
            {pixKeyError ||
              (pixKeyType === PixKeyType.CPF && pixKey.length === 11 && !isValidCPF(pixKey) && 'CPF inválido. Verifique os dígitos.') ||
              (pixKeyType === PixKeyType.CPF && pixKey.length < 11 && pixKey.length > 0 && 'Digite o CPF completo (11 dígitos).') ||
              ''}
          </Text>
        </Animated.View>

        {/* Card: Notas Opcionais (Premium: Opcional com limite de chars) */}
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.cardTitle}>Observações (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ex: Saque para despesas operacionais..."
            placeholderTextColor={Colors.textSubtle}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={200}
            // CORREÇÃO: Removida prop 'characterCount' (não existe no TextInput do RN)
            accessibilityLabel="Observações do saque"
            accessibilityHint="Adicione notas opcionais para o saque (máx. 200 caracteres)."
          />
          <Text style={styles.charCount}>{notes.length}/200</Text>
        </Animated.View>

        <View style={{ height: 100 }} /> {/* Respiro para botão sticky */}
      </ScrollView>

      {/* Botão Confirmar Saque (Sticky no rodapé) */}
      <View style={[
        styles.stickyButtonContainer,
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 12 : 12 }
      ]}>
        {formError && (
          <Text style={[styles.formErrorText, { marginBottom: Spacing.sm, textAlign: 'center' }]}>
            {formError}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.actionButtonPrimary,
            (!isConfirmButtonEnabled || isProcessingWithdrawal) && styles.actionButtonDisabled,
          ]}
          onPress={handleConfirmWithdrawal}
          disabled={!isConfirmButtonEnabled || isProcessingWithdrawal}
          accessibilityRole="button"
          accessibilityLabel={`Sacar ${formatCurrency(parsedAmount)} agora`}
          accessibilityHint="Toque para confirmar e processar o saque."
          accessibilityState={{ disabled: !isConfirmButtonEnabled || isProcessingWithdrawal }}
        >
          {isProcessingWithdrawal ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionButtonPrimaryText}>
              Sacar {formatCurrency(parsedAmount)} agora
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  // Header Robusto (Alinhado com SafeArea no iOS, fixo no Android) - Branco premium
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface, // Branco clean
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  headerBackButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18, // Tamanho premium legível
    fontWeight: '700', // Bold para ênfase
    color: Colors.text, // Cinza escuro premium
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.8, // Espaçamento refinado para conforto
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
        elevation: 0,
      },
    }),
  },
  heroCard: {
    backgroundColor: '#EAF2FF',
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  heroEyebrow: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  heroPillText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  heroInlineText: {
    marginLeft: 6,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroBadgeText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  // Estilos para Card de Saldo (Estado Financeiro)
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  balanceSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  balanceBadge: {
    backgroundColor: Colors.fieldBg,
    padding: Spacing.sm,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  balanceBadgeText: {
    fontSize: 12,
    color: Colors.textSubtle,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  // Estilos para atalhos (chips)
  shortcutsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  shortcutChip: {
    backgroundColor: Colors.fieldBg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 48, // Garantir área de toque >=48dp
  },
  shortcutText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Estilos para linhas de confirmação
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  confirmationLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.bgSoft,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  actionButtonSecondaryText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  pixTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    backgroundColor: Colors.fieldBg,
    borderRadius: Radii.pill,
    padding: Spacing.sm,
    flexWrap: 'wrap', // Para telas menores
  },
  pixTypeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.sm,
    backgroundColor: 'transparent',
    alignItems: 'center',
    minWidth: 60, // Garantir área de toque >=48dp
  },
  pixTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  pixTypeIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pixTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  pixTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  pixTypeSubtitle: {
    fontSize: 11,
    color: Colors.textSubtle,
    marginTop: 2,
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
  // Sticky Button Container
  stickyButtonContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: Colors.bgSoft, // Transição suave
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
        elevation: 0,
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
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  successCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.fieldBg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  successCtaText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});
