// components/safety/PanicBanner.tsx
// ================================================
import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Card from '../common/Card'; // Importação padrão
import Button from '../common/Button'; // Importação padrão
import Chip from '../common/Chip'; // Importação padrão
import Colors from '../../constants/Colors'; // Importação padrão

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export const PanicBanner = ({ onPanic, status }: { onPanic: () => void; status?: 'IDLE'|'RECEIVED'|'ACKED'|'DISPATCHED'|'CLOSED' }) => {
  const theme = useTheme(); // Obtém o tema atual

  return (
    <Card style={{ backgroundColor: theme.sensitiveBackground, borderColor: theme.sensitiveBorder }}>
      <Text style={{ fontWeight: '800', color: theme.danger, marginBottom: 6 }}>Está se sentindo inseguro?</Text>
      <Text style={{ color: theme.textBody, marginBottom: 10 }}>Acione o botão de pânico. Nossa equipe irá atender imediatamente.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button title="🚨 Pedir ajuda" onPress={onPanic} />
        {/* CORREÇÃO: Passando os nomes semânticos das cores ('warning' ou 'error') para o Chip */}
        {status && <Chip label={status} color={status === 'ACKED' || status === 'DISPATCHED' ? 'warning' : 'error'} />}
      </View>
    </Card>
  );
};