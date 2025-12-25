// components/CategoryProviderCard.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Platform, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProviderDisplayInfo } from '../../../../../types/backend/providers';
import { PricingType } from '../../../../../types/backend/services';
import { formatDistance } from '../../../../../utils/formatters';
import { getFormattedServicePrice } from '../../../../../utils/service-helpers';
import { AppColors, AppShadows } from '../../../../../constants/appStyles';

type Props = {
  item: ProviderDisplayInfo;
  onPress: (id: string) => void;
};

const CategoryProviderCard: React.FC<Props> = ({ item, onPress }) => {
  // animações
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const onPressIn = () => {
    Animated.spring(press, { toValue: 0.98, friction: 6, tension: 140, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(press, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }).start();
  };

  // serviço principal + preço “a partir de”
  const primaryService = item.providerServices?.[0];
  const priceLabel = primaryService
    ? getFormattedServicePrice(primaryService, (k: string, o?: any) => o?.defaultValue ?? k)
    : 'Preço indisponível';

  // distância (fallback dev)
  const safeDistance = __DEV__ && item.distance == null ? 4000 : item.distance;
  const distanceLabel = formatDistance(safeDistance);

  // próximo horário (mesma lógica dos seus cards)
  const nextAvailableLabel = (() => {
    const n = item.nextAvailable;
    if (!n?.date || !n?.time) return null;
    const today = new Date();
    const d = new Date(n.date);
    const dd = Math.floor((+d - +today) / (1000 * 60 * 60 * 24));
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    if (dd === 0) return `Hoje, ${n.time}`;
    if (dd === 1) return `Amanhã, ${n.time}`;
    return `${days[d.getDay()]} ${n.time}`;
  })();

  // rating → estrelas 0..5 + contagem
  const renderStars = (rating?: number, count?: number) => {
    const r = rating ?? 0;
    const full = Math.floor(r);
    const half = r % 1 !== 0;
    const icons = [];
    for (let i = 0; i < 5; i++) {
      let name: keyof typeof Ionicons.glyphMap = 'star-outline';
      if (i < full) name = 'star';
      else if (half && i === full) name = 'star-half';
      icons.push(<Ionicons key={i} name={name} size={12} color={AppColors.primaryInteractive} style={{ marginRight: 1 }} />);
    }
    return (
      <View style={styles.ratingRow}>
        <View style={{ flexDirection: 'row', marginRight: 4 }}>{icons}</View>
        {typeof count === 'number' && <Text style={styles.reviewsText}>({count})</Text>}
      </View>
    );
  };

  const avatar = item.avatarUrl
    ? { uri: item.avatarUrl }
    : require('../../../../assets/images/default-avatar.png');

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }, { scale: press }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(item.id)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${item.fullName}`}
      >
        {/* avatar + selo */}
        <View style={styles.avatarWrap}>
          <Image source={avatar} style={styles.avatar} />
          {item.verificationStatus === 'APPROVED' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color={AppColors.primaryInteractive} />
            </View>
          )}
        </View>

        {/* conteúdo */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
            {/* pílula distância */}
            {!!distanceLabel && (
              <View style={styles.distancePill}>
                <Ionicons name="location-outline" size={11} color="#334155" />
                <Text style={styles.distanceText}>{distanceLabel}</Text>
              </View>
            )}
          </View>

          <Text style={styles.specialty} numberOfLines={1}>
            {primaryService?.service?.name ?? 'Serviço'}
          </Text>

          {/* métricas compactas */}
          <View style={styles.metricsRow}>
            {typeof item.acceptanceRate === 'number' && (
              <>
                <Text style={styles.metric}>✓ {Math.round(item.acceptanceRate)}%</Text>
                <Text style={styles.dot}> · </Text>
              </>
            )}
            {typeof item.averageResponseTime === 'number' && (
              <Text style={styles.metric}>⏱ {item.averageResponseTime} min</Text>
            )}
          </View>

          {/* rating */}
          {renderStars(item.averageRating, item.reviewCount)}

          {/* preço + próximo horário */}
          <View style={styles.footerRow}>
            <Text style={styles.price}>{priceLabel}</Text>
            {!!nextAvailableLabel && (
              <Text style={styles.next}>{nextAvailableLabel}</Text>
            )}
          </View>
        </View>

        {/* CTA fantasma (ícone seta) */}
        <View style={styles.go}>
          <Ionicons name="chevron-forward" size={20} color={AppColors.primaryInteractive} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    ,
  },
  avatarWrap: {
    width: 74,
    height: 74,
    borderRadius: 40,
    marginRight: 12,
    backgroundColor: '#E8EEF8',
    borderWidth: 2,
    borderColor: '#E8EEF8', // ring externo suave
    padding: 1, // anel interno branco
    position: 'relative',
  },
  avatar: {
    width: '100%', height: '100%',
    borderRadius: 36,
    borderWidth: 1.5, borderColor: AppColors.white
  },
  verifiedBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: AppColors.white, borderRadius: 10, padding: 2,
    ...Platform.select({ ios: { shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.2, shadowRadius:2 }, android:{ elevation:2 }})
  },
  content: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: AppColors.textBody },
  distancePill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1, borderColor: '#E6EEF9'
  },
  distanceText: { marginLeft: 3, fontSize: 10, fontWeight: '600', color: '#334155' },
  specialty: { fontSize: 12, color: AppColors.textAuxiliary, marginTop: 2 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metric: { fontSize: 11, color: '#6C757D', fontWeight: '600' },
  dot: { fontSize: 11, color: '#6C757D', marginHorizontal: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  reviewsText: { fontSize: 10, color: '#8CA0B3' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  price: { fontSize: 15, fontWeight: '700', color: '#838891' },
  next: {
    fontSize: 10, fontWeight: '600', color: '#6C757D',
    backgroundColor: 'rgba(42,114,231,0.06)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8
  },
  go: { marginLeft: 8, padding: 6 }
});

export default CategoryProviderCard;


