// LimpeJaApp/app/(client)/bookings/components/success/BookingDetailSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Interface de props atualizada para incluir as linhas de endereço formatadas
interface BookingDetailSectionProps {
  serviceName: string;
  // REMOVIDO: formattedClientAddress
  // NOVAS PROPS: Endereço já formatado
  formattedAddressLine1: string;
  formattedAddressLine2: string;
  notes?: string | null;
  iconColor: string;
}

export default function BookingDetailSection({
  serviceName,
  // REMOVIDO: formattedClientAddress
  // NOVAS PROPS: Desestruturadas aqui
  formattedAddressLine1,
  formattedAddressLine2,
  notes,
  iconColor,
}: BookingDetailSectionProps) {
  return (
    <View style={styles.detailSection}>
      {/* Detalhes do Serviço */}
      <View style={styles.detailItem}>
        <Ionicons name="brush-outline" size={19} color={iconColor} />
        <Text style={styles.detailLabel}>Serviço Contratado</Text>
        <Text style={styles.detailValue}>{serviceName}</Text>
      </View>
      
      {/* Detalhes do Endereço - ATUALIZADO */}
      <View style={styles.detailItem}>
        <Ionicons name="location-outline" size={19} color={iconColor} />
        <Text style={styles.detailLabel}>Local do Serviço</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.detailValue}>{formattedAddressLine1}</Text>
          <Text style={styles.detailValue}>{formattedAddressLine2}</Text>
        </View>
      </View>
      
      {/* Detalhes de Observações (se houver) */}
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
    paddingHorizontal: 10,
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
  // Contêiner para o endereço, para que as linhas fiquem alinhadas
  addressContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    // flex: 2, // Removido para que o `addressContainer` controle o alinhamento
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