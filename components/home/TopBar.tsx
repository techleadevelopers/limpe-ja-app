// LimpeJaApp/components/TopBar.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TopBar() {
  return (
    <View style={styles.container}>
      <View style={styles.locationInfo}>
        <Ionicons name="location-outline" size={20} color="#007BFF" />
        <View>
          <Text style={styles.deliveryAddress}>Delivery Address</Text>
          <View style={styles.addressWrapper}>
            <Text style={styles.address}>2118 Thornridge California</Text>
            <Ionicons name="chevron-down-outline" size={16} color="#4A5568" style={styles.dropdownIcon} />
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.filterButton}>
        <Ionicons name="options-outline" size={24} color="#4A5568" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Ajuste para notch/barra de status
    paddingBottom: 10,
    backgroundColor: '#F7F8FC', // Cor de fundo consistente
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deliveryAddress: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 5,
  },
  addressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 5,
    flexShrink: 1, // Permite que o texto quebre linha
  },
  dropdownIcon: {
    marginLeft: 5,
  },
  filterButton: {
    padding: 5,
  },
});