import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  LayoutChangeEvent,
  Platform,
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

const NavBar: React.FC<NavBarProps> = ({ welcomeCouponOffer, setActiveBottomPromotion }) => {
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
  const [navBarWidth, setNavBarWidth] = useState(0);

  const CURRENT_COLOR = theme.text || '#5b84dbff';
  const LI_COLOR = theme.textSecondary || '#8A8A8E';
  const BACKGROUND_COLOR = 'rgba(255,255,255,0.7)';

  const onLayout = (event: LayoutChangeEvent) => setNavBarWidth(event.nativeEvent.layout.width);

  const onPressIn = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(navItemAnims[index], {
      toValue: 0.93,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const onPressOut = (index: number) => {
    Animated.spring(navItemAnims[index], {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const navigateTo = (path: string) => router.push(path as any);

  return (
    <View style={[styles.navBar]} onLayout={onLayout}>
      <BlurView intensity={Platform.OS === 'ios' ? 25 : 30} tint="light" style={StyleSheet.absoluteFillObject} />
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(245,245,247,0.8)']}
        style={StyleSheet.absoluteFillObject}
      />

      {navItems.map((item, index) => {
        const isSelected = currentRoute === item.route;

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => {
              if (item.name === 'Cupons' && welcomeCouponOffer) {
                setActiveBottomPromotion?.('coupon');
              } else navigateTo(item.route);
            }}
            onPressIn={() => onPressIn(index)}
            onPressOut={() => onPressOut(index)}
            activeOpacity={0.9}
          >
            {isSelected && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.activePill,
                  {
                    backgroundColor: theme.primary
                      ? `${theme.primary}20`
                      : 'rgba(86, 139, 212, 0.12)',
                  },
                ]}
              />
            )}
            <Animated.View
              style={{
                transform: [{ scale: navItemAnims[index] }],
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={(isSelected ? item.icon : `${item.icon}-outline`) as any}
                size={22}
                color={isSelected ? theme.primary || CURRENT_COLOR : LI_COLOR}
              />
              <Text
                style={[
                  styles.navText,
                  {
                    color: isSelected ? CURRENT_COLOR : LI_COLOR,
                    fontWeight: isSelected ? '600' : '500',
                    opacity: isSelected ? 1 : 0.8,
                  },
                ]}
              >
                {item.name}
              </Text>
            </Animated.View>
          </TouchableOpacity>
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
    height: 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
    backdropFilter: 'blur(20px)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  navText: {
    fontSize: 11.5,
    marginTop: 8,
    letterSpacing: 0.2,
  },
  activePill: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: '12%',
    right: '12%',
    borderRadius: 18,
    zIndex: -1,
  },
});

export default NavBar;
