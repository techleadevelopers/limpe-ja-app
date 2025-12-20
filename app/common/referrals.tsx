import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView, Animated, Easing, Platform } from 'react-native'; // Adicionado 'Platform'
import ScreenContainer from '../../components/common/ScreenContainer';
import Header from '../../components/common/Header';
import PrimaryButton from '../../components/common/PrimaryButton';
import { colors } from '../../components/common/theme/colors';
import { typography } from '../../components/common/theme/typography';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import * as Haptics from 'expo-haptics';
import NotificationUIService from '../../services/notificationUIService';

type ReferredUser = { name: string; status: string; date: string };

const AnimatedCard: React.FC<{ children: React.ReactNode; style?: any; delay: number }> = ({ children, style, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim, delay]);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }]}>
      {children}
    </Animated.View>
  );
};

const ReferralsScreen: React.FC = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>(user?.referralCode || '');
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const howItWorks = [
    'Compartilhe seu código de indicação único com amigos e familiares.',
    'Eles se registram no app usando seu código.',
    'Você ganha um bônus quando eles completam o primeiro serviço.',
    'Seus amigos também ganham um desconto no primeiro serviço!',
  ];

  // Animação para o botão de compartilhar/copiar
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const onPressInButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 0.95, useNativeDriver: true }).start(); };
  const onPressOutButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

  useEffect(() => {
    (async () => {
      try {
        const { data: codeRes } = await api.get<{ referralCode: string }>('/referrals/me/code');
        if (codeRes?.referralCode) setReferralCode(codeRes.referralCode);
      } catch {
        // fallback silencioso
      }
      try {
        const { data } = await api.get<any[]>('/referrals/me');
        const list: ReferredUser[] = (data || []).map((r: any) => ({
          name: r?.referredUser?.fullName || r?.referredUserName || 'Indicado',
          status: r?.statusLabel || r?.status || 'Inscrito',
          date: r?.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
        }));
        setReferredUsers(list);
      } catch (e: any) {
        NotificationUIService.showError(e?.message || 'Não foi possível carregar suas indicações.', 'Erro');
      }
    })();
  }, [user?.referralCode]);

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Use meu código ${referralCode} para ganhar desconto no LimpeJá! Baixe o app: https://limpeja.app`,
        url: 'https://limpeja.app',
        title: 'Convite LimpeJá',
      });
    } catch (error: any) {
      NotificationUIService.showError(error?.message || 'Falha ao compartilhar.', 'Erro');
    }
  };

  const handleCopyCode = () => {
    Clipboard.setStringAsync(referralCode);
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    NotificationUIService.showSuccess('Código copiado, convide seus amigos!', 'Copiado');
  };

  return (
    <ScreenContainer>
      <Header title="Indique e Ganhe" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <AnimatedCard style={styles.referralCodeCard} delay={0}>
          <Text style={styles.sectionTitle}>Seu Código de Indicação</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.referralCodeText}>{referralCode}</Text>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={[styles.copyButton, { transform: [{ scale: buttonScaleAnim }] }]}
              onPressIn={() => onPressInButton(buttonScaleAnim)}
              onPressOut={() => onPressOutButton(buttonScaleAnim)}
            >
              <Icon name="content-copy" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <PrimaryButton
            title="Compartilhar Código"
            onPress={handleShareCode}
            style={styles.shareButton}
            onPressIn={() => onPressInButton(buttonScaleAnim)} // Reutiliza a animação
            onPressOut={() => onPressOutButton(buttonScaleAnim)} // Reutiliza a animação
          />
        </AnimatedCard>

        <AnimatedCard style={styles.statsCard} delay={150}>
          <Text style={styles.sectionTitle}>Seu Desempenho</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total de Indicações:</Text>
            <Text style={styles.statValue}>{totalReferrals}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Indicações Concluídas:</Text>
            <Text style={styles.statValue}>{successfulReferrals}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Ganhos Totais:</Text>
            <Text style={styles.statValue}>{earnings}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Ganhos Pendentes:</Text>
            <Text style={styles.statValue}>{pendingEarnings}</Text>
          </View>
        </AnimatedCard>

        <AnimatedCard style={styles.howItWorksCard} delay={300}>
          <Text style={styles.sectionTitle}>Como Funciona?</Text>
          {howItWorks.map((step, index) => (
            <View key={index} style={styles.howItWorksItem}>
              <Icon name="check-circle" size={20} color={colors.success} style={styles.howItWorksIcon} />
              <Text style={styles.howItWorksText}>{step}</Text>
            </View>
          ))}
        </AnimatedCard>

        {referredUsers.length > 0 && (
          <AnimatedCard style={styles.referredUsersCard} delay={450}>
            <Text style={styles.sectionTitle}>Usuários Indicados</Text>
            {referredUsers.map((user, index) => (
              <View key={index} style={styles.referredUserItem}>
                <Text style={styles.referredUserName}>{user.name}</Text>
                <Text style={[styles.referredUserStatus, styles[user.status.replace(/\s/g, '') as keyof typeof styles]]}>
                  {user.status}
                </Text>
                <Text style={styles.referredUserDate}>{user.date}</Text>
              </View>
            ))}
          </AnimatedCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 15,
  },
  referralCodeCard: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: colors.cardBackground, // Corrigido de backgroundWhite
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryLight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 10,
    color: colors.textPrimary,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLightest,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.borderPrimaryLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryLight,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  referralCodeText: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.primaryDark,
    flex: 1,
    textAlign: 'center',
  },
  copyButton: {
    marginLeft: 15,
    padding: 5,
  },
  shareButton: {
    width: '100%',
  },
  statsCard: {
    marginBottom: 15,
    backgroundColor: colors.cardBackground, // Corrigido de backgroundWhite
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryLight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 5,
  },
  statLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  statValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  howItWorksCard: {
    marginBottom: 15,
    backgroundColor: colors.cardBackground, // Corrigido de backgroundWhite
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryLight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  howItWorksIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  howItWorksText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  referredUsersCard: {
    marginBottom: 15,
    backgroundColor: colors.cardBackground, // Corrigido de backgroundWhite
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryLight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  referredUserItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  referredUserName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 2,
  },
  referredUserStatus: {
    ...typography.bodySmall,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    overflow: 'hidden',
    fontWeight: '700',
    flex: 1.5,
    textAlign: 'center',
  },
  Inscrito: {
    backgroundColor: colors.backgroundLightest,
    color: colors.textSecondary,
  },
  PrimeiroServiçoConcluído: {
    backgroundColor: colors.success,
    color: colors.textWhite,
  },
  referredUserDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
});

export default ReferralsScreen;
