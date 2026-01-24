// components/ui/TutorialOverlay.tsx
// Overlay leve para tutoriais contextuais (explicações rápidas, 1a vez).

import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/appStyles';

export interface TutorialOverlayProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  confirmLabel?: string;
  onConfirm: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
  title,
  subtitle,
  iconName = 'information-circle-outline',
  confirmLabel = 'Entendi',
  onConfirm,
}) => {
  if (!visible) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      {/* Fundo suave com blur, sem bloquear toques fora do card */}
      <BlurView
        intensity={20}
        tint="light"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.centerWrapper} pointerEvents="box-none">
        <View style={styles.card} pointerEvents="auto">
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Ionicons name={iconName} size={22} color={AppColors.white} />
            </View>
          </View>

          <View style={styles.textWrapper}>
            <Text style={styles.title} numberOfLines={2} allowFontScaling={false}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={styles.subtitle}
                numberOfLines={4}
                allowFontScaling={false}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.9}
            onPress={onConfirm}
          >
            <Text style={styles.buttonText} allowFontScaling={false}>
              {confirmLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.select({ ios: 32, android: 24, default: 24 }),
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: AppColors.white,
    
  },
  iconWrapper: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppColors.primaryInteractive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textTitle,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.textBody,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColors.primaryInteractive,
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TutorialOverlay;
