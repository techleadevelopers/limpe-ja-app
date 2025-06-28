// LimpeJaApp/app/(client)/bookings/components/success/BookingDetailSection.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BookingDetailSectionProps {
  serviceName: string;
  formattedClientAddress: string;
  notes?: string | null;
  iconColor: string;
}

export default function BookingDetailSection({
  serviceName,
  formattedClientAddress,
  notes,
  iconColor,
}: BookingDetailSectionProps) {
  return (
    <View style={styles.detailSection}>
      <View style={styles.detailItem}>
        <Ionicons name="brush-outline" size={19} color={iconColor} />
        <Text style={styles.detailLabel}>Serviço Contratado</Text>
        <Text style={styles.detailValue}>{serviceName}</Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="location-outline" size={19} color={iconColor} />
        <Text style={styles.detailLabel}>Local do Serviço</Text>
        <Text style={styles.detailValue}>{formattedClientAddress}</Text>
      </View>
      {notes ? (
        <View style={styles.detailItem}>
          <Ionicons name="document-text-outline" size={18} color={iconColor} />
          <Text style={styles.detailLabel}>Observações</Text>
          <Text style={styles.detailValueNotes}>{notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  detailSection: {
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 16,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  detailValueNotes: {
    fontSize: 13,
    color: '#333',
    flex: 2,
    textAlign: 'right',
    lineHeight: 20,
  },
});