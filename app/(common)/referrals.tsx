// app/(common)/referrals.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView, Alert } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import { colors } from '../../components/common/theme/colors';
import { typography } from '../../components/common/theme/typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Clipboard from '@react-native-clipboard/clipboard'; // Necessário instalar: npm install @react-native-clipboard/clipboard

// Mock de dados
const mockReferralData = {
  referralCode: 'CLEANAPP2025',
  totalReferrals: 5,
  successfulReferrals: 3,
  earnings: 'R$ 150,00',
  pendingEarnings: 'R$ 50,00',
  referredUsers: [
    { name: 'João Silva', status: 'Inscrito', date: '2024-06-01' },
    { name: 'Maria Souza', status: 'Primeiro Serviço Concluído', date: '2024-06-15' },
    { name: 'Pedro Santos', status: 'Inscrito', date: '2024-07-01' },
    { name: 'Ana Costa', status: 'Primeiro Serviço Concluído', date: '2024-07-10' },
    { name: 'Carlos Lima', status: 'Primeiro Serviço Concluído', date: '2024-07-25' },
  ],
  howItWorks: [
    'Compartilhe seu código de indicação único com amigos e familiares.',
    'Eles se registram no app usando seu código.',
    'Você ganha um bônus quando eles completam o primeiro serviço.',
    'Seus amigos também ganham um desconto no primeiro serviço!',
  ],
};

const ReferralsScreen: React.FC = () => {
  const { referralCode, totalReferrals, successfulReferrals, earnings, pendingEarnings, referredUsers, howItWorks } = mockReferralData;

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Use meu código de indicação ${referralCode} para ganhar um desconto no seu primeiro serviço de limpeza com o CleanApp! Baixe o app aqui: [Link para o App Store/Google Play]`,
        url: 'https://link.para.seu.app', // Substitua pelo link real do seu app
        title: 'Convite para o CleanApp!',
      });
    } catch (error: any) {
      Alert.alert('Erro ao Compartilhar', error.message);
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Código Copiado!', 'Seu código de indicação foi copiado para a área de transferência.');
  };

  return (
    <ScreenContainer>
      <Header title="Indique e Ganhe" showBackButton={true} />

      <Card style={styles.referralCodeCard}>
        <Text style={styles.sectionTitle}>Seu Código de Indicação</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.referralCodeText}>{referralCode}</Text>
          <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
            <Icon name="content-copy" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <PrimaryButton title="Compartilhar Código" onPress={handleShareCode} style={styles.shareButton} />
      </Card>

      <Card style={styles.statsCard}>
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
      </Card>

      <Card style={styles.howItWorksCard}>
        <Text style={styles.sectionTitle}>Como Funciona?</Text>
        {howItWorks.map((step, index) => (
          <View key={index} style={styles.howItWorksItem}>
            <Icon name="check-circle" size={20} color={colors.success} style={styles.howItWorksIcon} />
            <Text style={styles.howItWorksText}>{step}</Text>
          </View>
        ))}
      </Card>

      {referredUsers.length > 0 && (
        <Card style={styles.referredUsersCard}>
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
        </Card>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  referralCodeCard: {
    alignItems: 'center',
    marginBottom: 15,
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

import { Platform } from 'react-native'; // Importar Platform aqui
export default ReferralsScreen;