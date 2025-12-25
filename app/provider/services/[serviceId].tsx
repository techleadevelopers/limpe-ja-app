import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '../../../constants/Colors';
import { getBookingDetails, updateBookingStatus } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { formatDate } from '../../../utils/helpers';
import { setSafeError } from '../../_shared/errors/uiFeedback';

function useTheme() {
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

export default function ProviderServiceDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  const [data, setData] = React.useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!serviceId) return;
        const d = await getBookingDetails(String(serviceId));
        if (mounted) setData(d);
      } catch (e: any) {
        setSafeError(setError, e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [serviceId]);

  const statusStyle = React.useMemo(() => {
    const s = data?.status;
    switch (s) {
      case BookingStatus.PENDING:
        return { text: '#FF6F00', bg: '#FFF3E0', icon: 'clock-outline' as const, label: 'Pendente' };
      case BookingStatus.CONFIRMED:
        return { text: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle-outline' as const, label: 'Confirmado' };
      case BookingStatus.IN_PROGRESS:
        return { text: '#007AFF', bg: '#E3F2FD', icon: 'sync-circle-outline' as const, label: 'Em andamento' };
      case BookingStatus.COMPLETED:
        return { text: '#546E7A', bg: '#ECEFF1', icon: 'check-all' as const, label: 'Concluído' };
      case BookingStatus.CANCELLED:
        return { text: '#D32F2F', bg: '#FFEBEE', icon: 'close-circle-outline' as const, label: 'Cancelado' };
      case BookingStatus.REJECTED:
        return { text: '#757575', bg: '#F5F5F5', icon: 'minus-circle-outline' as const, label: 'Recusado' };
      default:
        return { text: '#546E7A', bg: '#ECEFF1', icon: 'information-outline' as const, label: 'Desconhecido' };
    }
  }, [data?.status]);

  const handleAccept = async () => {
    if (!data) return;
    try {
      setIsUpdating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = await updateBookingStatus(data.id, { status: BookingStatus.CONFIRMED } as any);
      setData(updated);
    } catch (e: any) {
      setSafeError(setError, e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    try {
      setIsUpdating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const updated = await updateBookingStatus(data.id, { status: BookingStatus.REJECTED } as any);
      setData(updated);
    } catch (e: any) {
      setSafeError(setError, e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}> 
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>Detalhes do serviço</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 8, color: theme.textMuted }}>Carregando...</Text>
        </View>
      ) : error || !data ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={36} color={theme.primary} />
          <Text style={{ marginTop: 8, color: theme.text }}>{error || 'Não foi possível carregar.'}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: theme.cardBackground }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {data.clientAvatarUrl ? (
                <Image source={{ uri: data.clientAvatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.primary }]} />
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{data.serviceName}</Text>
                <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>Cliente: {data.clientFullName}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}> 
                <MaterialCommunityIcons name={statusStyle.icon} size={14} color={statusStyle.text} />
                <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.row, { color: theme.textMuted }]}>
                <Ionicons name="calendar-outline" size={14} color={theme.textMuted} /> {formatDate(data.scheduledDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                {data.scheduledTime ? `, ${data.scheduledTime}` : ''}
              </Text>
              {typeof data.totalPrice === 'number' && (
                <Text style={[styles.price, { color: theme.success || '#405aa8ff' }]}>R$ {data.totalPrice.toFixed(2).replace('.', ',')}</Text>
              )}
            </View>
          </View>

          {data.status === BookingStatus.PENDING && (
            <View style={styles.actionsRow}>
              <TouchableOpacity disabled={isUpdating} style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={handleAccept}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={styles.primaryBtnText}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={isUpdating} style={[styles.secondaryBtn, { borderColor: theme.primary }] } onPress={handleReject}>
                <Ionicons name="close" size={16} color={theme.primary} />
                <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>Rejeitar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 80, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 16, marginTop: 10 },
  card: { borderRadius: 12, padding: 16, ...Platform.select({ ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }, android: { elevation: 0 } }) },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  title: { fontSize: 17, fontWeight: '800' },
  sub: { fontSize: 13 },
  row: { fontSize: 13 },
  price: { color: '#405aa8ff', fontSize: 15, fontWeight: '700', marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: '700', marginLeft: 6, textTransform: 'uppercase' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  primaryBtnText: { color: '#FFF', fontWeight: '800' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  secondaryBtnText: { fontWeight: '800' },
});
