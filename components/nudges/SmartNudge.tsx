import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';

const TOKENS = {
  white: '#FFF',
  bgAlt: '#F8F9FD',
  primary: '#007AFF',
  textDark: '#1A2538',
  textMuted: '#7A8599',
  border: 'rgba(0,0,0,0.08)',
  shadow: 'rgba(0,0,0,0.06)',
  radius: 16,
  pill: 999,
};

type SmartNudgeProps = {
  /** ID único p/ storage (ex.: 'secure_sos_setup' ou 'incentive_finish_jobs') */
  id: string;

  /** Título e mensagem */
  title: string;
  message?: string;

  /** Ação principal */
  actionLabel: string;
  onAction: () => void; // <-- Permanece sem argumentos, a função que a chama deve fechar sobre o 'code' se necessário

  /** Aparição suave */
  delayMs?: number;           // default 3000
  throttleHours?: number;     // default 24
  showOnRoutes?: string[];    // default ['/(client)/explore']
  bottomOffset?: number;      // default 20 (px) -- útil pra “empilhar” nudges

  /** Estilo/ícone */
  icon?: keyof typeof Ionicons.glyphMap; // default 'information-circle-outline'
  color?: string;             // cor do CTA/ícone (default primary)

  /** Namespace para chaves (opcional -- ajuda a separar famílias de nudges) */
  namespace?: 'security' | 'incentive' | 'generic' | 'provider_mission' | 'coupon'; // <-- TIPO 'provider_mission' e 'coupon' ADICIONADO AQUI

  /** Código associado ao nudge (opcional, para uso interno ou exibição) */
  code?: string; // <-- ADICIONADO: Propriedade 'code'

  /** pointerEvents para o container (ex: 'box-none' para não bloquear interações subjacentes) */
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only'; // <-- CORRIGIDO: Tipo literal específico do React Native (resolve erro TS)
};

const hoursSince = (iso?: string | null) => {
  if (!iso) return Infinity;
  const then = new Date(iso).getTime();
  const now = Date.now();
  return (now - then) / (1000 * 60 * 60);
};

const SmartNudge: React.FC<SmartNudgeProps> = ({
  id,
  title,
  message,
  actionLabel,
  onAction,
  delayMs = 3000,
  throttleHours = 24,
  showOnRoutes = ['/(client)/explore'],
  bottomOffset = 20,
  icon = 'information-circle-outline',
  color = TOKENS.primary,
  namespace = 'generic',
  code, // <-- ADICIONADO: Desestruturar a prop 'code'
  pointerEvents = 'box-none', // <-- CORRIGIDO: Fallback para valor literal válido ('box-none' é comum para nudges/overlays)
}) => {
  const pathname = usePathname();
  const keyBase = useMemo(() => `nudge:${namespace}:${id}`, [id, namespace]);

  const [visible, setVisible] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalize = (p: string) => p.replace(/\/index$/, '');
  const onAllowedRoute = showOnRoutes.map(normalize).some((r) => normalize(pathname || '') === r);

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

  useEffect(() => {
    let cancelled = false;

    const maybeShow = async () => {
      if (!onAllowedRoute) return;

      const [lastShown, dismissedAt, actedAt] = await Promise.all([
        AsyncStorage.getItem(`${keyBase}:lastShown`),
        AsyncStorage.getItem(`${keyBase}:dismissedAt`),
        AsyncStorage.getItem(`${keyBase}:actedAt`),
      ]);

      const alreadyActed = !!actedAt;
      const tooSoon = hoursSince(lastShown) < throttleHours;
      const recentlyDismissed = hoursSince(dismissedAt) < throttleHours;

      if (alreadyActed || tooSoon || recentlyDismissed) return;

      timerRef.current = setTimeout(async () => {
        if (cancelled) return;
        await AsyncStorage.setItem(`${keyBase}:lastShown`, new Date().toISOString());
        show();
      }, delayMs);
    };

    maybeShow();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onAllowedRoute, delayMs, throttleHours, keyBase, show]);

  const handleDismiss = async () => {
    hide(async () => {
      await AsyncStorage.setItem(`${keyBase}:dismissedAt`, new Date().toISOString());
    });
  };

  const handleAction = async () => {
    hide(async () => {
      await AsyncStorage.setItem(`${keyBase}:actedAt`, new Date().toISOString());
      onAction();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={pointerEvents} // <-- APLICADO: Agora com tipo literal válido (resolve erro TS)
      style={[
        styles.overlay,
        { opacity: fade, transform: [{ translateY: slide }], bottom: bottomOffset },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.left}>
          <Ionicons name={icon as any} size={22} color={color} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            {!!message && <Text style={styles.message}>{message}</Text>}
            {/* Você pode exibir o código aqui se quiser, por exemplo: */}
            {/* {!!code && <Text style={styles.message}>Código: {code}</Text>} */}
          </View>
        </View>

        <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: color }]} onPress={handleAction}>
          <Text style={styles.ctaTxt}>{actionLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} accessibilityLabel="Fechar mensagem">
          <Ionicons name="close" size={18} color={TOKENS.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 15,
    right: 15,
    zIndex: 50,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.bgAlt,
    borderRadius: TOKENS.radius,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: { shadowColor: TOKENS.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 5 },
      android: { elevation: 4 },
    }),
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { color: TOKENS.textDark, fontWeight: '800', fontSize: 14 },
  message: { color: TOKENS.textMuted, fontSize: 12, marginTop: 2 },
  ctaBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: TOKENS.pill,
  },
  ctaTxt: { color: TOKENS.white, fontWeight: '700', fontSize: 12 },
  closeBtn: { marginLeft: 8, padding: 6 },
});

export default SmartNudge;