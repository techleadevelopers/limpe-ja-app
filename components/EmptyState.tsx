// components/ui/EmptyState.tsx
// ================================================
import React from 'react';
import { Text, StyleSheet, useColorScheme, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Card from '../components/common/Card'; // Certifique-se que Card.tsx exporta um componente Card real
import Button from '../components/common/Button'; // Certifique-se que Button.tsx exporta um componente Button real
import Colors from '../constants/Colors'; // Importa o objeto de cores

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  // Colors é um default export com chaves light/dark
  // Garante que o tipo retornado seja o de 'light' para consistência,
  // já que 'dark' terá as mesmas propriedades.
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>; // Permite passar estilos para o Card
  titleStyle?: StyleProp<TextStyle>; // Permite estilizar o título
  subtitleStyle?: StyleProp<TextStyle>; // Permite estilizar o subtítulo
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  ctaLabel,
  onPress,
  style,
  titleStyle,
  subtitleStyle,
}) => {
  const theme = useTheme(); // Obtém o tema atual

  return (
    <Card style={[styles.card, style]}> {/* Aplica estilos base e permite sobrescrever */}
      <Text style={[styles.title, { color: theme.text }, titleStyle]}>{title}</Text> {/* Acessando theme.text */}
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.textMuted }, subtitleStyle]}>{subtitle}</Text> // Acessando theme.textMuted
      ) : null}
      {/* REESCREVA ESTE BLOCO MANUALMENTE */}
      {ctaLabel && onPress ? (
        <Button title={ctaLabel} onPress={onPress} style={styles.button} />
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20, // Adicionado padding horizontal para melhor visualização em telas menores
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center', // Garante que o título esteja centralizado
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    marginTop: 10, // Espaçamento entre o subtítulo e o botão
    width: '100%', // Botão ocupa a largura total do card
  },
});
