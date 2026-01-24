// components/ui/KPIValue.tsx
// ================================================
import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, useColorScheme, StyleProp, TextStyle } from 'react-native';
import Colors from '../constants/Colors'; // Importa o objeto de cores

// Assumindo que useReducedMotion é um hook que você tem em outro lugar,
// por exemplo, em components/utils/useReducedMotion.ts
// Se você não o tem, precisará criá-lo ou remover a lógica de reduced motion.
// Exemplo simples de useReducedMotion (se não existir):
// const useReducedMotion = () => false; // Ou implemente a lógica real

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface KPIValueProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number; // Duração da animação em milissegundos
  style?: StyleProp<TextStyle>; // Usando StyleProp<TextStyle> para melhor tipagem
}

// Valor padrão para a duração da animação se Motion.dur.xl não estiver definido
// ou se você não tiver uma biblioteca Motion global.
// 500ms é um bom ponto de partida para animações de contagem.
const DEFAULT_ANIMATION_DURATION = 500;

export const KPIValue: React.FC<KPIValueProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = DEFAULT_ANIMATION_DURATION, // Usando o valor padrão
  style,
}) => {
  // Se useReducedMotion não estiver disponível, comente ou remova esta linha
  // e a lógica relacionada.
  // const reduced = useReducedMotion();
  const reduced = false; // Temporariamente definido como false se o hook não existir

  const [display, setDisplay] = useState(0);
  const displayRef = useRef(display);
  const theme = useTheme(); // Obtém o tema atual

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      displayRef.current = value;
      return;
    }

    const start = Date.now();
    const from = displayRef.current;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // Função de easing (easeOutCubic)
      const next = from + (value - from) * eased;
      displayRef.current = next;
      setDisplay(next);

      if (t < 1) {
        requestAnimationFrame(tick);
      }
    };
    tick();
  }, [value, duration, reduced]); // Dependências do useEffect

  return (
    <Text style={[styles.kpiText, { color: theme.text }, style]}>
      {prefix}
      {display.toFixed(0)} {/* Mantido toFixed(0) conforme original, para inteiros */}
      {suffix}
    </Text>
  );
};

const styles = StyleSheet.create({
  kpiText: {
    fontSize: 24,
    fontWeight: '800',
    // A cor será definida dinamicamente pelo `theme.text`
  },
});
