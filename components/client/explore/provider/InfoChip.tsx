// components/InfoChip.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../../../../app/(client)/explore/styles/providerStyles'; // Importa os estilos

interface InfoChipProps {
  iconName: keyof typeof Ionicons.glyphMap; // Para garantir que é um nome de ícone válido
  text: string;
  compact?: boolean; // CORREÇÃO 5: Nova prop
}

const InfoChip: React.FC<InfoChipProps> = ({ iconName, text, compact }) => {
  return (
    // CORREÇÃO 5: Aplica estilos compactos se a prop for true
    <View style={[styles.infoChip, compact && { paddingVertical: 6, paddingHorizontal: 10 }]}>
      <Ionicons name={iconName} size={14} color="#555" /> {/* Ícone 14px */}
      <Text style={[styles.infoChipText, compact && { fontSize: 12 }]}>{text}</Text> {/* Fonte 12px para compact */}
    </View>
  );
};

export default InfoChip;