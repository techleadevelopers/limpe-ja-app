// components/safety/PanicBanner.tsx
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View,
    ViewStyle,
} from 'react-native';

import Colors from '@constants/Colors';
import { Icons3D } from '../../constants/icons3d';

export type PanicStatus = 'IDLE' | 'RECEIVED' | 'ACKED' | 'DISPATCHED' | 'CLOSED';

type PanicBannerProps = {
  /** Acionado ao tocar no botão SOS */
  onPanic: () => void;
  /** Opcional: cancelar/encerrar alerta manualmente */
  onCancel?: () => void;
  /** Estado atual do fluxo de pânico */
  status?: PanicStatus;
  /** Números rápidos (fallback: 190/193/192) */
  phoneNumbers?: { police?: string; fire?: string; ambulance?: string };
  /** Versão compacta para cards menores */
  compact?: boolean;
  /** Estilo externo */
  style?: ViewStyle;
};

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const statusMeta: Record<
  PanicStatus,
  { label: string; sub?: string; tint: string; icon: any }
> = {
  IDLE:       { label: 'Acionar SOS',                    sub: 'Resposta priorizada 24h', tint: '#EF4444', icon: Icons3D.panic },
  RECEIVED:   { label: 'Alerta enviado',                 sub: 'Recebemos seu pedido',    tint: '#F59E0B', icon: Icons3D.notification },
  ACKED:      { label: 'Equipe notificada',              sub: 'Aguardando despacho',     tint: '#0EA5E9', icon: Icons3D.docCheck },
  DISPATCHED: { label: 'Socorro a caminho',              sub: 'Mantenha-se seguro',      tint: '#10B981', icon: Icons3D.shield },
  CLOSED:     { label: 'Ocorrência encerrada',           sub: 'Esperamos que esteja bem',tint: '#6B7280', icon: Icons3D.check },
};

export const PanicBanner: React.FC<PanicBannerProps> = ({
  onPanic,
  onCancel,
  status = 'IDLE',
  phoneNumbers,
  compact,
  style,
}) => {
  const theme = useTheme();
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // animação de pulso
  const pulse = useRef(new Animated.Value(0)).current;
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const ring = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  useEffect(() => {
    if (status === 'IDLE') {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [status, pulse]);

  // cronômetro (desde o acionamento)
  useEffect(() => {
    if (status !== 'IDLE' && !startedAt) setStartedAt(Date.now());
    if (status === 'IDLE') setStartedAt(null);
  }, [status, startedAt]);

  const elapsed = useMemo(() => {
    if (!startedAt) return null;
    const s = Math.floor((Date.now() - startedAt) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [startedAt]); // recalculado a cada render

  const meta = statusMeta[status];

  const call = (n?: string) => {
    const phone = n || '';
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const police = phoneNumbers?.police || '190';
  const fire   = phoneNumbers?.fire   || '193';
  const amb    = phoneNumbers?.ambulance || '192';

  const isIdle = status === 'IDLE';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isIdle) {
      setStartedAt(Date.now());
      onPanic?.();
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <LinearGradient
      colors={[theme.primary, theme.accent || theme.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.wrap,
        compact ? styles.wrapCompact : styles.wrapLarge,
        Platform.select({ android: { elevation: 0 } }),
        style,
      ]}
    >
      {/* Cabeçalho + status */}
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Image source={Icons3D.shield} style={styles.titleIcon} />
          <Text style={styles.title}>Central de Segurança</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: withAlpha('#000', 0.22) }]}>
          <Image source={meta.icon} style={styles.badgeIcon} />
          <Text style={styles.badgeText}>{meta.label}</Text>
        </View>
      </View>

      {!!meta.sub && (
        <Text style={styles.subtitle} numberOfLines={2}>
          {meta.sub}
        </Text>
      )}

      {/* Botão SOS */}
      <View style={styles.sosArea}>
        <Animated.View
          style={[
            styles.pulseRing,
            { opacity: ring, transform: [{ scale }], borderColor: meta.tint },
          ]}
        />
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={isIdle ? 'Acionar SOS' : 'Encerrar alerta'}
          style={({ pressed }) => [
            styles.sosBtn,
            {
              backgroundColor: isIdle ? meta.tint : withAlpha('#FFFFFF', 0.2),
              borderColor: withAlpha('#000', 0.15),
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Image
            source={Icons3D.panic}
            style={[styles.sosIcon, { tintColor: isIdle ? '#FFF' : meta.tint }]}
          />
          <Text
            style={[
              styles.sosText,
              { color: isIdle ? '#FFF' : '#FFFFFF', opacity: isIdle ? 1 : 0.95 },
            ]}
          >
            {isIdle ? 'Acionar SOS' : 'Alerta Ativo'}
          </Text>
          {!isIdle && (
            <Text style={styles.timerText}>{elapsed ?? '00:00'}</Text>
          )}
        </Pressable>
      </View>

      {/* Ações rápidas */}
      <View style={styles.quickRow}>
        <QuickCall
          label={`Polícia ${police}`}
          onPress={() => call(police)}
          icon={Icons3D.phone911}
          bg={withAlpha('#DC2626', 0.15)}
          fg="#FEE2E2"
        />
        <QuickCall
          label={`Bombeiros ${fire}`}
          onPress={() => call(fire)}
          icon={Icons3D.flame2}
          bg={withAlpha('#EA580C', 0.15)}
          fg="#FFEDD5"
        />
        <QuickCall
          label={`SAMU ${amb}`}
          onPress={() => call(amb)}
          icon={Icons3D.ambulance2}
          bg={withAlpha('#059669', 0.15)}
          fg="#D1FAE5"
        />
      </View>
    </LinearGradient>
  );
};

const QuickCall = ({
  label,
  onPress,
  icon,
  bg,
  fg,
}: {
  label: string;
  onPress: () => void;
  icon: any;
  bg: string;
  fg: string;
}) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, { backgroundColor: bg, opacity: pressed ? 0.85 : 1 }]}>
      <Image source={icon} style={styles.quickIcon} />
      <Text style={[styles.quickText, { color: '#fff' }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.25)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
    }),
  },
  wrapLarge: { minHeight: 160 },
  wrapCompact: { minHeight: 120 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleIcon: { width: 22, height: 22, resizeMode: 'contain' },
  title: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeIcon: { width: 16, height: 16, resizeMode: 'contain' },
  badgeText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

  subtitle: { color: 'rgba(255,255,255,0.9)', marginTop: 6 },

  sosArea: { alignItems: 'center', justifyContent: 'center', marginTop: 14, marginBottom: 10 },
  sosBtn: {
    width: 160,
    height: 54,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sosIcon: { width: 22, height: 22, resizeMode: 'contain' },
  sosText: { fontWeight: '900', letterSpacing: 0.4 },
  timerText: { marginLeft: 6, color: '#FFF', fontWeight: '700', fontVariant: ['tabular-nums'] },

  pulseRing: {
    position: 'absolute',
    width: 190,
    height: 66,
    borderRadius: 999,
    borderWidth: 8,
  },

  quickRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  quick: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  quickIcon: { width: 20, height: 20, resizeMode: 'contain' },
  quickText: { fontWeight: '800', fontSize: 12 },
});

export default PanicBanner;
