import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  success: { bg: '#18a957', fg: '#ffffff', icon: 'checkmark-circle' },
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
  durationMs = 2600,
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
  const icon = iconName || palette.icon;

  if (!visible) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
      style={[styles.root, { opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.card, { backgroundColor: palette.bg }]}>
        <Ionicons name={icon} size={18} color={palette.fg} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.fg }]} numberOfLines={2}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: palette.fg }]} numberOfLines={2}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '92%',
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

