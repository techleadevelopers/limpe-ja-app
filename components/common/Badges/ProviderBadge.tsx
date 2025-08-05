// LimpeJaApp/components/common/Badges/ProviderBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProviderBadgeProps {
  badgeName: string;
  size?: 'small' | 'medium' | 'large';
}

const badgeConfig: { [key: string]: { icon: keyof typeof Ionicons.glyphMap; color: string; description: string } } = {
  'TOP_RATED': { icon: 'star', color: '#FFD700', description: 'Provedor com alta avaliação média.' },
  'VERIFIED': { icon: 'checkmark-circle', color: '#28a745', description: 'Provedor verificado pela plataforma.' },
  'HIGH_VOLUME': { icon: 'briefcase', color: '#17a2b8', description: 'Provedor com grande número de serviços concluídos.' },
  'ON_TIME_PRO': { icon: 'time', color: '#6f42c1', description: 'Provedor com excelente pontualidade.' },
  'NEW_TALENT': { icon: 'sparkles', color: '#fd7e14', description: 'Novo provedor promissor na plataforma.' },
  // Add more badges as needed
};

export default function ProviderBadge({ badgeName, size = 'medium' }: ProviderBadgeProps) {
  const config = badgeConfig[badgeName];

  if (!config) {
    return null; // Don't render if badgeName is not recognized
  }

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const textSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;
  const padding = size === 'small' ? 4 : size === 'medium' ? 6 : 8;

  return (
    <View style={[styles.badgeContainer, { backgroundColor: config.color + '20', padding }]}>
      <Ionicons name={config.icon} size={iconSize} color={config.color} />
      <Text style={[styles.badgeText, { fontSize: textSize, color: config.color }]}>
        {badgeName.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    marginRight: 5,
    borderWidth: 1,
    borderColor: '#ccc', // A light border to make it stand out
  },
  badgeText: {
    marginLeft: 4,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});