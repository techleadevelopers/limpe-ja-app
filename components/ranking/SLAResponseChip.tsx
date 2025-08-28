// components/ranking/SLAResponseChip.tsx
// ================================================
import React, { useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, useColorScheme, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useReducedMotion } from '../../components/utils/useReducedMotion'; // Certifique-se que este hook existe e funciona
import Colors from '../../constants/Colors';

// Hook para acessar as cores do tema atual
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface SLAResponseChipProps {
  rate: number;
  avgResponseMin: number;
  style?: StyleProp<ViewStyle>; // Permite passar estilos para o container
  textStyle?: StyleProp<TextStyle>; // Permite passar estilos para o texto
  // Novas propriedades para controlar as cores
  backgroundColor?: string;
  textColor?: string;
}

export const SLAResponseChip: React.FC<SLAResponseChipProps> = ({
  rate,
  avgResponseMin,
  style,
  textStyle,
  // Definindo valores padrão para as novas props, alinhando com o azul desejado
  backgroundColor = 'rgba(140, 0, 255, 0.15)', // Azul claro com transparência
  textColor = '#007BFF', // Azul vibrante
}) => {
  const reduced = useReducedMotion(); // Hook para verificar se o movimento deve ser reduzido
  const [breath] = useState(new Animated.Value(1));
  const theme = useTheme(); // Obtém o tema atual

  useEffect(() => {
    if (!reduced && rate >= 0.9) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breath, { toValue: 1.02, duration: 1400, useNativeDriver: true }),
          Animated.timing(breath, { toValue: 1.0, duration: 1400, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [rate, reduced, breath]);

  return (
    <Animated.View style={[{ transform: [{ scale: breath }] }, style]}>
      <View
        style={[
          styles.chipContainer,
          {
            backgroundColor: backgroundColor, // Usando a prop backgroundColor
            borderColor: `${textColor}55`, // Usando a prop textColor para a borda com transparência
          },
        ]}
      >
        <Text style={[styles.chipText, { color: textColor }, textStyle]}>
          {Math.round(rate * 100)}% resposta • {avgResponseMin} min
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999, // Para um formato de pílula
  },
  chipText: {
    fontWeight: '600',
  },
});