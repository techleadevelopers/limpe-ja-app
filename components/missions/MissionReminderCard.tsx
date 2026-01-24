// components/missions/MissionReminderCard.tsx
// ================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  useColorScheme,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Card from '../common/Card';
import Button from '../common/Button';
import Chip from '../common/Chip';
import Colors from '../../constants/Colors';
import { useFadeSlideIn } from '../utils/useFadeSlideIn';
import { useReducedMotion } from '../utils/useReducedMotion';

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
function formatRemaining(deadlineISO: string) {
  const diff = new Date(deadlineISO).getTime() - Date.now();
  if (diff <= 0) return 'Expirou';
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `vence em ${d}d ${h}h`;
  if (h > 0) return `vence em ${h}h ${m}m`;
  return `vence em ${m}m`;
}

// ---------- Types ----------
export interface MissionReminderCardProps {
  missionId: string;
  title: string;
  deadlineAt: string;
  reward: { kind: 'COUPON' | 'POINTS'; value: number };
  onGo: () => void;
  onDismiss: () => void;
  /** Opcional: texto do CTA (default: "Ir agora") */
  ctaLabel?: string;
}

const MissionReminderCardComp: React.FC<MissionReminderCardProps> = ({
  missionId,
  title,
  deadlineAt,
  reward,
  onGo,
  onDismiss,
  ctaLabel = 'Ir agora',
}) => {
  const theme = useTheme();
  const reduced = useReducedMotion();

  // entrada e microanimações
  const { opacity, translateY } = useFadeSlideIn(true);
  const pulse = useRef(new Animated.Value(1)).current;
  const ribbonAnim = useRef(new Animated.Value(0)).current;

  // countdown
  const [remaining, setRemaining] = useState(() => formatRemaining(deadlineAt));
  useEffect(() => {
    const tick = () => setRemaining(formatRemaining(deadlineAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineAt]);

  // pulso do CTA
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.035, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);

  // brilho sutil na fita
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(ribbonAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.linear),
        // shimmer view uses width/background styles; keep JS driver
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, ribbonAnim]);

  // acessibilidade
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.('Missão pronta para resgatar. ' + title);
  }, [title]);

  const isCoupon = reward.kind === 'COUPON';
  const rewardLabel = isCoupon ? `Cupom R$${reward.value}` : `+${reward.value} pts`;

  const gradFrom = theme.primary;
  const gradTo = theme.accent || theme.primary;

  const shimmerTranslate = ribbonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 240],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Card style={styles.card}>
        {/* Fita superior em gradiente */}
        <View style={styles.ribbonWrap}>
          <LinearGradient colors={[gradFrom, gradTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ribbon}>
            <View style={styles.ribbonRow}>
              <Ionicons name="gift" size={14} color="#FFFFFF" />
              <Text style={styles.ribbonText}>Pronto para resgatar</Text>
            </View>
            {!reduced && (
              <Animated.View
                pointerEvents="none"
                style={[styles.ribbonShimmer, { transform: [{ translateX: shimmerTranslate }] }]}
              />
            )}
          </LinearGradient>
        </View>

        {/* Conteúdo principal */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {title}
            </Text>

            <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Dispensar">
              <Text style={[styles.dismiss, { color: theme.textMuted }]}>Agora não</Text>
            </Pressable>
          </View>

          <Text style={[styles.deadline, { color: theme.textMuted }]}>
            {remaining}
          </Text>

          <View style={styles.rewardRow}>
            <Chip label={rewardLabel} />
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Button title={ctaLabel} onPress={onGo} style={styles.ctaBtn} />
            </Animated.View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    paddingTop: 10, // espaço para a fita
  },
  ribbonWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 30,
  },
  ribbon: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  ribbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  ribbonShimmer: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 40,
    backgroundColor: withAlpha('#FFFFFF', 0.25),
    borderRadius: 8,
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: '800', flex: 1 },
  dismiss: { fontSize: 12, fontWeight: '700' },
  deadline: { marginTop: 4, fontSize: 12 },

  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  ctaBtn: {
    paddingHorizontal: 14,
  },
});

// manter compatibilidade com import nomeado e default
export const MissionReminderCard = MissionReminderCardComp;
export default MissionReminderCardComp;
