// LimpeJaApp/app/(common)/loyalty.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card'; // Card ainda é usado para a seção de recompensas
import { colors } from '../../components/common/theme/colors'; // Cores ainda são usadas nos estilos locais
import { typography } from '../../components/common/theme/typography'; // Tipografia ainda é usada nos estilos locais

// Importa os novos componentes
import LoyaltySummaryCard from '../../components/common/loyalty/LoyaltySummaryCard';
import RewardItem from '../../components/common/loyalty/RewardItem';
import HowToEarnSection from '../../components/common/loyalty/HowToEarnSection';

// Define interfaces para a estrutura dos dados
interface Reward {
  id: string;
  name: string;
  points: number;
  description: string;
}

interface LoyaltyData {
  currentPoints: number;
  nextTierPoints: number;
  currentTier: string;
  nextTier: string;
  pointsEarnedThisMonth: number;
  rewardsAvailable: Reward[];
  howToEarn: string[];
}

// Mock de dados (mantido para a simulação, em um app real viria de uma API)
const mockLoyaltyData: LoyaltyData = {
  currentPoints: 750,
  nextTierPoints: 1000,
  currentTier: 'Bronze',
  nextTier: 'Prata',
  pointsEarnedThisMonth: 150,
  rewardsAvailable: [
    { id: '1', name: '10% de Desconto no Próximo Serviço', points: 500, description: 'Economize no seu próximo agendamento.' },
    { id: '2', name: 'Limpeza de Brinde (até 2h)', points: 1500, description: 'Uma limpeza básica gratuita para você.' },
    { id: '3', name: '50% de Desconto em Produtos', points: 800, description: 'Desconto em produtos de limpeza selecionados.' },
  ],
  howToEarn: [
    'A cada R$1 gasto em serviços, você ganha 1 ponto.',
    'Indique um amigo e ganhe 50 pontos quando ele completar o primeiro serviço.',
    'Complete pesquisas de satisfação e ganhe 10 pontos.',
    'Participe de eventos especiais e ganhe pontos extras.',
  ],
};

const LoyaltyScreen: React.FC = () => {
  // Usamos useState para permitir que os pontos e recompensas sejam atualizados (ex: após um resgate)
  const [loyaltyData, setLoyaltyData] = React.useState<LoyaltyData>(mockLoyaltyData);

  const handleRedeemReward = (rewardId: string) => {
    const rewardToRedeem = loyaltyData.rewardsAvailable.find(r => r.id === rewardId);
    if (rewardToRedeem) {
      if (loyaltyData.currentPoints >= rewardToRedeem.points) {
        Alert.alert(
          "Confirmar Resgate",
          `Deseja realmente resgatar "${rewardToRedeem.name}" por ${rewardToRedeem.points} pontos?`,
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Resgatar",
              onPress: () => {
                // Atualiza o estado: subtrai os pontos e remove a recompensa resgatada
                setLoyaltyData(prevData => ({
                  ...prevData,
                  currentPoints: prevData.currentPoints - rewardToRedeem.points,
                  rewardsAvailable: prevData.rewardsAvailable.filter(r => r.id !== rewardId),
                }));
                Alert.alert("Sucesso!", `Você resgatou "${rewardToRedeem.name}"!`);
                // Em um aplicativo real, aqui você faria uma chamada à API para processar o resgate no backend.
              }
            }
          ]
        );
      } else {
        Alert.alert("Pontos Insuficientes", "Você não tem pontos suficientes para resgatar esta recompensa.");
      }
    }
  };

  return (
    <ScreenContainer>
      <Header title="Programa de Fidelidade" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Componente para o resumo da fidelidade */}
        <LoyaltySummaryCard
          currentPoints={loyaltyData.currentPoints}
          nextTierPoints={loyaltyData.nextTierPoints}
          currentTier={loyaltyData.currentTier}
          nextTier={loyaltyData.nextTier}
          pointsEarnedThisMonth={loyaltyData.pointsEarnedThisMonth}
        />

        {/* Seção de Recompensas Disponíveis */}
        <Card style={styles.rewardsCard}>
          <Text style={styles.sectionTitle}>Recompensas Disponíveis</Text>
          {loyaltyData.rewardsAvailable.length > 0 ? (
            loyaltyData.rewardsAvailable.map((reward) => (
              <RewardItem
                key={reward.id}
                reward={reward}
                currentPoints={loyaltyData.currentPoints}
                onRedeem={handleRedeemReward}
              />
            ))
          ) : (
            <Text style={styles.noRewardsText}>Nenhuma recompensa disponível no momento.</Text>
          )}
        </Card>

        {/* Seção Como Ganhar Pontos */}
        <HowToEarnSection howToEarnRules={loyaltyData.howToEarn} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 20, // Adiciona um pouco de padding na parte inferior para rolagem
  },
  sectionTitle: { // Mantido aqui pois é usado em Card e HowToEarnSection
    ...typography.h3,
    marginBottom: 10,
    color: colors.textPrimary,
  },
  rewardsCard: {
    marginBottom: 15,
  },
  noRewardsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LoyaltyScreen;