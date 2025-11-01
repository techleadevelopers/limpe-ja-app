import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, LayoutChangeEvent, Platform } from 'react-native';
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
  title?: string;
  onBackPress?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  animated?: boolean;
  currentRoute?: string;
}

const NavBar: React.FC<NavBarProps> = ({ welcomeCouponOffer, setActiveBottomPromotion }) => {
  const router = useRouter();
  const currentRoute = usePathname();

  // Theme (alinhado com Cashback/Missions)
  const scheme = (Colors as any)?.scheme || 'light';
  const theme: any = (Colors as any)[scheme] || (Colors as any).light;

  const hexToRgba = (hex: string, alpha: number) => {
    const h = (hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
    const int = parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const navItems = [
    { name: 'Home', icon: 'home', route: '/(client)/explore' },
    { name: 'Cupons', icon: 'pricetag', route: '/(client)/coupons' },
    { name: 'Booking', icon: 'calendar', route: '/(client)/bookings' },
    { name: 'Suporte', icon: 'chatbubble-ellipses', route: '/(client)/support' },
    { name: 'Profile', icon: 'person', route: '/(client)/profile' },
  ];

  // Animação de pressão
  const navItemAnims = useRef(navItems.map(() => new Animated.Value(1))).current;
  const [navBarWidth, setNavBarWidth] = useState(0);
  const [navItemWidth, setNavItemWidth] = useState(0);

  const CURRENT_COLOR = theme.text || '#1A1A1A';
  const LI_COLOR = theme.textSecondary || '#6B7280';
  const BACKGROUND_COLOR = theme.cardBackground || '#252c9aff';

  const onNavBarLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setNavBarWidth(width);
    setNavItemWidth(width / navItems.length);
  };

  const onPressInNavItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(navItemAnims[index], { toValue: 0.95, useNativeDriver: true, friction: 5, tension: 80 }).start();
  };
  const onPressOutNavItem = (index: number) => {
    Animated.spring(navItemAnims[index], { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }).start();
  };

  const navigateTo = (path: string) => router.push(path as any);

  return (
    <View style={[styles.navBar, { backgroundColor: BACKGROUND_COLOR }]} onLayout={onNavBarLayout}>
      <BlurView intensity={Platform.OS === 'ios' ? 12 : 22} tint="light" style={StyleSheet.absoluteFillObject} />
      <LinearGradient colors={['#f1f2f4', '#f1f2f4']} style={StyleSheet.absoluteFillObject} />

      {navItems.map((item, index) => {
        const isSelected = currentRoute === item.route;
        const primaryPill = hexToRgba(theme.primary || '#4A90E2', 0.12);
        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.navItem, { transform: [{ scale: navItemAnims[index] }] }]}
            onPress={() => {
              if (item.name === 'Cupons' && welcomeCouponOffer) setActiveBottomPromotion?.('coupon');
              else navigateTo(item.route);
            }}
            onPressIn={() => onPressInNavItem(index)}
            onPressOut={() => onPressOutNavItem(index)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={item.name}
            accessibilityState={{ selected: isSelected }}
          >
            {isSelected && <Animated.View pointerEvents="none" style={[styles.activePill, { backgroundColor: primaryPill }]} />}
            <Ionicons name={(isSelected ? item.icon : `${item.icon}-outline`) as any} size={24} color={isSelected ? CURRENT_COLOR : LI_COLOR} />
            <Text style={[styles.navText, { color: isSelected ? CURRENT_COLOR : LI_COLOR, fontWeight: isSelected ? '600' : '500' }]}>
              {item.name}
            </Text>
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
    height: 85,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 5,
    zIndex: 1,
  },
  navText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  activePill: {
    position: 'absolute',
    top: 10,
    bottom: 8,
    left: '10%',
    right: '10%',
    borderRadius: 18,
    zIndex: 0,
  },
});

export default NavBar;

