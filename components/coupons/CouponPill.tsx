// components/coupons/CouponPill.tsx
// ================================================
import React from 'react';
import { View, Text, Pressable, Animated, StyleSheet, useColorScheme } from 'react-native'; // Adicionado useColorScheme
import { usePressScale } from '../../components/utils/usePressScale';
import Colors from '../../constants/Colors'; // Alterado para importação padrão

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export const CouponPill = ({ code, onOpen }: { code: string; onOpen: () => void }) => {
const { scale, onPressIn, onPressOut } = usePressScale();
const theme = useTheme(); // Obtém o tema atual

return (
<Animated.View style={{ position: 'absolute', bottom: 24, right: 16, transform: [{ scale }] }}>
<Pressable onPress={onOpen} onPressIn={onPressIn} onPressOut={onPressOut}
style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}> {/* Usando theme.primary */}
<Text style={{ color: '#FFF', fontWeight: '800', marginRight: 6 }}>🎁</Text>
<Text style={{ color: '#FFF', fontWeight: '700' }}>{code}</Text>
</Pressable>
</Animated.View>
);
};