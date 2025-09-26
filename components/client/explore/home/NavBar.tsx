// components/client/explore/home/NavBar.tsx
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
  // Animated value para a posição horizontal do indicador "current"
  const currentIndicatorAnim = useRef(new Animated.Value(0)).current;

  // Estados para armazenar as dimensões da barra de navegação e dos itens
  const [navBarWidth, setNavBarWidth] = useState(0);
  const [navItemWidth, setNavItemWidth] = useState(0);

  // Constantes de cor baseadas nas variáveis Less do documento
  const NAVBAR_HEIGHT = 60; // Altura da navbar existente
  const CURRENT_COLOR = '#86cbf3ff'; // Cor de destaque para item selecionado/hover (@current-color)
  const CURRENT_COLOR_HOVER = '#3c5cecff'; // Cor de destaque para hover (@current-color-hover)
  const LI_COLOR = '#969b9cff'; // Cor do texto para itens não selecionados (@li-color)
  const BACKGROUND_COLOR = '#ffffffff'; // Cor de fundo da barra de navegação (@background-color do div.menu)

  // Função para calcular a posição X do indicador com base no índice do item
  // A lógica é baseada na fórmula Less: (largura_item / 4) + (largura_item * índice)
  const calculateIndicatorPosition = useCallback((index: number, totalWidth: number) => {
    if (totalWidth === 0) return 0;
    const itemFullWidth = totalWidth / navItems.length;
    // O indicador é centralizado na metade do item, com sua borda esquerda começando a 1/4 da largura do item.
    return (itemFullWidth / 4) + (itemFullWidth * index);
  }, [navItems.length]);

  // Efeito para atualizar a posição do indicador quando a rota atual ou a largura da navbar mudam
  useEffect(() => {
    if (navBarWidth > 0) {
      const currentIndex = navItems.findIndex(item => item.route === currentRoute);
      if (currentIndex !== -1) {
        const targetX = calculateIndicatorPosition(currentIndex, navBarWidth);
        Animated.timing(currentIndicatorAnim, {
          toValue: targetX,
          duration: 400, // Duração da transição (400ms do Less)
          easing: Easing.bezier(0.35, 1.30, 0.80, 1.10), // Curva de easing cúbica do Less
          useNativeDriver: true,
        }).start();
      }
    }
  }, [currentRoute, navBarWidth, navItems, calculateIndicatorPosition, currentIndicatorAnim]);

  // Callback para obter a largura da barra de navegação após o layout
  const onNavBarLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setNavBarWidth(width);
    setNavItemWidth(width / navItems.length);

    // Define a posição inicial do indicador sem animação
    const initialIndex = navItems.findIndex(item => item.route === currentRoute);
    if (initialIndex !== -1) {
      const initialX = calculateIndicatorPosition(initialIndex, width);
      currentIndicatorAnim.setValue(initialX);
    }
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

  // Largura do indicador: metade da largura de um item de navegação
  const indicatorWidth = navItemWidth / 2;
  const indicatorHeight = NAVBAR_HEIGHT; // A mesma altura da navbar

  return (
    <View style={[styles.navBar, { backgroundColor: BACKGROUND_COLOR }]} onLayout={onNavBarLayout}>
      {navBarWidth > 0 && ( // Renderiza o indicador somente após a largura da navbar ser conhecida
        <Animated.View
          style={[
            styles.currentIndicator,
            {
              width: indicatorWidth,
              height: indicatorHeight,
              transform: [{ translateX: currentIndicatorAnim }],
            },
          ]}
        >
          {/* Parte superior do indicador */}
          <View style={[styles.currentIndicatorTop, { backgroundColor: CURRENT_COLOR }]}>
            {/* Triângulo superior */}
            <View style={[styles.currentIndicatorTriangle, {
                borderTopColor: CURRENT_COLOR,
                borderLeftWidth: indicatorWidth / 6, // Aproximação de (width / (num_li * 12))
                borderRightWidth: indicatorWidth / 6,
                top: '100%', // Posiciona o triângulo na parte inferior da barra superior
            }]} />
          </View>
       
        </Animated.View>
      )}

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
              color={isSelected ? CURRENT_COLOR : LI_COLOR} // Aplica a cor de destaque ou a cor padrão
            />
            <Text
              style={[
                styles.navText,
                { color: isSelected ? CURRENT_COLOR : LI_COLOR }, // Aplica a cor de destaque ou a cor padrão
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
    zIndex: 1, // Garante que os itens de navegação fiquem acima do indicador
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
    // fontFamily: 'Asap', // Se você deseja usar a fonte 'Asap', certifique-se de carregá-la com expo-font
    letterSpacing: 0.5, // Aproximação de 0.1em para React Native
  },
  currentIndicator: {
    position: 'absolute',
    top: 4,
    // A propriedade 'left' é animada via 'transformX'
    zIndex: 0, // Garante que o indicador fique atrás dos itens de navegação
  },
  currentIndicatorTop: {
    position: 'absolute',
    left: -3,
    
    height: 4, // Aproximação de calc(@height / 10) = 60/10 = 6
    width: '120%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    shadowColor: '#42bfcfff',
    shadowOffset: { width: 0, height: 1 }, // Sombra para baixo (como box-shadow 0 5px)
    shadowOpacity: 1.3,
    shadowRadius: 5,
    elevation: 5,
    bottom: '100%', // Posiciona a barra superior acima da área principal do indicador
  },
  currentIndicatorBottom: {
    position: 'absolute',
    left: 0,
    height: 6, // Aproximação de calc(@height / 10) = 60/10 = 6
    width: '100%',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 }, // Sombra para cima (como box-shadow 0 -5px)
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    top: '100%', // Posiciona a barra inferior abaixo da área principal do indicador
  },
  currentIndicatorTriangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    // borderLeftWidth e borderRightWidth são dinâmicos
    // borderTopColor ou borderBottomColor são dinâmicos
    borderTopWidth: -6, // Altura aproximada do triângulo
    borderBottomWidth: -6, // Altura aproximada do triângulo
    left: '50%',
    transform: [{ translateX: -6 }], // Centraliza o triângulo (metade da largura da borda)
  },
});

export default NavBar;