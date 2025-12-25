import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import Colors from '../../constants/Colors';
import Toast from '../Toast';

// Helper hook to get theme colors
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface HtmlCouponCardProps {
  code: string;
  title: string;
  subtitle?: string;
  expiresAt?: string | null;
  logoUrl?: string;
  onUseNow: (code: string) => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export const HtmlCouponCard: React.FC<HtmlCouponCardProps> = ({
  code,
  title,
  subtitle,
  expiresAt,
  logoUrl,
  onUseNow,
  onDismiss,
  isVisible,
}) => {
  const [copyButtonText, setCopyButtonText] = useState('COPIAR');
  const theme = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [isVisible]);

  // Pulso luminoso no botão principal
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopyButtonText('COPIADO!');
      Toast.show({
        type: 'success',
        text1: 'Código copiado!',
        text2: 'Cole no campo de cupom para usar.',
      });
      setTimeout(() => setCopyButtonText('COPIAR'), 3000);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erro', text2: 'Não foi possível copiar o código.' });
    }
  };

  const formattedExpiresAt = useMemo(() => {
    if (!expiresAt) return '';
    const date = new Date(expiresAt);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [expiresAt]);

  const imageSource = useMemo(() => {
    return logoUrl ? { uri: logoUrl } : require('../../assets/images/logo2.png');
  }, [logoUrl]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <BlurView intensity={40} tint="light" style={styles.fullScreenBlur}>
        <Pressable style={styles.modalContentWrapper} onPress={onDismiss}>
          <Animated.View
            onStartShouldSetResponder={() => true}
            style={[
              styles.couponCardContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#D8F2FF', '#C6E8FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientBackground}
            />

            {/* Botão fechar */}
            <Pressable onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#4A90E2" />
            </Pressable>

            {/* Logo */}
            <Image source={imageSource} style={styles.logo} />

            {/* Título */}
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            {/* Código e botão copiar */}
            <View style={styles.couponRow}>
              <Text style={styles.couponCode}>{code}</Text>
              <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                <Text style={styles.copyButtonText}>{copyButtonText}</Text>
              </TouchableOpacity>
            </View>

            {/* Validade */}
            {formattedExpiresAt ? (
              <Text style={styles.validityText}>Válido até {formattedExpiresAt}</Text>
            ) : null}

            {/* Botão principal com pulso */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => onUseNow(code)}
                activeOpacity={0.8}
              >
                <Text style={styles.ctaText}>Usar Agora</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Efeitos decorativos */}
            <View style={styles.glowCircleLeft} />
            <View style={styles.glowCircleRight} />
          </Animated.View>
        </Pressable>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenBlur: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  modalContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponCardContainer: {
    width: '85%',
    maxWidth: 380,
    borderRadius: 22,
    paddingVertical: 25,
    paddingHorizontal: 30,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#3ED6F8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 15,
    zIndex: 10,
  },
  logo: {
    width: 90,
    height: 40,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#316CDE',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#3E5E7E',
    textAlign: 'center',
    marginBottom: 15,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  couponCode: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    fontWeight: '700',
    color: '#3B6EF5',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#C5E2FF',
  },
  copyButton: {
    backgroundColor: '#3B6EF5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  validityText: {
    fontSize: 12,
    color: '#4A6EB0',
    marginBottom: 15,
  },
  ctaButton: {
    backgroundColor: '#3ED6F8',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 14,
    shadowColor: '#3ED6F8',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  glowCircleLeft: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(62,214,248,0.25)',
    left: -40,
    top: 40,
    blurRadius: 40,
  },
  glowCircleRight: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(173,216,255,0.25)',
    right: -40,
    bottom: 40,
    blurRadius: 40,
  },
});

export default HtmlCouponCard;
