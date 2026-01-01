import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'coupons', title: 'Cupons', icon: require('../../../../assets/images/3d/ticket.png'), route: '/client/coupons' },
  { id: 'missions', title: 'Missões', icon: require('../../../../assets/images/3d/missions8.png'), route: '/client/missions' },
  { id: 'champions2', title: 'Ranking', icon: require('../../../../assets/images/3d/champp.png'), route: '/client/explore/ranking' },
  { id: 'cashback', title: 'Cashback', icon: require('../../../../assets/images/3d/cashback3.png'), route: '/client/wallet/cashback' },
  { id: 'referral', title: 'Indicações', icon: require('../../../../assets/images/3d/gift2.png'), route: '/client/referrals' },
  { id: 'metrics', title: 'Métricas', icon: require('../../../../assets/images/3d/metrics.png'), route: '/client/metrics' },
  { id: 'support', title: 'Suporte', icon: require('../../../../assets/images/3d/support4.png'), route: '/common/support' },
];

interface QuickAction {
  id: string;
  title: string;
  icon: ImageSourcePropType;
  route: string;
}

const CategoryCard2: React.FC = () => {
  return (
    <View style={styles.listWrapper}>
      {QUICK_ACTIONS.map((item) => (
        <ActionCard key={item.id} item={item} />
      ))}
    </View>
  );
};

const ActionCard: React.FC<{ item: QuickAction }> = ({ item }) => {
  const router = useRouter();
  const pressAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const handlePress = () => {
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start(() => {
      Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
    });
    router.push(item.route as any);
  };

  return (
    <Animated.View style={[styles.cardContainerWrapper, { transform: [{ scale: pressAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.touchableSurface}
        activeOpacity={0.9}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 30 : 60} tint="light" style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['#F1F2F2', '#F4F6F9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient colors={['rgba(146,210,241,0.45)', 'rgba(175,183,244,0.12)']} style={styles.contentOverlay}>
          <Animated.Image
            source={item.icon}
            style={[
              styles.iconImage,
              {
                transform: [
                  { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
                ],
              },
            ]}
          />
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.categoriaTexto} numberOfLines={1}>
        {item.title}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  listWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 10,
  },
  cardContainerWrapper: {
    width: Platform.OS === 'android' ? 58 : 64,
    height: Platform.OS === 'android' ? 110 : 120,
    marginBottom: Platform.OS === 'android' ? -6 : -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchableSurface: {
    width: Platform.OS === 'android' ? 58 : 64,
    height: Platform.OS === 'android' ? 58 : 64,
    borderRadius: 45,
    borderWidth: 0.3,
    borderColor: '#bfd0f3',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  iconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  categoriaTexto: {
    fontSize: 11,
    color: '#7890a5',
    fontWeight: Platform.OS === 'android' ? '500' : '400',
    textAlign: 'center',
    marginTop: 6,
  },
});

export default CategoryCard2;
