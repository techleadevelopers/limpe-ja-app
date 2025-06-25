// app/(provider)/components/dashboard/UpcomingServiceItem.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../../../../types/booking'; // Certifique-se que o caminho para seus tipos está correto
import Toast from 'react-native-toast-message'; // Supondo a instalação de uma biblioteca de Toast

interface UpcomingServiceItemProps {
  booking: Booking;
  onPress: (bookingId: string) => void;
  // Adicionado: Funções para ações rápidas
  onAcceptPress?: (bookingId: string) => void;
  onRejectPress?: (bookingId: string) => void;
  onContactClientPress?: (clientId: string) => void;
  onContactClient: (clientId: string) => void; // <--- ADICIONE ESTA LINHA
}

const UpcomingServiceItem: React.FC<UpcomingServiceItemProps> = ({
  booking,
  onPress,
  onAcceptPress,
  onRejectPress,
  onContactClientPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  // Funções para extrair data e hora de scheduledDateTime
  const getFormattedDate = (isoDateTime: string) => {
    if (!isoDateTime) return 'Data não definida';
    try {
      const date = new Date(isoDateTime);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      if (date.toDateString() === now.toDateString()) {
        return 'Hoje';
      }
      if (date.toDateString() === tomorrow.toDateString()) {
        return 'Amanhã';
      }
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return 'Data inválida';
    }
  };

  const getFormattedTime = (isoDateTime: string) => {
    if (!isoDateTime) return 'Hora não definida';
    try {
      return new Date(isoDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Hora inválida';
    }
  };

  // Determinar se o serviço é iminente (ex: nas próximas 2 horas)
  const isImminent = () => {
    if (!booking.scheduledDateTime) return false;
    const bookingTime = new Date(booking.scheduledDateTime).getTime();
    const now = new Date().getTime();
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    return bookingTime > now && (bookingTime - now) <= twoHoursInMs;
  };

  const renderQuickActions = () => {
    if (booking.status === 'pending_provider_confirmation') {
      return (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButtonAccept}
            onPress={() => {
              Alert.alert(
                "Confirmar Agendamento",
                "Tem certeza que deseja aceitar esta solicitação de serviço?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Sim", onPress: () => onAcceptPress && onAcceptPress(booking.id) }
                ]
              );
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Aceitar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonReject}
            onPress={() => {
              Alert.alert(
                "Recusar Agendamento",
                "Tem certeza que deseja recusar esta solicitação de serviço?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Sim", onPress: () => onRejectPress && onRejectPress(booking.id) }
                ]
              );
            }}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Recusar</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (booking.status === 'confirmed') {
      return (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButtonContact}
            onPress={() => {
              if (onContactClientPress && booking.client?.id) {
                onContactClientPress(booking.client.id);
                Toast.show({ type: 'info', text1: 'Abrindo chat com o cliente...', position: 'bottom' }); // Feedback de Toast
              }
            }}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#007AFF" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>Chat</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <Animated.View style={[styles.upcomingServiceCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.upcomingServiceCard}
        onPress={() => onPress(booking.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {isImminent() && <View style={styles.imminentIndicator} />}

        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{booking.serviceSnapshot.name}</Text>
          <Text style={styles.clientName}>{booking.client?.name || 'Cliente não informado'}</Text>
          <Text style={styles.dateTime}>
            <Ionicons name="calendar-outline" size={14} color="#6C757D" />
            {getFormattedDate(booking.scheduledDateTime)} às{' '}
            <Ionicons name="time-outline" size={14} color="#6C757D" />
            {getFormattedTime(booking.scheduledDateTime)}
          </Text>
          <Text style={styles.addressInfo}>
            <Ionicons name="location-outline" size={14} color="#6C757D" />{' '}
            {booking.address.street}, {booking.address.number}, {booking.address.neighborhood}
          </Text>
        </View>
        <View style={styles.serviceActionsContainer}>
          <Text style={styles.serviceAmount}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(booking.totalPrice || 0)}
          </Text>
          {booking.status === 'pending_provider_confirmation' ? (
            <View style={styles.statusBadgePending}>
              <Text style={styles.statusBadgeTextPending}>Nova Solicitação</Text>
            </View>
          ) : (
            <View style={styles.statusBadgeConfirmed}>
              <Text style={styles.statusBadgeTextConfirmed}>Confirmado</Text>
            </View>
          )}
          <Ionicons name="chevron-forward-outline" size={24} color="#C7C7CC" />
        </View>
      </TouchableOpacity>
      {renderQuickActions()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  upcomingServiceCardWrapper: {
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
    overflow: 'hidden', // Para o indicador iminente
  },
  upcomingServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    position: 'relative',
  },
  imminentIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#FFC107', // Amarelo de alerta
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  serviceInfo: {
    flex: 3,
    marginRight: 8,
    paddingLeft: 5, // Espaço para o indicador iminente
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212529',
  },
  clientName: {
    fontSize: 14,
    color: '#495057',
    marginTop: 2,
  },
  dateTime: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 5,
  },
  addressInfo: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  serviceActionsContainer: {
    flex: 1.5,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  serviceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28A745', // Verde para o valor
    marginBottom: 5,
  },
  statusBadge: {
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  statusBadgePending: {
    backgroundColor: '#FFF3CD', // Fundo amarelo claro
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  statusBadgeConfirmed: {
    backgroundColor: '#D4EDDA', // Fundo verde claro
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  statusBadgeTextPending: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404', // Texto amarelo escuro
  },
  statusBadgeTextConfirmed: {
    fontSize: 12,
    fontWeight: '600',
    color: '#155724', // Texto verde escuro
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 10,
    paddingTop: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  actionButtonAccept: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28A745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  actionButtonReject: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  actionButtonContact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  actionButtonTextPrimary: {
    color: '#007AFF',
  }
});

export default UpcomingServiceItem;