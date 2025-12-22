import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/appStyles';

export interface ServiceCardProps {
  id: string;
  name: string;
  description?: string;
  price?: number;
  onPress: (serviceId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ id, name, description, price, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        Platform.OS === 'android' && {
          elevation: 3,
          shadowColor: 'rgba(0,0,0,0.08)',
        },
      ]}
      onPress={() => onPress(id)}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{name}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {price !== undefined && price > 0 ? (
          <Text style={styles.price}>R$ {price.toFixed(2).replace('.', ',')}</Text>
        ) : (
          <Text style={styles.price}>Consultar</Text>
        )}
      </View>
      <Ionicons name="arrow-forward" size={20} color={AppColors.primaryInteractive} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textBody,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  price: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.primaryInteractive,
  },
});

export default ServiceCard;
