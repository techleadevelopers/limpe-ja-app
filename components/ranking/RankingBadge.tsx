// components/ranking/RankingBadge.tsx
// ================================================
import React from 'react';
import { View, Text, StyleSheet, useColorScheme, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Colors from '../../constants/Colors';

// Hook para acessar as cores do tema atual
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface RankingBadgeProps {
  type: 'TOP_NEIGHBORHOOD' | 'STREAK_10' | 'SLA_90';
  until?: string;
  style?: StyleProp<ViewStyle>; // Permite passar estilos para o container
  textStyle?: StyleProp<TextStyle>; // Permite passar estilos para o texto
}

export const RankingBadge: React.FC<RankingBadgeProps> = ({ type, until, style, textStyle }) => {
  const theme = useTheme(); // Obtém o tema atual

  const label =
    type === 'TOP_NEIGHBORHOOD'
      ? 'Top do bairro'
      : type === 'STREAK_10'
      ? '10 no mês'
      : 'SLA 90%';

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: theme.primaryLight, // Usando primaryLight para o fundo
          borderColor: theme.lightBlueBorder, // Usando lightBlueBorder para a borda
        },
        style,
      ]}
    >
      <Text style={[styles.starIcon, { color: theme.primary }, textStyle]}>★</Text>
      <Text style={[styles.labelText, { color: theme.primary }, textStyle]}>{label}</Text>
      {until ? (
        <Text style={[styles.untilText, { color: theme.textMuted }, textStyle]}>
          até {new Date(until).toLocaleDateString()}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999, // Para um formato de pílula
  },
  starIcon: {
    fontWeight: '800',
    marginRight: 6,
  },
  labelText: {
    fontWeight: '700',
  },
  untilText: {
    marginLeft: 6,
  },
});