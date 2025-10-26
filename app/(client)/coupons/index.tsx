import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ActivityIndicator, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import Colors from '../../../constants/Colors';
import { getMyCoupons as getMyCouponsService, MyCouponListItem } from '../../../services/couponService';
import NotificationUIService from '../../../services/notificationUIService';

enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

enum CouponStatus {
  AVAILABLE = 'available',
  USED = 'used',
  EXPIRED = 'expired',
}

interface CouponItem {
  id: string;
  code: string;
  title: string;
  description: string;
  value: number;
  type: CouponType;
  minOrderValue?: number;
  expiresAt: string;
  status: CouponStatus;
  imageUrl?: string;
  isClaimed?: boolean;
}

const normalizeValueType = (vt?: string): 'PERCENT' | 'FIXED' => {
  const t = (vt || '').toUpperCase();
  return t.includes('PERCENT') ? 'PERCENT' : 'FIXED';
};

const deriveStatus = (status?: string, validUntil?: string): 'available' | 'used' | 'expired' => {
  if (status) {
    const s = status.toUpperCase();
    if (s === 'ACTIVE') return 'available';
    if (s === 'EXPIRED' || s === 'INACTIVE') return 'expired';
    if (s === 'USED' || s === 'USED_UP') return 'used';
  }
  if (validUntil && new Date(validUntil).getTime() < Date.now()) return 'expired';
  return 'available';
};

const mapApiToUICoupon = (c: MyCouponListItem): CouponItem => {
  const expiresAt = c.validUntil;
  const mappedStatus = deriveStatus(c.status, expiresAt);
  return {
    id: c.id,
    code: c.code,
    title: c.description ? c.description : `Cupom ${c.code}`,
    description: c.description || '',
    value: c.value,
    type: normalizeValueType(c.valueType) === 'PERCENT' ? CouponType.PERCENTAGE : CouponType.FIXED,
    minOrderValue: c.minOrderValue,
    expiresAt,
    status: mappedStatus === 'available' ? CouponStatus.AVAILABLE : mappedStatus === 'used' ? CouponStatus.USED : CouponStatus.EXPIRED,
    imageUrl: c.imageUrl,
    isClaimed: false,
  };
};

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function useTheme() {
  const scheme = (Colors as any)?.scheme || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

function CouponCard({ coupon, onUseCoupon, theme }: { coupon: CouponItem; onUseCoupon: (coupon: CouponItem) => void; theme: ReturnType<typeof useTheme>; }) {
  const isAvailable = coupon.status === (CouponStatus as any).AVAILABLE || (coupon as any).status === 'available';
  const isUsed = coupon.status === (CouponStatus as any).USED || (coupon as any).status === 'used';
  const buttonText = isAvailable ? 'Usar cupom' : (isUsed ? 'Cupom usado' : 'Expirado');

  return (
    <View style={[styles.couponCard, { backgroundColor: theme.cardBackground }]}> 
      <View style={styles.couponHeader}>
        <View style={styles.couponImagePlaceholder} />
        <View style={styles.couponInfo}>
          <Text style={[styles.couponTitle, { color: theme.text }]} numberOfLines={1}>{coupon.title}</Text>
          {!!coupon.description && (
            <Text style={[styles.couponDescription, { color: theme.textMuted }]} numberOfLines={2}>{coupon.description}</Text>
          )}
        </View>
      </View>
      <View style={styles.couponDetails}>
        {((coupon as any).valueType === 'PERCENT' || (coupon as any).type === CouponType.PERCENTAGE) ? (
          <Text style={[styles.couponValue, { color: theme.primary }]}>{coupon.value}% OFF</Text>
        ) : (
          <Text style={[styles.couponValue, { color: theme.primary }]}>{formatBRL(coupon.value)} OFF</Text>
        )}
        {coupon.minOrderValue != null && (
          <Text style={[styles.couponMinOrder, { color: theme.textMuted }]}>Mín. {formatBRL(coupon.minOrderValue)}</Text>
        )}
        <Text style={[styles.couponExpiry, { color: theme.textMuted }]}>Expira em: {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}</Text>
      </View>
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: isAvailable ? theme.primary : theme.border, opacity: isAvailable ? 1 : 0.6 }]}
        onPress={() => isAvailable && onUseCoupon(coupon)}
        disabled={!isAvailable}
        accessibilityLabel={isAvailable ? 'Usar cupom' : buttonText}
      >
        <Ionicons name="pricetag-outline" size={16} color="#FFF" />
        <Text style={styles.primaryBtnText}>{buttonText}</Text>
      </TouchableOpacity>
      {!isAvailable && (
        <View style={styles.couponOverlay}>
          <Text style={styles.couponOverlayText}>{isUsed ? 'USADO' : 'EXPIRADO'}</Text>
        </View>
      )}
    </View>
  );
}

