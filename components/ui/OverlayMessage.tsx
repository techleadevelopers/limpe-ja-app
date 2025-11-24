import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/appStyles';

type Variant = 'success' | 'info' | 'warning' | 'error';
type OverlayPlacement = 'top' | 'center';
type OverlayTone = 'default' | 'soft';

export interface OverlayMessageProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  onHide?: () => void;
  durationMs?: number;
  placement?: OverlayPlacement;
  tone?: OverlayTone;
  imageSource?: any;
  imageSize?: number;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
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
  placement = 'top',
  tone = 'default',
  imageSource,
  imageSize,
  primaryActionLabel,
  onPrimaryAction,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 220,
          easing: undefined,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.delay(durationMs),
        Animated.timing(anim, {
          toValue: 0,
          duration: 220,
          easing: undefined,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(({ finished }) => finished && onHide?.());
    }
  }, [visible, anim, durationMs, onHide]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const opacity = anim;

  const isSoft = tone === 'soft';
  const basePalette = VARIANT_COLORS[variant];
  const palette =
    isSoft && variant === 'info'
      ? { bg: '#EBF5FF', fg: '#1E3A8A', icon: basePalette.icon }
      : basePalette;

  const isSuccess = variant === 'success';
  const hasImage = !!imageSource;
  const icon = iconName || palette.icon;

  const iconElement = hasImage
    ? null
    : isSuccess
    ? (
      <View style={styles.successIconBadge}>
        <Ionicons name={icon} size={20} color={AppColors.white} />
      </View>
    )
    : (
      <Ionicons name={icon} size={20} color={palette.fg} style={styles.icon} />
    );

  if (!visible) return null;

  const containerStyle = placement === 'center' ? styles.rootCentered : styles.root;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity }]}
      pointerEvents={isSoft ? 'box-none' : 'auto'}
    >
      {/* Backdrop escuro com dismiss on tap (modo padrão) */}
      {!isSoft && (
        <TouchableWithoutFeedback onPress={onHide}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}
      {/* Backdrop leve não bloqueante para overlays suaves (visitante) */}
      {isSoft && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.softBackdrop, { opacity }]}
        />
      )}
      {/* Card premium */}
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[containerStyle, { transform: [{ translateY }] }]}
        pointerEvents="box-none"
      >
        <View style={styles.cardContainer}>
          {hasImage && (
            <Image
              source={imageSource}
              style={[
                styles.imageIconFloating,
                { width: imageSize || 56, height: imageSize || 56 },
              ]}
              resizeMode="contain"
            />
          )}
          <View
            style={[
              styles.card,
              isSuccess && styles.successCard,
              isSoft && variant === 'info' && styles.softInfoCard,
              { backgroundColor: palette.bg },
            ]}
            pointerEvents="auto"
          >
            {isSuccess && (
              <>
                <View style={styles.successSplash} />
                <View style={styles.successBlob} />
                <View style={styles.successDotLarge} />
                <View style={styles.successDotSmall} />
              </>
            )}
            {!hasImage && iconElement}
            <View style={styles.textContent}>
              <Text style={[styles.title, { color: palette.fg }]} numberOfLines={2}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: palette.fg }]} numberOfLines={3}>
                  {subtitle}
                </Text>
              ) : null}
              {primaryActionLabel ? (
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => {
                    onPrimaryAction?.();
                    onHide?.();
                  }}
                >
                  <Text style={styles.primaryActionText}>{primaryActionLabel}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const ANDROID_TOP_OFFSET = (StatusBar.currentHeight ?? 0) + 24;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === 'ios' ? 60 : ANDROID_TOP_OFFSET, // margem de segurança (notch / status bar)
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10001,
  },
  rootCentered: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.40)',
    zIndex: 10000,
  },
  softBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cardContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  imageIconFloating: {
    position: 'absolute',
    top: 34,
    right: 5,
    borderRadius: 32,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  softInfoCard: {
    borderRadius: 26,
    paddingHorizontal: 39,
    paddingVertical: 18,
    backgroundColor: AppColors.accentLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
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
    right: 8,
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
  primaryActionButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColors.primaryInteractive,
  },
  primaryActionText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OverlayMessage;
