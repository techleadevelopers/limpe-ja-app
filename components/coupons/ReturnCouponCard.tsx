// components/coupons/ReturnCouponCard.tsx
// ================================================
import React, { useMemo } from 'react';
import { View, Text, Animated, StyleSheet, useColorScheme } from 'react-native'; // Adicionado useColorScheme
import Card  from '../common/Card';
import Button  from '../common/Button'; // Certifique-se que este arquivo contém o componente Button, não Colors.ts
import Colors  from '../../constants/Colors';
import { useFadeSlideIn } from '../../components/utils/useFadeSlideIn';

// Hook para acessar as cores do tema atual (copiado de CouponWelcomeCard.tsx)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light; // Garante que o tipo seja Colors.light ou Colors.dark
}

export const ReturnCouponCard = ({ code, title, expiresAt, onBookAgain }: { code: string; title: string; expiresAt: string; onBookAgain: (code: string) => void }) => {
const { opacity, translateY } = useFadeSlideIn(true);
const theme = useTheme(); // Use o hook para obter o tema atual

const remaining = useMemo(() => Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)), [expiresAt]);

return (
<Animated.View style={{ opacity, transform: [{ translateY }] }}>
<Card>
<Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{title}</Text> {/* Acessando theme.text */}
<Text style={{ color: theme.textMuted, marginTop: 4 }}>Expira em {remaining} dia(s)</Text> {/* Acessando theme.textMuted */}
<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
<View style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#EEF6FF', borderWidth: 1, borderColor: '#CCE4FF' }}> {/* Hardcoded light blue, consider adding to Colors if used often */}
<Text style={{ fontWeight: '800', letterSpacing: 1, color: theme.primary }}>{code}</Text> {/* Acessando theme.primary */}
</View>
<Button title="Agendar novamente" onPress={() => onBookAgain(code)} style={{ marginLeft: 10 }} />
</View>
</Card>
</Animated.View>
);
};