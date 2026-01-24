// components/coupons/CouponWelcomeCard.tsx
// ================================================
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Animated, useColorScheme } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Chip from '../../components/common/Chip';
import Colors from '../../constants/Colors';
import { useFadeSlideIn } from '../../components/utils/useFadeSlideIn';
import { usePressScale } from '../../components/utils/usePressScale';
import * as Clipboard from 'expo-clipboard';
import Toast from '../../components/Toast'; // Importar o Toast

// Hook para acessar as cores do tema atual (copiado de Chip.tsx)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  // Colors é um default export com chaves light/dark
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light; // Garante que o tipo seja Colors.light ou Colors.dark
}

interface CouponWelcomeCardProps {
    code: string;
    title: string;
    subtitle?: string;
    expiresAt?: string | null; // Alterado para aceitar string ou null
    onUseNow: (code: string) => void;
    onDismiss: () => void;
}

export const CouponWelcomeCard: React.FC<CouponWelcomeCardProps> = ({ code, title, subtitle, expiresAt, onUseNow, onDismiss }) => {
const [visible, setVisible] = useState(true);
const { opacity, translateY } = useFadeSlideIn(visible);
const { scale, onPressIn, onPressOut } = usePressScale();
const theme = useTheme(); // Use o hook para obter o tema atual

const copy = async () => {
    try {
        await Clipboard.setStringAsync(code); // Usando setStringAsync do expo-clipboard
        Toast.show({
            type: 'info',
            text1: 'Código Copiado!',
            text2: 'Cole no seu aplicativo para usar.',
        });
    } catch (e) {
        console.error('Falha ao copiar para a área de transferência', e);
        Toast.show({
            type: 'error',
            text1: 'Erro ao Copiar',
            text2: 'Tente novamente.',
        });
    }
};

const daysLeft = useMemo(() => {
    if (!expiresAt) return null; // Já trata null/undefined
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86400000));
    return diff;
}, [expiresAt]);

return (
<Animated.View style={{ opacity, transform: [{ translateY }] }}>
<Card>
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
<Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{title}</Text>
<Pressable onPress={() => { setVisible(false); onDismiss(); }} accessibilityLabel="Fechar" hitSlop={8}><Text style={{ fontSize: 18, color: theme.textMuted }}>✕</Text></Pressable>
</View>
{subtitle ? <Text style={{ color: theme.textMuted, marginTop: 4 }}>{subtitle}</Text> : null}
<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
<View style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#EEF6FF', borderWidth: 1, borderColor: '#CCE4FF' }}>
<Text style={{ fontWeight: '800', letterSpacing: 1, color: theme.primary }}>{code}</Text>
</View>
<Pressable onPress={copy} style={{ marginLeft: 10 }} accessibilityLabel="Copiar código"><Text style={{ color: theme.primary }}>Copiar</Text></Pressable>
{typeof daysLeft === 'number' ? <Chip label={`${daysLeft}d`} color="warning" /> : null}
</View>
<Animated.View style={{ transform: [{ scale }] }}>
<Button title="Usar agora" onPress={() => onUseNow(code)} onPressIn={onPressIn} onPressOut={onPressOut} style={{ marginTop: 12 }} />
</Animated.View>
</Card>
</Animated.View>
);
};
