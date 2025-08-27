// LimpeJaApp/app/(common)/safety/defense.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  Linking,
  useColorScheme,
  Image, // <= adicionado para ícones 3D
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '../../../constants/Colors';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import  PanicBanner  from '../../../components/safety/PanicBanner'; // já usado no chat

// -------- Theming --------
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

/* ==== ÍCONES 3D (injeção leve, sem alterar layout) ==== */
const Icons3D = {
  // Alinhado com os nomes de arquivo em assets/images/3d/ e a declaração em icons3d.ts
  shield: require('@3d/shield-safe.png'),
  lock: require('@3d/lock2.png'), // Assumindo 'lock2.png' com base no uso anterior
  cash: require('@3d/cash.png'),
  phone911: require('@3d/phone911.png'),
  flame2: require('@3d/flame2.png'),
  ambulance2: require('@3d/ambulance2.png'), // Assumindo 'ambulance2.png' com base no uso
} as const;

const Icon3D: React.FC<{ name: keyof typeof Icons3D; size?: number; style?: any }> = ({ name, size = 24, style }) => (
  <Image source={Icons3D[name]} style={[{ width: size, height: size, resizeMode: 'contain' }, style]} />
);

// -------- Screen --------
export default function SafetyDefenseScreen() {
  const router = useRouter();
  const theme = useTheme();

  // Header / conteúdo
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Ícones flutuantes do banner
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;

  // Estado local do PanicBanner (mockado para UI; sua lógica real pode atualizar via props)
  const [panicStatus, setPanicStatus] = useState<'IDLE'|'RECEIVED'|'ACKED'|'DISPATCHED'|'CLOSED'>('IDLE');

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    Animated.timing(contentAnim, {
      toValue: 1,
      delay: 120,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    const makeFloat = (v: Animated.Value, amp = 8, duration = 2800) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

    makeFloat(float1, 8, 2600);
    makeFloat(float2, 10, 3200);
  }, [headerAnim, contentAnim, float1, float2]);

  const floatY1 = float1.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const floatY2 = float2.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const onCall = (phone: string) => Linking.openURL(`tel:${phone}`).catch(() => {});
  const onPanic = () => {
    // Integração simples para demo visual:
    setPanicStatus('RECEIVED');
    setTimeout(() => setPanicStatus('ACKED'), 2000);
    setTimeout(() => setPanicStatus('DISPATCHED'), 5000);
    setTimeout(() => setPanicStatus('CLOSED'), 10000);
    // Produção: chamar seu endpoint real do pânico
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header animado no padrão azul */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.primary,
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Segurança</Text>
        <View style={styles.headerBtn} />
      </Animated.View>

      {/* Conteúdo */}
      <Animated.View
        style={{
          flex: 1,
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Banner de Seguro / Proteção */}
          <View style={styles.bannerWrap}>
            <LinearGradient
              colors={[theme.primary, theme.accent || theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.banner}
            >
              <View style={styles.bannerRow}>
                <View style={styles.bannerIcon}>
                  {/* Ícone 3D no lugar do ícone simples */}
                  <Icon3D name="shield" size={28} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Proteção LimpeJá</Text>
                  <Text style={styles.bannerSubtitle}>
                    Cobertura para imprevistos, suporte rápido e atendimento 24h.
                  </Text>
                </View>
              </View>

              {/* Ícones flutuantes decorativos (substituídos por 3D) */}
              <Animated.View style={[styles.floatIcon, { right: 18, top: 16, transform: [{ translateY: floatY1 }] }]}>
                <Icon3D name="lock" size={18} />
              </Animated.View>
              <Animated.View style={[styles.floatIcon, { right: 58, bottom: 16, transform: [{ translateY: floatY2 }] }]}>
                <Icon3D name="shield" size={18} />
              </Animated.View>

              {/* Selo de cobertura (mock) */}
              <View style={styles.bannerBadge}>
                <Icon3D name="cash" size={14} />
                <Text style={styles.bannerBadgeText}>Cobertura até R$ 5.000</Text>
              </View>
            </LinearGradient>
          </View>

          {/* O que entregamos */}
          <Card style={styles.card}>
            <Text style={[styles.cardTitle]}>O que o app entrega</Text>
            {[
              'Profissionais verificados e avaliação contínua',
              'Canal de emergência (SOS) com resposta priorizada',
              'Seguro contra danos materiais e incidentes elegíveis',
              'Roteiro seguro: dados do serviço, horários e histórico',
            ].map((txt, i) => (
              <View style={styles.itemRow} key={i}>
                <View style={styles.itemIconCircle}>
                  <Ionicons name="checkmark" size={14} color="#0A84FF" />
                </View>
                <Text style={styles.itemText}>{txt}</Text>
              </View>
            ))}
          </Card>

          {/* SOS e Acompanhamento */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>SOS & Acompanhamento</Text>
            <Text style={styles.cardSub}>
              Em caso de emergência, acione o SOS. Nossa equipe prioriza sua segurança.
            </Text>

            <View style={{ marginTop: 8 }}>
              <PanicBanner onPanic={onPanic} status={panicStatus} />
            </View>

            <View style={styles.ctaRow}>
              <Button title="Abrir central de pânico" onPress={() => router.push('/(common)/safety/panic' as any)} />
              <Button title="Ver políticas" kind="ghost" onPress={() => router.push('/(common)/legal/safety' as any)} />
            </View>
          </Card>

          {/* Contatos de Emergência */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Contatos de emergência</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => onCall('190')} style={[styles.pillBtn, { backgroundColor: withAlpha('#DC2626', 0.1) }]}>
                {/* 3D phone */}
                <Icon3D name="phone911" size={16} />
                <Text style={[styles.pillText, { color: '#DC2626' }]}>Polícia 190</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onCall('193')} style={[styles.pillBtn, { backgroundColor: withAlpha('#EA580C', 0.1) }]}>
                {/* 3D flame */}
                <Icon3D name="flame2" size={16} />
                <Text style={[styles.pillText, { color: '#EA580C' }]}>Bombeiros 193</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onCall('192')} style={[styles.pillBtn, { backgroundColor: withAlpha('#059669', 0.1) }]}>
                {/* 3D ambulance */}
                <Icon3D name="ambulance2" size={16} />
                <Text style={[styles.pillText, { color: '#059669' }]}>SAMU 192</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardHint}>
              Os números acima podem variar conforme sua região.
            </Text>
          </Card>

          {/* Dicas rápidas */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Dicas rápidas</Text>
            {[
              'Combine o serviço apenas pelo app para manter cobertura.',
              'Revise o perfil e as avaliações do profissional.',
              'Evite pagamentos em dinheiro; prefira o sistema do app.',
              'Em casos urgentes, acione o SOS e ligue para os serviços oficiais.',
            ].map((txt, i) => (
              <View style={styles.itemRow} key={`tip-${i}`}>
                <View style={[styles.itemIconCircle, { backgroundColor: withAlpha('#0A84FF', 0.08) }]}>
                  <Ionicons name="shield-checkmark" size={14} color="#0A84FF" />
                </View>
                <Text style={styles.itemText}>{txt}</Text>
              </View>
            ))}
          </Card>

          <View style={{ height: 20 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// -------- Styles --------
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 14,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  scrollContent: { paddingVertical: 14, paddingHorizontal: 16 },

  bannerWrap: { marginBottom: 14 },
  banner: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    minHeight: 120,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.25)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  floatIcon: {
    position: 'absolute',
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerBadge: {
    position: 'absolute',
    right: 12, top: 12,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bannerBadgeText: { color: '#065F46', fontWeight: '800', fontSize: 12 },

  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFF',
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
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardSub: { marginTop: 4, color: '#4B5563' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  itemIconCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#ECF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  itemText: { flex: 1, color: '#1F2937' },

  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: { fontWeight: '700' },
  cardHint: { marginTop: 8, color: '#6B7280', fontSize: 12 },
});