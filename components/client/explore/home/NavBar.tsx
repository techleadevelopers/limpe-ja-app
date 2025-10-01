import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Easing, LayoutChangeEvent } from 'react-native';
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

  const navItems = [
    { name: 'Home', icon: 'home', route: '/(client)/explore' },
    { name: 'Cupons', icon: 'pricetag', route: '/(client)/coupons' },
    { name: 'Booking', icon: 'calendar', route: '/(client)/booking' },
    { name: 'Setting', icon: 'settings', route: '/(client)/settings' },
    { name: 'Profile', icon: 'person', route: '/(client)/profile' },
  ];

  // Animated values para o efeito de escala dos itens ao pressionar
  const navItemAnims = useRef(navItems.map(() => new Animated.Value(1))).current;

  // Estados para armazenar as dimensões da barra de navegação e dos itens (mantido para compatibilidade, mas não usado no indicador)
  const [navBarWidth, setNavBarWidth] = useState(0);
  const [navItemWidth, setNavItemWidth] = useState(0);

  // Constantes de cor baseadas nas variáveis Less do documento (azul removido)
  const NAVBAR_HEIGHT = 60; // Altura da navbar existente
  const CURRENT_COLOR = '#4A5568'; // Cor neutra escura para item selecionado (substitui o azul)
  const LI_COLOR = '#969b9cff'; // Cor do texto para itens não selecionados (@li-color)
  const BACKGROUND_COLOR = '#ffffffff'; // Cor de fundo da barra de navegação (@background-color do div.menu)

  // Callback para obter a largura da barra de navegação após o layout (mantido para layout inicial)
  const onNavBarLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setNavBarWidth(width);
    setNavItemWidth(width / navItems.length);
  };

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  // Efeitos de feedback tátil e escala ao pressionar
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
    <View style={[styles.navBar, { backgroundColor: BACKGROUND_COLOR }]} onLayout={onNavBarLayout}>
      {/* Indicador removido completamente - sem barra azul superior ou inferior */}

      {navItems.map((item, index) => {
        const isSelected = currentRoute === item.route;
        return (
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
                isSelected
                  ? (item.icon as keyof typeof Ionicons.glyphMap)
                  : (`${item.icon}-outline` as keyof typeof Ionicons.glyphMap)
              }
              size={24}
              color={isSelected ? CURRENT_COLOR : LI_COLOR} // Cor neutra para selecionado (sem azul)
            />
            <Text
              style={[
                styles.navText,
                { color: isSelected ? CURRENT_COLOR : LI_COLOR }, // Cor neutra para selecionado (sem azul)
              ]}
            >
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
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    // A cor de fundo é definida dinamicamente no componente
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    zIndex: 1, // Mantido para itens de navegação
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
    // fontFamily: 'Asap', // Se você deseja usar a fonte 'Asap', certifique-se de carregá-la com expo-font
    letterSpacing: 0.5, // Aproximação de 0.1em para React Native
  },
  // Estilos do indicador removidos completamente
});

export default NavBar;