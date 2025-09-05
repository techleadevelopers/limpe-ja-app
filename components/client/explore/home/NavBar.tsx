// components/client/explore/home/NavBar.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  const navItems = [
    { name: 'Home', icon: 'home', route: '/(client)/explore' },
    { name: 'Cupons', icon: 'pricetag', route: '/(client)/coupons' },
    { name: 'Booking', icon: 'calendar', route: '/(client)/booking' },
    { name: 'Setting', icon: 'settings', route: '/(client)/settings' },
    { name: 'Profile', icon: 'person', route: '/(client)/profile' },
  ];

  return (
    <View style={styles.navBar}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => {
            if (item.name === 'Cupons' && welcomeCouponOffer) {
              setActiveBottomPromotion('coupon');
            } else {
              navigateTo(item.route);
            }
          }}
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
