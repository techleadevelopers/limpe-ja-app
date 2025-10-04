// components/InfoChip.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../../../../app/(client)/explore/styles/providerStyles';

interface InfoChipProps {
  iconName: keyof typeof Ionicons.glyphMap;
  text?: string | number | null;
  compact?: boolean;
}

const InfoChip: React.FC<InfoChipProps> = ({ iconName, text, compact }) => {
  const resolvedText = text == null ? '' : String(text);

  return (
    <View style={[styles.infoChip, compact && { paddingVertical: 6, paddingHorizontal: 10 }]}>
      <Ionicons name={iconName} size={14} color="#555" />
      <Text style={[styles.infoChipText, compact && { fontSize: 12 }]}>{resolvedText}</Text>
    </View>
  );
};

export default InfoChip;
