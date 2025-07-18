// components/InfoChip.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../../../../app/(client)/explore/styles/providerStyles'; // Importa os estilos

interface InfoChipProps {
  iconName: keyof typeof Ionicons.glyphMap; // Para garantir que é um nome de ícone válido
  text: string;
}

const InfoChip: React.FC<InfoChipProps> = ({ iconName, text }) => {
  return (
    <View style={styles.infoChip}>
      <Ionicons name={iconName} size={15} color="#555" />
      <Text style={styles.infoChipText}>{text}</Text>
    </View>
  );
};

export default InfoChip;