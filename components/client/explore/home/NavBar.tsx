// components/client/explore/home/NavBar.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics'; // Importar Haptics para feedback tátil

interface NavBarProps {
  welcomeCouponOffer: any;
  activeBottomPromotion: 'coupon' | 'referral' | null;
  setActiveBottomPromotion: (val: 'coupon' | 'referral' | null) => void;
}

const NavBar: React.FC<NavBarProps> = ({
  welcomeCouponOffer,
  activeBottomPromotion,
  setActiveBottomPromotion,
}) => {
  const router = useRouter();
  const currentRoute = usePathname();

  // Mova a declaração de navItems para antes de seu uso
  const navItems = [
    { name: 'Home', icon: 'home', route: '/(client)/explore' },
    { name: 'Cupons', icon: 'pricetag', route: '/(client)/coupons' },
    { name: 'Booking', icon: 'calendar', route: '/(client)/booking' },
    { name: 'Setting', icon: 'settings', route: '/(client)/settings' },
    { name: 'Profile', icon: 'person', route: '/(client)/profile' },
  ];

  // Agora navItems já está declarado quando é usado aqui
  const navItemAnims = useRef(navItems.map(() => new Animated.Value(1))).current;

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  const onPressInNavItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(navItemAnims[index], {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
      tension: 80,
    }).start();
  };

  const onPressOutNavItem = (index: number) => {
    Animated.spring(navItemAnims[index], {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 80,
    }).start();
  };

  return (
    <View style={styles.navBar}>
      {navItems.map((item, index) => (
        <TouchableOpacity
          key={item.name}
          style={[styles.navItem, { transform: [{ scale: navItemAnims[index] }] }]}
          onPress={() => {
            if (item.name === 'Cupons' && welcomeCouponOffer) {
              setActiveBottomPromotion('coupon');
            } else {
              navigateTo(item.route);
            }
          }}
          onPressIn={() => onPressInNavItem(index)}
          onPressOut={() => onPressOutNavItem(index)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              currentRoute === item.route
                ? (item.icon as keyof typeof Ionicons.glyphMap)
                : (`${item.icon}-outline` as keyof typeof Ionicons.glyphMap)
            }
            size={24}
            color={currentRoute === item.route ? '#1A73E8' : '#888'}
          />
          <Text
            style={[
              styles.navText,
              { color: currentRoute === item.route ? '#1A73E8' : '#888' },
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default NavBar;