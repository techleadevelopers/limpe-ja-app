// LimpeJaApp/src/components/specific/ServiceBookingCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Card from '../ui/Card'; // Supondo que Card.tsx exista
// import { Booking } from '../../types'; // Seu tipo Booking
import { formatDate } from '../../utils/helpers'; // Seu helper de data
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useColorScheme } from 'react-native';


// interface ServiceBookingCardProps {
//   booking: Booking;
//   onPress: () => void;
//   userRole: 'client' | 'provider';
// }

// Usando 'any' para o placeholder
interface ServiceBookingCardProps {
  booking: any; // Substitua por 'Booking'
  onPress: () => void;
  userRole: 'client' | 'provider';
}

const ServiceBookingCard: React.FC<ServiceBookingCardProps> = ({ booking, onPress, userRole }) => {
  const colorScheme = useColorScheme() || 'light';
  const themeColors = Colors[colorScheme];

  // const displayName = userRole === 'client' ? booking.provider?.name : booking.client?.name;
  // const displayRoleLabel = userRole === 'client' ? 'Profissional' : 'Cliente';
  const displayName = userRole === 'client' ? booking.providerName : booking.clientName; // Usando campos mockados
  const displayRoleLabel = userRole === 'client' ? 'Profissional' : 'Cliente';

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.serviceName, { color: themeColors.text }]}>{booking.serviceSnapshot?.name || booking.serviceName || 'Serviço Indefinido'}</Text>
        <Text style={[styles.status, { color: booking.status === 'Confirmado' ? themeColors.secondary : themeColors.accent }]}>
          {booking.status}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="person-outline" size={16} color={themeColors.grey} />
        <Text style={[styles.detailText, { color: themeColors.text }]}> {displayRoleLabel}: {displayName || 'Não informado'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={16} color={themeColors.grey} />
        <Text style={[styles.detailText, { color: themeColors.text }]}> Data: {formatDate(booking.scheduledDateTime || booking.date, { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      {booking.address && (
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={themeColors.grey} />
          <Text style={[styles.detailText, { color: themeColors.text }]} numberOfLines={1}> Local: {typeof booking.address === 'string' ? booking.address : `${booking.address.street}, ${booking.address.city}`}</Text>
        </View>
      )}
       {booking.totalPrice && (
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={themeColors.grey} />
          <Text style={[styles.detailText, { color: themeColors.text }]}> Valor: R$ {booking.totalPrice.toFixed(2)}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    // Estilos adicionais para o card, se necessário, além dos do Card.tsx base
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: 'bold',
    flexShrink: 1, // Para quebrar linha se o nome for muito grande
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden', // Para borderRadius funcionar em Text no Android
    textAlign: 'center',
    minWidth: 90,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 5,
  },
});

export default ServiceBookingCard;