export default function ClientCouponsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const [allCoupons, setAllCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'USED' | 'EXPIRED'>('AVAILABLE');

  const loadCoupons = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fetched = await getMyCouponsService();
      const mapped = fetched.map(mapApiToUICoupon);
      setAllCoupons(mapped);
    } catch (error: any) {
      console.error('Erro ao buscar cupons do cliente:', error?.response?.data || error?.message);
      NotificationUIService.showError(error?.response?.data?.message || t('common.network_error', { defaultValue: 'Falha de rede.' }), t('common.error', { defaultValue: 'Erro' }));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleUseCoupon = (coupon: CouponItem) => {
    router.push({ pathname: '/(client)/bookings/schedule-service', params: { couponCode: coupon.code } } as any);
    NotificationUIService.showInfo(`Cupom ${coupon.code} pronto para uso no checkout.`, 'Cupom selecionado');
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCoupons();
  }, [loadCoupons]);

  const filteredCoupons = useMemo(() => {
    return allCoupons.filter((coupon) => {
      switch (activeTab) {
        case 'AVAILABLE':
          return coupon.status === CouponStatus.AVAILABLE;
        case 'USED':
          return coupon.status === CouponStatus.USED;
        case 'EXPIRED':
          return coupon.status === CouponStatus.EXPIRED;
        default:
          return true;
      }
    });
  }, [allCoupons, activeTab]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 8, color: theme.textMuted }}>Carregando cupons...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header semelhante ao Cashback */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={'Voltar'}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Meus Cupons</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Conteúdo principal */}
      <View style={styles.content}>
        <View style={[styles.tabsRow, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'AVAILABLE' && [styles.tabPillActive, { borderColor: theme.primary }]]}
            onPress={() => setActiveTab('AVAILABLE')}
            accessibilityRole="tab"
            accessibilityLabel="Cupons disponíveis"
            accessibilityState={{ selected: activeTab === 'AVAILABLE' }}
          >
            <Text style={[styles.tabText, activeTab === 'AVAILABLE' && { color: theme.primary }]}>Disponíveis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'USED' && [styles.tabPillActive, { borderColor: theme.primary }]]}
            onPress={() => setActiveTab('USED')}
            accessibilityRole="tab"
            accessibilityLabel="Cupons usados"
            accessibilityState={{ selected: activeTab === 'USED' }}
          >
            <Text style={[styles.tabText, activeTab === 'USED' && { color: theme.primary }]}>Usados</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'EXPIRED' && [styles.tabPillActive, { borderColor: theme.primary }]]}
            onPress={() => setActiveTab('EXPIRED')}
            accessibilityRole="tab"
            accessibilityLabel="Cupons expirados"
            accessibilityState={{ selected: activeTab === 'EXPIRED' }}
          >
            <Text style={[styles.tabText, activeTab === 'EXPIRED' && { color: theme.primary }]}>Expirados</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredCoupons}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <CouponCard coupon={item} onUseCoupon={handleUseCoupon} theme={theme} />
          )}
          ListEmptyComponent={(
            <View style={styles.centered}>
              <Ionicons name="sad-outline" size={48} color={theme.textMuted} />
              <Text style={{ marginTop: 12, color: theme.textMuted }}>
                {activeTab === 'AVAILABLE' ? 'Nenhum cupom disponível no momento.' :
                  activeTab === 'USED' ? 'Você ainda não usou nenhum cupom.' :
                  'Nenhum cupom expirado.'}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 80, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 16, marginTop: 10 },
  tabsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 6, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  tabPill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  tabPillActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontWeight: '700' },

  couponCard: {
    borderRadius: 12,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  couponImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 16,
    backgroundColor: '#F0F2F5',
  },
  couponInfo: { flex: 1 },
  couponTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  couponDescription: { fontSize: 12, lineHeight: 18 },
  couponDetails: { paddingHorizontal: 14, paddingBottom: 8 },
  couponValue: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  couponMinOrder: { fontSize: 12, marginBottom: 2, fontWeight: '600' },
  couponExpiry: { fontSize: 12, fontWeight: '600' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start', marginHorizontal: 14 },
  primaryBtnText: { color: '#FFF', fontWeight: '800' },
  couponOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(249, 250, 251, 0.9)', justifyContent: 'center', alignItems: 'center' },
  couponOverlayText: { fontSize: 20, fontWeight: '700', transform: [{ rotate: '-15deg' }] },
});

