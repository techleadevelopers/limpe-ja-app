// components/missions/MissionProgressSnack.tsx
// ================================================
import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Card from '../common/Card'; // Alterado para importação padrão
import Button from '../common/Button'; // Alterado para importação padrão
import Colors from '../../constants/Colors'; // Alterado para importação padrão

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface MissionProgressSnackProps {
  current: number;
  goal: number;
  onView: () => void;
  // Adicione props para pontos, tier, etc., se desejar exibir um resumo mais completo
  // points?: number;
  // tier?: string;
  // weeklyStreak?: number;
}

export const MissionProgressSnack: React.FC<MissionProgressSnackProps> = ({ current, goal, onView }) => {
const pct = Math.min(1, current / Math.max(1, goal));
const theme = useTheme(); // Obtém o tema atual

return (
<Card>
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
<Text style={{ fontWeight: '800', color: theme.text }}>{`Progresso da Missão: ${Math.round(pct * 100)}%`}</Text> {/* Título mais genérico */}
<Text style={{ color: theme.textMuted }}>{`${current}/${goal}`}</Text>
</View>
<View style={{ height: 8, backgroundColor: theme.border, borderRadius: 999, overflow: 'hidden', marginTop: 8 }}> {/* Usa theme.border */}
<View style={{ width: `${pct * 100}%`, backgroundColor: theme.primary, height: '100%' }} />
</View>
<Button title="Ver detalhes da missão" onPress={onView} style={{ marginTop: 10 }} kind="ghost" />
</Card>
);
};