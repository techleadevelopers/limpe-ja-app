import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

type Props = {
  title?: string;
  message?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
};

export default function PaymentConfirmationCard({
  title = 'Pagamento confirmado',
  message = 'Seu agendamento foi confirmado com sucesso. Veja os detalhes a seguir.',
  ctaLabel = 'Ver detalhes',
  onPressCta,
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.98, duration: 120, useNativeDriver: true }),
        Animated.spring(pulse, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    }, 2000);
    return () => clearInterval(id);
  }, [fade, slide, pulse]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPressCta?.();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fade, transform: [{ translateY: slide }, { scale: pulse }] }]}>
      <LinearGradient colors={[AppColors.backgroundLight, '#E9F7EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient} />
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={26} color={AppColors.successStandard} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.cta}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
        <Ionicons name="chevron-forward" size={18} color={AppColors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: AppColors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDEFE5',
    ...Platform.select({ ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12 }, android: { elevation: 0 } }),
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 8 },
  iconWrap: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { fontSize: 16, fontWeight: '800', color: AppColors.textBody },
  message: { fontSize: 13, color: AppColors.textAuxiliary, marginTop: 4, lineHeight: 18 },
  cta: {
    marginTop: 6,
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: AppColors.primaryInteractive,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  ctaText: { color: AppColors.white, fontWeight: '700', marginRight: 6 },
});

