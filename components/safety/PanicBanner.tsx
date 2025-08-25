// components/safety/PanicBanner.tsx
// ================================================
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Card from '../common/Card';
import Button from '../common/Button';
import Chip from '../common/Chip';
import Colors from '../../constants/Colors';
import { useReducedMotion } from '../utils/useReducedMotion';

// ---------- Theming ----------
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}
const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ---------- Types ----------
export interface PanicBannerProps {
  onPanic: () => void;
  status?: 'IDLE' | 'RECEIVED' | 'ACKED' | 'DISPATCHED' | 'CLOSED';
  loading?: boolean;
  title?: string;      // default: "Está se sentindo inseguro?"
  subtitle?: string;   // default: "Acione o botão de pânico. Nossa equipe irá atender imediatamente."
}

const PanicBanner: React.FC<PanicBannerProps> = ({
  onPanic,
  status = 'IDLE',
  loading = false,
  title = 'Está se sentindo inseguro?',
  subtitle = 'Acione o botão de pânico. Nossa equipe irá atender imediatamente.',
}) => {
  const theme = useTheme();
  const reduced = useReducedMotion();

  // Animações (tokens baseados no guia do projeto)
  const pulse = useRef(new Animated.Value(1)).current;          // CTA pulso
  const float1 = useRef(new Animated.Value(0)).current;         // ícone flutuante 1
  const float2 = useRef(new Animated.Value(0)).current;         // ícone flutuante 2
  const shimmer = useRef(new Animated.Value(0)).current;        // skeleton

  useEffect(() => {
    if (reduced) return;

    // pulso do CTA (1.5–2.5s loop)
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    // flutuação ícones (3–5s leve)
    const mkFloat = (v: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );

    pulseLoop.start();
    const f1 = mkFloat(float1, 2800);
    const f2 = mkFloat(float2, 3200);

    // shimmer skeleton (1.3–1.6s)
    const sh = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    );
    sh.start();

    return () => {
      pulseLoop.stop();
      f1.stop();
      f2.stop();
      sh.stop();
    };
  }, [reduced, pulse, float1, float2, shimmer]);

  const floatY1 = float1.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const floatY2 = float2.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-60, 260] });

  // Cores & superfícies
  const gradFrom = theme.primary;
  const gradTo = theme.accent || theme.primary;
  const cardBg = theme.cardBackground || '#FFFFFF';
  const muted = theme.textMuted || '#6B7280';

  // Mapeamento de status → chip
  const chipColor = ((): 'warning' | 'error' | undefined => {
    if (status === 'RECEIVED') return 'error';
    if (status === 'ACKED' || status === 'DISPATCHED') return 'warning';
    return undefined; // IDLE/CLOSED: oculta chip
  })();

  // CTA com press feedback
  const onPressIn = () => {
    if (reduced) return;
    Animated.spring(pulse, { toValue: 0.96, useNativeDriver: true, damping: 15, stiffness: 240 }).start();
  };
  const onPressOut = () => {
    if (reduced) return;
    Animated.spring(pulse, { toValue: 1.0, useNativeDriver: true, damping: 15, stiffness: 240 }).start();
  };

  // Skeleton (quando loading=true)
  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.skelHeader} />
        <View style={styles.skelLine} />
        <View style={[styles.skelLine, { width: '70%' }]} />
        <View style={styles.skelCtaRow}>
          <View style={styles.skelBtn} />
          <View style={styles.skelChip} />
        </View>

        {/* shimmer */}
        {!reduced && (
          <Animated.View pointerEvents="none" style={[styles.skelShimmer, { transform: [{ translateX: shimmerX }] }]} />
        )}
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: cardBg }]}>
      {/* faixa superior em gradiente */}
      <LinearGradient colors={[gradFrom, gradTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientTop}>
        <View style={styles.topRow}>
          <View style={styles.topIcon}>
            <Ionicons name="shield-checkmark" size={18} color="#FFF" />
          </View>
          <Text style={styles.topLabel}>Segurança</Text>
        </View>

        {/* ícones flutuantes decorativos */}
        {!reduced && (
          <>
            <Animated.View style={[styles.floatIcon, { right: 10, top: 6, transform: [{ translateY: floatY1 }] }]}>
              <Ionicons name="lock-closed" size={14} color={withAlpha('#FFFFFF', 0.9)} />
            </Animated.View>
            <Animated.View style={[styles.floatIcon, { right: 44, bottom: 6, transform: [{ translateY: floatY2 }] }]}>
              <Ionicons name="alert-circle" size={14} color={withAlpha('#FFFFFF', 0.9)} />
            </Animated.View>
          </>
        )}
      </LinearGradient>

      {/* conteúdo */}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.subtitle, { color: muted }]}>{subtitle}</Text>

        <View style={styles.footerRow}>
          {/* CTA SOS com pulso/press */}
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Button
              title="🚨 Pedir ajuda"
              onPress={onPanic}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            />
          </Animated.View>

          {/* Chip de status opcional */}
          {chipColor && <Chip label={status} color={chipColor} />}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },

  // Top gradient band
  gradientTop: {
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  topLabel: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },

  // Float icons
  floatIcon: {
    position: 'absolute',
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  body: { paddingHorizontal: 12, paddingVertical: 12 },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 4, fontSize: 13 },

  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Skeleton
  skelHeader: { height: 42, backgroundColor: '#F0F2F5' },
  skelLine: { marginTop: 12, height: 12, backgroundColor: '#F0F2F5', borderRadius: 8 },
  skelCtaRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skelBtn: { width: 140, height: 42, backgroundColor: '#F0F2F5', borderRadius: 10 },
  skelChip: { width: 88, height: 28, backgroundColor: '#F0F2F5', borderRadius: 999 },
  skelShimmer: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});

export default PanicBanner;
