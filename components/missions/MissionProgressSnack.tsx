// components/missions/MissionProgressSnack.tsx
// ================================================
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    Animated,
    Easing,
    LayoutChangeEvent,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';
import Colors from '../../constants/Colors';
import Button from '../common/Button';
import Card from '../common/Card';

// ---------- Theming ----------
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// ---------- Utils ----------
const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const formatBRL = (v: number) =>
  Number.isFinite(v) ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

export interface MissionProgressSnackProps {
  current: number;
  goal: number;
  onView: () => void;

  /** opcional: mostra economia prevista (ex.: 30% sobre R$120) */
  discountPercent?: number; // default 30
  estimatedPrice?: number;  // ex.: 120

  /** opcional: texto do botão (default: "Ver detalhes da missão") */
  ctaLabel?: string;
  /** opcional: título (default: "Progresso da missão") */
  title?: string;
}

const MissionProgressSnackComp: React.FC<MissionProgressSnackProps> = ({
  current: currentProp,
  goal: goalProp,
  onView,
  discountPercent = 30,
  estimatedPrice,
  ctaLabel = 'Ver detalhes da missão',
  title = 'Progresso da missão',
}) => {
  const theme = useTheme();

  // ----- Validações para evitar NaN -----
  const current = useMemo(() => Number.isFinite(currentProp) ? currentProp : 0, [currentProp]);
  const goal = useMemo(() => Math.max(1, Number.isFinite(goalProp) ? goalProp : 1), [goalProp]); // Mínimo 1 para evitar divisão por zero

  // ----- Derivados -----
  const pct = useMemo(() => clamp01(current / goal), [current, goal]);
  const remaining = Math.max(0, goal - current);
  const canClaimSoon = remaining <= 1 && remaining > 0;

  const discountedPrice = useMemo(() => {
    if (!estimatedPrice || !Number.isFinite(estimatedPrice)) return undefined;
    const v = +(estimatedPrice * (1 - discountPercent / 100)).toFixed(2);
    return { base: estimatedPrice, discount: discountPercent, final: v, save: estimatedPrice - v };
  }, [estimatedPrice, discountPercent]);

  // ----- Animações -----
  const widthAnim = useRef(new Animated.Value(0)).current; // 0..1 (percent)
  const shimmerAnim = useRef(new Animated.Value(0)).current; // 0..1 loop
  const sparkPulse = useRef(new Animated.Value(1)).current;  // scale pulso no ponto final

  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.linear),
        // width/position styles are used on this Animated.View; keep JS driver
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        // The spark view has static width/height; keep JS driver to avoid native-width error
        Animated.timing(sparkPulse, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(sparkPulse, { toValue: 1.0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, [pct, widthAnim, shimmerAnim, sparkPulse]);

  useEffect(() => {
    const percent = Math.round(pct * 100);
    AccessibilityInfo.announceForAccessibility?.(`Progresso da missão ${percent} por cento.`);
  }, [pct]);

  const onBarLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  const sparkTranslateX = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, barWidth - 14)],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, barWidth + 40],
  });

  const railColor = theme.border;
  const railBg = withAlpha(railColor, 0.55);
  const infoColor = theme.textMuted;

  // Gradiente azul: claro → médio → escuro
  const gradColors = ['#DBEAFE', '#3B82F6', '#1D4ED8']; // Azul claro, azul, azul escuro

  const percentValue = Math.round(pct * 100); // Garante número válido
  const percentText = Number.isFinite(percentValue) ? `${percentValue}%` : '0%';

  const plural = (n: number, s: string, p: string) => (Math.round(n) === 1 ? s : p); // Usa Math.round para evitar NaN em plural

  return (
    // -> testID no wrapper (Card não tipa testID)
    <View testID="mission-progress-snack">
      <Card style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
            {title}
          </Text>
          <Text style={[styles.counter, { color: infoColor }]}>{current}/{goal}</Text>
        </View>

        {/* Microcopy */}
        <Text style={[styles.subtitle, { color: infoColor }]}>
          {remaining === 0
            ? 'Pronto para resgatar 🎉'
            : `Faltam ${remaining} ${plural(remaining, 'ação', 'ações')} para liberar a recompensa`}
        </Text>

        {/* Barra */}
        <View
          style={[styles.barContainer, { backgroundColor: railBg }]}
          onLayout={onBarLayout}
          accessible
          accessibilityLabel={`Barra de progresso ${percentText}`}
        >
          <Animated.View
            style={[
              styles.fillMask,
              { width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          >
            <LinearGradient
              colors={gradColors}  // Gradiente azul: claro → médio → escuro
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
                backgroundColor: withAlpha('#FFFFFF', 0.25),
              },
            ]}
          />

          {barWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.spark,
                {
                  transform: [{ translateX: sparkTranslateX }, { scale: sparkPulse }],
                  backgroundColor: withAlpha('#FFFFFF', 0.85),
                  borderColor: withAlpha('#000000', 0.08),
                },
              ]}
            />
          )}
        </View>

        {/* Linha de detalhes */}
        <View style={styles.infoRow}>
          <Text style={[styles.percentText, { color: theme.text }]}>{percentText}</Text>
          {discountedPrice ? (
            <Text style={[styles.savingsText, { color: '#059669' }]}>
              Economize {formatBRL(discountedPrice.save)} ({discountedPrice.discount}% de {formatBRL(discountedPrice.base)})
            </Text>
          ) : (
            canClaimSoon && <Text style={[styles.soonText, { color: '#0A84FF' }]}>Falta muito pouco!</Text>
          )}
        </View>

        {/* CTA (sem accessibilityRole para bater com ButtonProps) */}
        <Button
          title={ctaLabel}
          onPress={onView}
          kind="ghost"
          style={styles.cta}
        />
      </Card>
    </View>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '800' },
  counter: { fontSize: 13, fontWeight: '600' },
  subtitle: { marginTop: 4, fontSize: 12 },

  barContainer: { height: 12, borderRadius: 999, overflow: 'hidden', marginTop: 10 },
  fillMask: { ...StyleSheet.absoluteFillObject, borderRadius: 999 },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 40, borderRadius: 999 },
  spark: {
    position: 'absolute', top: 1, width: 20, height: 20, borderRadius: 10,
    right: undefined,
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 0,
  },

  infoRow: { marginTop: 8, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  percentText: { fontSize: 14, fontWeight: '800' },
  savingsText: { fontSize: 12, fontWeight: '700' },
  soonText: { fontSize: 12, fontWeight: '700' },

  cta: { marginTop: 10 },
});

// manter compatibilidade com import nomeado e default
export const MissionProgressSnack = MissionProgressSnackComp;
export default MissionProgressSnackComp;
