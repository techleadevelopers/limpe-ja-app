// LimpeJaApp/app/(client)/bookings/components/success/ProviderInfoSection.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { renderStars } from '../../utils/ui-helpers'; // Importa a função renderStars

interface ProviderInfoSectionProps {
  providerAvatarUrl?: string | null;
  providerFullName: string;
  providerRating?: number;
}

export default function ProviderInfoSection({
  providerAvatarUrl,
  providerFullName,
  providerRating,
}: ProviderInfoSectionProps) {
  return (
    <View style={styles.providerHeaderSection}>
      <Image
        source={providerAvatarUrl ? { uri: providerAvatarUrl } : require('../../../../../assets/images/default-avatar.png')}
        style={styles.providerAvatar}
      />
      <View style={styles.providerHeaderText}>
        <Text style={styles.providerNameText}>{providerFullName}</Text>
        <Text style={styles.providerRoleText}>Prestador(a) de Serviço</Text>
      </View>
      {renderStars(providerRating)}
    </View>
  );
}

const styles = StyleSheet.create({
  providerHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  providerHeaderText: {
    flex: 1,
  },
  providerNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  providerRoleText: {
    fontSize: 13,
    color: '#666',
  },
});