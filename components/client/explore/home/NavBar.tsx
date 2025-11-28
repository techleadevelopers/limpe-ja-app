import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../../../constants/Colors';

interface NavBarProps {
  welcomeCouponOffer?: any;
  activeBottomPromotion?: 'coupon' | 'referral' | null;
  setActiveBottomPromotion?: (val: 'coupon' | 'referral' | null) => void;
}

const NavBar: React.FC<NavBarProps> = ({
  welcomeCouponOffer,
  setActiveBottomPromotion,
}) => {
  const router = useRouter();
  const currentRoute = usePathname();
  const scheme = (Colors as any)?.scheme || 'light';
  const theme: any = (Colors as any)[scheme] || (Colors as any).light;

  const navItems = [
    { name: 'Início', icon: 'home', route: '/explore' },
    { name: 'Cupons', icon: 'pricetag', route: '/coupons' },
    { name: 'Reservas', icon: 'calendar', route: '/bookings' },
    { name: 'Suporte', icon: 'chatbubble-ellipses', route: '/support' },
    { name: 'Perfil', icon: 'person', route: '/profile' },
  ];

  const navItemAnims = useRef(navItems.map(() => new Animated.Value(1))).current;
  const rippleAnims = useRef(navItems.map(() => new Animated.Value(0))).current;
  const [navBarWidth, setNavBarWidth] = useState(0);

  const CURRENT_COLOR = theme.primary || '#6198cebd';
  const INACTIVE_COLOR = '#8A8A8E';

  const onLayout = (event: LayoutChangeEvent) =>
    setNavBarWidth(event.nativeEvent.layout.width);

  const onPressIn = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.parallel([
      Animated.spring(navItemAnims[index], {
        toValue: 0.86,
        useNativeDriver: true,
        friction: 6,
      }),

      Animated.timing(rippleAnims[index], {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPressOut = (index: number) => {
    Animated.parallel([
      Animated.spring(navItemAnims[index], {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
      Animated.timing(rippleAnims[index], {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const navigateTo = (path: string) => router.push(path as any);

  return (
    <View style={styles.navBar} onLayout={onLayout}>
      {/* BACKGROUND LUXO */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 45}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.80)',
          'rgba(245,245,250,0.92)',
          'rgba(240,240,250,0.97)',
        ]}
        style={StyleSheet.absoluteFillObject}
      />

      {navItems.map((item, index) => {
        const isSelected = currentRoute === item.route;

        return (
          <Pressable
            key={item.name}
            style={styles.navItem}
            onPress={() => {
              if (item.name === 'Cupons' && welcomeCouponOffer) {
                setActiveBottomPromotion?.('coupon');
              } else navigateTo(item.route);
            }}
            onPressIn={() => onPressIn(index)}
            onPressOut={() => onPressOut(index)}
          >
            {/* ACTIVE PILL PREMIUM */}
            {isSelected && (
              <Animated.View
                style={[
                  styles.activePill,
                  {
                    backgroundColor: `${CURRENT_COLOR}15`,
                    shadowColor: CURRENT_COLOR,
                    shadowOpacity: 0.18,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 2 },
                  },
                ]}
              />
            )}

            {/* RIPPLE GLASS */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ripple,
                {
                  opacity: rippleAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.35],
                  }),
                  transform: [
                    {
                      scale: rippleAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 1.8],
                      }),
                    },
                  ],
                },
              ]}
            />

            {/* ITEM */}
            <Animated.View
              style={{
                transform: [
                  { scale: navItemAnims[index] },
                  { translateY: isSelected ? -2 : 0 },
                ],
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={
                  (isSelected ? item.icon : `${item.icon}-outline`) as any
                }
                size={24}
                color={isSelected ? CURRENT_COLOR : INACTIVE_COLOR}
                style={{
                  marginBottom: 3,
                  textShadowColor: isSelected ? `${CURRENT_COLOR}60` : 'transparent',
                  textShadowRadius: isSelected ? 4 : 0,
                }}
              />

              <Text
                style={[
                  styles.navText,
                  {
                    color: isSelected ? CURRENT_COLOR : INACTIVE_COLOR,
                    fontWeight: isSelected ? '700' : '500',
                    opacity: isSelected ? 1 : 0.75,
                  },
                ]}
              >
                {item.name}
              </Text>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 87,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 5,
    position: 'relative',
  },

  navText: {
    fontSize: 10,
    letterSpacing: 0.1,
  },

  activePill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: '18%',
    right: '18%',
    borderRadius: 22,
    zIndex: -1,
  },

  ripple: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.35)',
    zIndex: -2,
  },
});

export default NavBar;
