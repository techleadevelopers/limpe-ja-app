// LimpeJaApp/components/loyalty/HowToEarnSection.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../../common/Card'; // Importa o Card existente
import Icon from 'react-native-vector-icons/MaterialIcons'; // Importa o Icon existente
import { colors } from '../../common/theme/colors'; // Importa as cores existentes
import { typography } from '../../common/theme/typography'; // Importa a tipografia existente

interface HowToEarnSectionProps {
  howToEarnRules: string[];
}

const HowToEarnSection: React.FC<HowToEarnSectionProps> = ({ howToEarnRules }) => {
  return (
    <Card>
      <Text style={styles.sectionTitle}>Como Ganhar Pontos</Text>
      {howToEarnRules.map((rule, index) => (
        <View key={index} style={styles.howToEarnItem}>
          <Icon name="star" size={20} color={colors.primary} style={styles.howToEarnIcon} />
          <Text style={styles.howToEarnText}>{rule}</Text>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    ...typography.h3,
    marginBottom: 10,
    color: colors.textPrimary,
  },
  howToEarnItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  howToEarnIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  howToEarnText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default HowToEarnSection;