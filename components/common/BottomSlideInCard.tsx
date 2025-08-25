import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, ViewStyle } from 'react-native';

interface TopSlideInCardProps {
  isVisible: boolean;
  children: React.ReactNode;
  /** desloca para baixo (ex: para não colar na status bar) */
  topOffset?: number; // default 16..24
  /** desloca da direita (espaço da borda) */
  rightOffset?: number; // default 16
}

const { width: screenWidth } = Dimensions.get('window');

const TopSlideInCard: React.FC<TopSlideInCardProps> = ({
  isVisible,
  children,
  topOffset = Platform.select({ ios: 24, android: 16, default: 16 })!,
  rightOffset = 16,
}) => {
  // anima do lado direito (translateX) + leve fade
  const translateX = useRef(new Animated.Value(80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 80, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible, translateX, opacity]);

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[
        styles.container,
        {
          top: topOffset,
          right: rightOffset,
          opacity,
          transform: [{ translateX }],
          display: isVisible ? 'flex' : 'none',
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: Platform.select({ web: 'fixed', default: 'absolute' }) as ViewStyle['position'],
    zIndex: 9999,
    maxWidth: 420,
    width: 'auto',
    alignSelf: 'flex-end',
  },
});

export default TopSlideInCard;
