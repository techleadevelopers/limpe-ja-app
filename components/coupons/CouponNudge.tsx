import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';

// seu card visual
import HtmlCouponCard from './HtmlCouponCard';

/** ---------- Tokens simples (opcional trocar por seu theme) ---------- */
const SHADOW = 'rgba(0,0,0,0.06)';

type Props = {
  // visual/negócio do cupom (passa para HtmlCouponCard)
  code: string;
  title: string;
  subtitle?: string;
  expiresAt?: string | null;
  logoUrl?: string;

  // comportamento
  delayMs?: number;             // default 3000
  throttleHours?: number;       // não mostrar de novo antes desse tempo (default 24h)
  showOnRoutes?: string[];      // default ['/(client)/explore']
  storageKey?: string;          // default `coupon_nudge_<code>`

  // callback quando o usuário tocar em "Usar agora" / side FAB
  onApply: (code: string) => void;
  /** pointerEvents do container (ex.: 'box-none' para não bloquear interações) */
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
};

/** helper: diferença em horas entre agora e um ISO string */
const hoursSince = (iso?: string | null) => {
  if (!iso) return Infinity;
  const then = new Date(iso).getTime();
  return (Date.now() - then) / (1000 * 60 * 60);
};

const CouponNudge: React.FC<Props> = ({
  code,
  title,
  subtitle,
  expiresAt,
  logoUrl,
  delayMs = 3000,
  throttleHours = 24,
  showOnRoutes = ['/(client)/explore'],
  storageKey,
  onApply,
  pointerEvents = 'box-none',
}) => {
  const key = storageKey || `coupon_nudge_${code}`;
  const pathname = usePathname();

  // visibilidade + animações
  const [visible, setVisible] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  const show = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const hide = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 20, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      cb?.();
    });
  }, [fade, slide]);

  // normaliza rota (remove /index do fim)
  const normalize = (p: string) => p.replace(/\/index$/, '');
  const onAllowedRoute = showOnRoutes
    .map(normalize)
    .some((r) => normalize(pathname || '') === r);
let timer: ReturnType<typeof setTimeout> | undefined;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const maybeShow = async () => {
      if (!onAllowedRoute) return;

      const [lastShown, dismissedAt, appliedAt] = await Promise.all([
        AsyncStorage.getItem(`${key}_lastShown`),
        AsyncStorage.getItem(`${key}_dismissedAt`),
        AsyncStorage.getItem(`${key}_appliedAt`),
      ]);

      // regras de exibição
      const alreadyApplied = !!appliedAt;
      const tooSoon = hoursSince(lastShown) < throttleHours;
      const recentlyDismissed = hoursSince(dismissedAt) < throttleHours;
      if (alreadyApplied || tooSoon || recentlyDismissed) return;

      timer = setTimeout(async () => {
        await AsyncStorage.setItem(`${key}_lastShown`, new Date().toISOString());
        show();
      }, delayMs);
    };

    maybeShow();
    return () => { if (timer) clearTimeout(timer); };
  }, [pathname, onAllowedRoute, delayMs, throttleHours, key, show]);

  const handleDismiss = async () => {
    hide(async () => {
      await AsyncStorage.setItem(`${key}_dismissedAt`, new Date().toISOString());
    });
  };

  const handleUse = async (coupon: string) => {
    hide(async () => {
      await AsyncStorage.setItem(`${key}_appliedAt`, new Date().toISOString());
      onApply(coupon);
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[styles.overlay, { opacity: fade, transform: [{ translateY: slide }] }]}
    >
      <View style={styles.inner}>
        <HtmlCouponCard
          code={code}
          title={title}
          subtitle={subtitle}
          expiresAt={expiresAt}
          logoUrl={logoUrl}
          onUseNow={handleUse}
          onDismiss={handleDismiss}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    zIndex: 50,
  },
  inner: {
    alignItems: 'center',
    ...Platform.select({
      ios:  { shadowColor: SHADOW, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
});

export default CouponNudge;
