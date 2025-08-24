// components/missions/MissionReminderCard.tsx
// ================================================
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet, useColorScheme } from 'react-native'; // Adicionado Easing e useColorScheme
import Card from '../common/Card'; // Alterado para importação padrão
import Button from '../../components/common/Button'; // Alterado para importação padrão
import Chip from '../../components/common/Chip'; // Alterado para importação padrão
import Colors from '../../constants/Colors'; // Alterado para importação padrão
import { useFadeSlideIn } from '../../components/utils/useFadeSlideIn';
import { useReducedMotion } from '../../components/utils/useReducedMotion';

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export const MissionReminderCard = ({ missionId, title, deadlineAt, reward, onGo, onDismiss }: { missionId: string; title: string; deadlineAt: string; reward: { kind: 'COUPON'|'POINTS'; value: number }; onGo: () => void; onDismiss: () => void }) => {
const { opacity, translateY } = useFadeSlideIn(true);
const [pulse] = useState(new Animated.Value(1));
const reduced = useReducedMotion();
const theme = useTheme(); // Obtém o tema atual

useEffect(() => {
if (reduced) return;
const loop = Animated.loop(Animated.sequence([
Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.quad) })
]));
loop.start();
return () => loop.stop();
}, [reduced, pulse]); // Added pulse to dependency array
return (
<Animated.View style={{ opacity, transform: [{ translateY }] }}>
<Card>
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
<Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{title}</Text> {/* Usando theme.text */}
<Pressable onPress={onDismiss} accessibilityLabel="Dispensar"><Text style={{ color: theme.textMuted }}>Agora não</Text></Pressable> {/* Usando theme.textMuted */}
</View>
<Text style={{ color: theme.textMuted, marginTop: 4 }}>Até {new Date(deadlineAt).toLocaleString()}</Text> {/* Usando theme.textMuted */}
<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
<Chip label={reward.kind === 'COUPON' ? `Cupom R$${reward.value}` : `+${reward.value} pts`} />
<Animated.View style={{ transform: [{ scale: pulse }], marginLeft: 10 }}>
<Button title="Ir agora" onPress={onGo} />
</Animated.View>
</View>
</Card>
</Animated.View>
);
};