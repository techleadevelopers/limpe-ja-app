import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/appStyles';

type Variant = 'success' | 'info' | 'warning' | 'error';

export interface OverlayMessageProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  onHide?: () => void;
  durationMs?: number;
}

const VARIANT_COLORS: Record<Variant, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: AppColors.primaryLight, fg: AppColors.white, icon: 'checkmark-circle' },
  info: { bg: '#2563eb', fg: '#ffffff', icon: 'information-circle' },
  warning: { bg: '#f59e0b', fg: '#111827', icon: 'warning' },
  error: { bg: '#dc2626', fg: '#ffffff', icon: 'close-circle' },
};

export const OverlayMessage: React.FC<OverlayMessageProps> = ({
  visible,
  title,
  subtitle,
  iconName,
  variant = 'info',
  onHide,
  durationMs = 1000,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 220, easing: undefined, useNativeDriver: Platform.OS !== 'web' }),
        Animated.delay(durationMs),
        Animated.timing(anim, { toValue: 0, duration: 220, easing: undefined, useNativeDriver: Platform.OS !== 'web' }),
      ]).start(({ finished }) => finished && onHide?.());
    }
  }, [visible, anim, durationMs, onHide]);

  const t = Animated;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const opacity = anim;

  const palette = VARIANT_COLORS[variant];
  const isSuccess = variant === 'success';
  const icon = iconName || palette.icon;

  const iconElement = isSuccess ? (
    <View style={styles.successIconBadge}>
      <Ionicons name={icon} size={20} color={AppColors.white} />
    </View>
  ) : (
    <Ionicons name={icon} size={20} color={palette.fg} style={styles.icon} />
  );

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }] }>
      {/* Backdrop escuro com dismiss on tap */}
      <TouchableWithoutFeedback onPress={onHide}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      {/* Card premium */}
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.root, { transform: [{ translateY }] }]}
      >
        <View style={[styles.card, isSuccess && styles.successCard, { backgroundColor: palette.bg }]}>
          {isSuccess && (
            <>
              <View style={styles.successSplash} />
              <View style={styles.successBlob} />
              <View style={styles.successDotLarge} />
              <View style={styles.successDotSmall} />
            </>
          )}
          {iconElement}
          <View style={styles.textContent}>
            <Text style={[styles.title, { color: palette.fg }]} numberOfLines={2}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: palette.fg }]} numberOfLines={3}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
  position: 'absolute',
  left: 0,
  right: 0,
  top: Platform.OS === 'ios' ? 60 : 40, // margem de segurança (notch / status bar)
  alignItems: 'center',
  justifyContent: 'flex-start', // 👈 empurra o card pro topo
  zIndex: 10001,
},
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.40)',
    zIndex: 10000,
  },
  icon: {
    marginRight: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '92%',
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  successCard: {
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 16,
    backgroundColor: AppColors.primaryLight,
  },
  successIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  textContent: {
    flex: 1,
    zIndex: 1,
  },
  successSplash: {
    position: 'absolute',
    left: -32,
    bottom: -28,
    width: 160,
    height: 160,
    backgroundColor: AppColors.primaryDark,
    borderRadius: 80,
    opacity: 0.28,
  },
  successBlob: {
    position: 'absolute',
    right: -48,
    top: -24,
    width: 130,
    height: 130,
    backgroundColor: AppColors.primaryInteractive,
    borderRadius: 65,
    opacity: 0.45,
  },
  successDotLarge: {
    position: 'absolute',
    right: 26,
    bottom: 18,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppColors.primaryInteractive,
    opacity: 0.55,
  },
  successDotSmall: {
    position: 'absolute',
    right: 12,
    bottom: 46,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.primaryDark,
    opacity: 0.6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
});

export default OverlayMessage;
