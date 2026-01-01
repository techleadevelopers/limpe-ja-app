import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    LayoutChangeEvent,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Colors from '../../../constants/Colors';

const ProviderNavBar: React.FC = () => {
  const router = useRouter();
  const currentRoute = usePathname();
  const scheme = (Colors as any)?.scheme || 'light';
  const theme: any = (Colors as any)[scheme] || (Colors as any).light;

  // 🔁 ÚNICA diferença real: rotas do provider
  const navItems = [
    { name: 'Início', icon: 'home', route: '/provider' },
    { name: 'Agenda', icon: 'calendar', route: '/provider/profile' },
    { name: 'Cupons', icon: 'pricetag', route: '/provider/promotions' },
    { name: 'Suporte', icon: 'chatbubble-ellipses', route: '/provider/messages' },
    { name: 'Perfil', icon: 'person', route: '/provider/profile' },
  ];

  const navItemAnims = useRef(navItems.map(() => new Animated.Value(1))).current;
  const rippleAnims = useRef(navItems.map(() => new Animated.Value(0))).current;
  const [navBarWidth, setNavBarWidth] = useState(0);

  const CURRENT_COLOR = theme.primary || '#357abebd';
  const INACTIVE_COLOR = '#707078ff';

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
      {/* BACKGROUND */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 5}
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
            onPress={() => navigateTo(item.route)}
            onPressIn={() => onPressIn(index)}
            onPressOut={() => onPressOut(index)}
          >
            {/* ACTIVE PILL */}
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

            {/* RIPPLE */}
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

            {/* ICON + LABEL */}
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
                size={21}
                color={isSelected ? CURRENT_COLOR : INACTIVE_COLOR}
                style={{
                  marginBottom: 3,
                  textShadowColor: isSelected
                    ? `${CURRENT_COLOR}60`
                    : 'transparent',
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
    height: 82,
    gap: -8,
    top: Platform.OS === 'android' ? 12 : 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',

  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: Platform.OS === 'android' ? -5 : -8,
    paddingHorizontal: 15,
    marginBottom: 5,
    bottom: Platform.OS === 'android' ? 6 : 8,
    position: 'relative',
  },
  navText: {
    fontSize: 10,
    letterSpacing: 0.1,
    marginTop: 1.3,
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
    backgroundColor: 'rgba(255, 255, 255, 1)',
    zIndex: -2,
  },
});

export default ProviderNavBar;
