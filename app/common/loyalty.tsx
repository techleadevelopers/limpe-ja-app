// LimpeJaApp/app/common/loyalty.tsx
import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Easing, Platform, ScrollView, StyleSheet, Text } from 'react-native'; // Adicionado 'Platform'
import Header from '../../components/common/Header';
import ScreenContainer from '../../components/common/ScreenContainer';
import { colors } from '../../components/common/theme/colors'; // Cores ainda são usadas nos estilos locais
import { typography } from '../../components/common/theme/typography'; // Tipografia ainda é usada nos estilos locais

// Importa os novos componentes
import HowToEarnSection from '../../components/common/loyalty/HowToEarnSection';
import LoyaltySummaryCard from '../../components/common/loyalty/LoyaltySummaryCard';
import RewardItem from '../../components/common/loyalty/RewardItem';

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

// Componente AnimatedCard para encapsular as seções e aplicar animações de entrada
const AnimatedCardWrapper: React.FC<{ children: React.ReactNode; style?: any; delay: number }> = ({ children, style, delay }) => {
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
        <AnimatedCardWrapper delay={0}>
          <LoyaltySummaryCard
            currentPoints={loyaltyData.currentPoints}
            nextTierPoints={loyaltyData.nextTierPoints}
            currentTier={loyaltyData.currentTier}
            nextTier={loyaltyData.nextTier}
            pointsEarnedThisMonth={loyaltyData.pointsEarnedThisMonth}
          />
        </AnimatedCardWrapper>

        {/* Seção de Recompensas Disponíveis */}
        <AnimatedCardWrapper style={styles.rewardsCard} delay={150}>
          <Text style={styles.sectionTitle}>Recompensas Disponíveis</Text>
          {loyaltyData.rewardsAvailable.length > 0 ? (
            loyaltyData.rewardsAvailable.map((reward, index) => (
              <RewardItem
                key={reward.id}
                reward={reward}
                currentPoints={loyaltyData.currentPoints}
                onRedeem={handleRedeemReward}
                delay={index * 50} // Atraso escalonado para cada recompensa
              />
            ))
          ) : (
            <Text style={styles.noRewardsText}>Nenhuma recompensa disponível no momento.</Text>
          )}
        </AnimatedCardWrapper>

        {/* Seção Como Ganhar Pontos */}
        <AnimatedCardWrapper delay={300}>
          <HowToEarnSection howToEarnRules={loyaltyData.howToEarn} />
        </AnimatedCardWrapper>
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
    backgroundColor: colors.cardBackground, // CORRIGIDO: de backgroundWhite para cardBackground
    borderRadius: 12, // Adicionado border radius
    padding: 20, // Adicionado padding
    ...Platform.select({ // Adicionado sombra
      ios: {
        shadowColor: colors.primaryLight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  noRewardsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LoyaltyScreen;
