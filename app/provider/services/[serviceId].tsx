import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';

import Colors from '../../../constants/Colors';
import { getBookingDetails } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { formatDate } from '../../../utils/helpers';

// Helpers de Tema
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
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!serviceId) return;
        const d = await getBookingDetails(String(serviceId));
        if (mounted) setData(d);
      } catch (e: any) {
        console.error('Failed to load service details', e);
        setError(String((e.message || e) ?? 'Erro desconhecido'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [serviceId]);

  const serviceScopeLabel = React.useMemo(() => {
    if (!data) return 'Residencial';
    const haystack = `${data.serviceDescription ?? ''} ${data.notes ?? ''}`.toLowerCase();
    if (haystack.includes('comercial')) return 'Comercial';
    if (haystack.includes('residencial')) return 'Residencial';
    return 'Residencial';
  }, [data]);

  if (isLoading) return (
    <View style={styles.centered}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );

  if (error) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER MANTIDO CONFORME SOLICITADO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do serviço</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SEÇÃO: CLIENTE */}
        <Text style={styles.sectionLabel}>CLIENTE</Text>
        <View style={styles.infoCard}>
          <View style={styles.clientRow}>
            {data?.clientAvatarUrl ? (
              <Image source={{ uri: data.clientAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Ionicons name="person" size={20} color="#FFF" />
              </View>
            )}
            <View>
              <Text style={styles.clientName}>{data?.clientFullName}</Text>
              <Text style={styles.clientSub}>Cliente verificado</Text>
            </View>
          </View>
        </View>

     {/* SEÇÃO: DATA E LOCALIZAÇÃO (SEGURANÇA E TRANSPARÊNCIA) */}
        <Text style={styles.sectionLabel}>AGENDAMENTO E LOCAL</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={styles.infoTitle}>Data e Horário</Text>
              <Text style={styles.infoValue}>
                {data?.scheduledDate 
                  ? `${formatDate(data.scheduledDate)} às ${data.scheduledTime || '--:--'}`
                  : 'Data não informada'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoItem, { marginTop: 16 }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={18} color="#359fe5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Endereço do Trabalho</Text>
              <Text style={styles.infoValue} numberOfLines={3}>
                {data?.address ? (
                  `${data.address.street}, ${data.address.number}${data.address.complement ? ` - ${data.address.complement}` : ''}\n${data.address.neighborhood}, ${data.address.city} - ${data.address.state}`
                ) : (
                  'Endereço disponível após confirmação'
                )}
              </Text>
            </View>
          </View>

          <View style={[styles.infoItem, { marginTop: 16 }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="briefcase-outline" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Tipo de serviço</Text>
              <Text style={styles.infoValue}>
                {serviceScopeLabel} • {data?.serviceName ?? 'Serviço concluído'}
              </Text>
            </View>
          </View>
        </View>

        {/* SEÇÃO: OBSERVAÇÕES */}
        <Text style={styles.sectionLabel}>OBSERVAÇÕES</Text>
        <View style={styles.infoCard}>
          <Text style={styles.notesText}>
            {(data as any)?.description || 'Nenhuma observação adicional enviada pelo cliente.'}
          </Text>
        </View>

        {/* CARD PRINCIPAL: STATUS E SERVIÇO */}
        <View style={styles.mainCard}>
          <View style={styles.serviceHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="trophy-variant" size={29} color="#FFD700" />
            </View>
          </View>
          
          <View style={styles.servicePriceRow}>
            <Ionicons name="add-circle-outline" size={16} color="#2563EB" style={styles.servicePriceIcon} />
            <Text style={styles.servicePriceBlue}>R$ {data?.totalPrice?.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>

        {/* BOTÕES DE AÇÃO (CASO PENDENTE) */}
        {data?.status === BookingStatus.PENDING && (
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.btnAccept, { backgroundColor: theme.primary }]}>
              <Text style={styles.btnTextWhite}>Confirmar Serviço</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnReject}>
              <Text style={[styles.btnTextReject, { color: theme.primary }]}>Recusar</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingBottom: 15
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  backBtn: { backgroundColor: '#F0F0F0', padding: 8, borderRadius: 12 },
  scrollContent: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#D32F2F', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },

  // Cards Premium
mainCard: { 
  
    
    borderRadius: 24, 
    paddingVertical: 16, 
    paddingHorizontal: 18, 
    alignItems: 'stretch',
    marginBottom: 18,
    
   
  },
  serviceHeader: { alignItems: 'flex-start', paddingBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 80, marginBottom: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  serviceName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    bottom: 30,
  },
  servicePriceIcon: {
    marginRight: 6,
  },
  servicePriceBlue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9E9E9E', marginBottom: 10, marginLeft: 4, letterSpacing: 1 },
  infoCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },

  clientRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 26, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  clientName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  clientSub: { fontSize: 13, color: '#757575' },

  infoItem: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoTitle: { fontSize: 12, color: '#757575', fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },

  notesText: { fontSize: 14, color: '#424242', lineHeight: 20 },

  footer: { marginTop: 10, gap: 12 },
  btnAccept: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  btnReject: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  btnTextWhite: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  btnTextReject: { fontSize: 16, fontWeight: '600' },
});
