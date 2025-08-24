// components/support/SupportTicketStatus.tsx
// ================================================
import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native'; // Adicionado useColorScheme
import Card from '../common/Card'; // Alterado para importação padrão
import Chip from '../common/Chip'; // Alterado para importação padrão
import Button from '../common/Button'; // Alterado para importação padrão
import Colors from '../../constants/Colors'; // Alterado para importação padrão

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export const SupportTicketStatus = ({ status, slaETA, onOpen }: { status: 'OPEN'|'IN_PROGRESS'|'AWAITING_USER'|'ESCALATED'|'RESOLVED'|'CLOSED'; slaETA?: string; onOpen?: () => void }) => {
  const theme = useTheme(); // Obtém o tema atual

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '800', color: theme.text }}>Suporte</Text> {/* Usando theme.text */}
       <Chip label={status.replace('_', ' ')} color={status === 'RESOLVED' || status === 'CLOSED' ? 'success' : 'primary'} />
      </View>
      {slaETA ? <Text style={{ color: theme.textMuted, marginTop: 6 }}>SLA: até {new Date(slaETA).toLocaleString()}</Text> : null} {/* Usando theme.textMuted */}
      {onOpen ? <Button title="Ver detalhes" onPress={onOpen} style={{ marginTop: 10 }} kind="ghost" /> : null}
    </Card>
  );
};