// components/InfoChip.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../../../../styles/providerStyles';

interface InfoChipProps {
  iconName: keyof typeof Ionicons.glyphMap;
  text?: string | number | null;
  compact?: boolean;
  iconSize?: number;
}

const InfoChip: React.FC<InfoChipProps> = ({ iconName, text, compact, iconSize }) => {
  const size = iconSize ?? (compact ? 18 : 22);
  const resolvedText = text == null ? '' : String(text);

  return (
    <View style={[styles.infoChip, compact && { paddingVertical: 6, paddingHorizontal: 10, bottom: 10 }]}>
      <Ionicons name={iconName} size={size} color="#4A90E2" style={{ marginRight: 2 }} />
      <Text
        numberOfLines={1}
        style={[
          styles.infoChipText,
          compact && { fontSize: 16, color: '#2F2F2F', fontWeight: '600' },
        ]}
      >
        {resolvedText}
      </Text>
    </View>
  );
};

export default InfoChip;
