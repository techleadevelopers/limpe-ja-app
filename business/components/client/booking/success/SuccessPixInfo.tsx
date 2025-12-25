import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Rect, Svg } from 'react-native-svg';

import { AppColors, AppShadows } from '../../../../../constants/appStyles';
import { PixChargeResponseDto } from '../../../../../types/backend/payments';
import { sanitizeText } from '../../../../../utils/formatters';
import { usePaymentIntent, usePixActions } from '../../../../../utils/paymentIntentHooks';

interface SuccessPixInfoProps {
  bookingId: string;
  fallback?: Pick<PixChargeResponseDto, 'brCode' | 'qrCodeImage'> | null;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Mock QR (visual, não escaneável) gerado por SVG, sem dependências externas
function MockQRCode({ size = 240, seed = 'mock', modules = 21, quietZone = 4, dark = '#1f2937', light = '#FFFFFF' }: { size?: number; seed?: string; modules?: number; quietZone?: number; dark?: string; light?: string }) {
  const lcg = (s: number) => () => (s = (s * 1664525 + 1013904223) >>> 0);
  const hash = Array.from(seed).reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) >>> 0, 2166136261) >>> 0;
  const rnd = lcg(hash || 1);
  const total = modules + quietZone * 2;
  const cell = size / total;
  const off = quietZone * cell;

  const blocks: React.ReactNode[] = [];
  blocks.push(<Rect key="bg" x={0} y={0} width={size} height={size} fill={light} />);

  const drawFinder = (x0: number, y0: number) => {
    blocks.push(<Rect key={`f7-${x0}-${y0}`} x={x0} y={y0} width={7 * cell} height={7 * cell} fill={dark} />);
    blocks.push(<Rect key={`f5-${x0}-${y0}`} x={x0 + cell} y={y0 + cell} width={5 * cell} height={5 * cell} fill={light} />);
    blocks.push(<Rect key={`f3-${x0}-${y0}`} x={x0 + 2 * cell} y={y0 + 2 * cell} width={3 * cell} height={3 * cell} fill={dark} />);
  };

  // Finder patterns nos 3 cantos
  drawFinder(off, off);
  drawFinder(off + (modules - 7) * cell, off);
  drawFinder(off, off + (modules - 7) * cell);

  // Padrão pseudo-aleatório para módulos restantes
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      const inTL = x < 7 && y < 7;
      const inTR = x >= modules - 7 && y < 7;
      const inBL = x < 7 && y >= modules - 7;
      if (inTL || inTR || inBL) continue;
      const r = rnd();
      const bit = ((r >>> ((x + y) % 24)) & 1) === 1;
      if (bit) {
        const rx = off + x * cell;
        const ry = off + y * cell;
        blocks.push(<Rect key={`m-${x}-${y}`} x={rx} y={ry} width={cell} height={cell} fill={dark} />);
      }
    }
  }

  return <Svg width={size} height={size}>{blocks}</Svg>;
}

export default function SuccessPixInfo({ bookingId, fallback, onRegenerate, regenerating }: SuccessPixInfoProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const stableFallback = useRef<SuccessPixInfoProps['fallback']>(null);
  const [displayBrCode, setDisplayBrCode] = React.useState<string>('');
  const [displayQrImage, setDisplayQrImage] = React.useState<string>('');

  // Seed with fallback or bookingId to keep the QR visible from the start.
  useEffect(() => {
    if (fallback?.brCode) {
      stableFallback.current = fallback;
      setDisplayBrCode(fallback.brCode);
    }
    if (fallback?.qrCodeImage) {
      stableFallback.current = fallback;
      setDisplayQrImage(fallback.qrCodeImage);
    }
    if (!fallback?.brCode && bookingId) {
      setDisplayBrCode(prev => (prev ? prev : bookingId));
    }
  }, [fallback, bookingId]);

  const { intent, loading } = usePaymentIntent(bookingId);
  // Always prefer stable values; only update when new data is non-empty.
  useEffect(() => {
    if (intent?.qrCodeText) {
      setDisplayBrCode(intent.qrCodeText);
    }
    if (intent?.qrCodeUrl) {
      setDisplayQrImage(intent.qrCodeUrl);
    }
  }, [intent?.qrCodeText, intent?.qrCodeUrl]);

  const effectivePixCode = displayBrCode || bookingId || '';
  const effectiveQrImage = displayQrImage || '';

  const { copy } = usePixActions({ qrCodeText: effectivePixCode });

  useEffect(() => {
    const entryAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    entryAnimation.start();
    return () => entryAnimation.stop();
  }, [fadeAnim, scaleAnim, translateYAnim]);

  const onPressInButton = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Prioriza valores reais; se vier vazio do intent, mantém fallback para não sumir o QR mock
  const pixCode = effectivePixCode;
  const qrCodeImage = effectiveQrImage;

  // Usa QR real se disponível; caso contrário, renderiza QR MOCK em SVG (sem imagem externa)

  return (
    <Animated.View
      style={[
        styles.pixInfoSection,
        {
          width: SCREEN_WIDTH * 0.85,
          alignSelf: 'center',
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          marginTop: 15,
          marginBottom: Platform.OS === 'ios' ? 5 : 4,
        },
      ]}
    >
      <View style={styles.qrCodeContainer}>
        <MockQRCode size={240} seed={pixCode || bookingId} />
      </View>
      <TouchableOpacity
        style={[styles.copyPixButton, { transform: [{ scale: buttonScaleAnim }] }]}
        onPress={copy}
        onPressIn={onPressInButton}
        onPressOut={onPressOutButton}
        activeOpacity={0.7}
      >
        <Ionicons name="copy-outline" size={15} color={AppColors.white} />
        <Text style={styles.copyPixButtonText} maxFontSizeMultiplier={1.2}>
          Copiar Código PIX
        </Text>
      </TouchableOpacity>
      {pixCode ? (
        <Text style={styles.pixBrCodeText} numberOfLines={1} ellipsizeMode="middle" maxFontSizeMultiplier={1.2}>
          {sanitizeText(pixCode)}
        </Text>
      ) : null}
      {typeof onRegenerate === 'function' ? (
        <TouchableOpacity
          style={[styles.regenerateButton, regenerating ? styles.regenerateButtonDisabled : null]}
          onPress={onRegenerate}
          disabled={!!regenerating}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={16} color={regenerating ? AppColors.mediumGray : AppColors.primaryInteractive} />
          <Text style={[styles.regenerateButtonText, regenerating ? styles.regenerateButtonTextDisabled : null]} maxFontSizeMultiplier={1.2}>
            {regenerating ? 'Gerando novo QR...' : 'Gerar novo QR PIX'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  pixInfoSection: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#ffffff',
    
  },
  qrCodeContainer: {
    marginBottom: 10,
    borderWidth: 1,
    marginTop: -10,
    borderColor: `${AppColors.primaryInteractive}10`,
    borderRadius: 8,
    padding: 5,
    backgroundColor: `${AppColors.primaryInteractive}10`,
    alignSelf: 'center',
  },
  qrCodeImage: {
    width: 240,
    height: 220,
    resizeMode: 'contain',
    elevation: 0,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 8,
  },
  copyPixButton: {
    flexDirection: 'row',
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 44,
  },
  copyPixButtonText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pixBrCodeText: {
    marginTop: 8,
    fontSize: 12,
    color: AppColors.mediumGray,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: '98%',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.primaryInteractive,
    backgroundColor: '#ffffff',
  },
  regenerateButtonDisabled: {
    borderColor: `${AppColors.mediumGray}55`,
    backgroundColor: `${AppColors.mediumGray}15`,
  },
  regenerateButtonText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primaryInteractive,
  },
  regenerateButtonTextDisabled: {
    color: AppColors.mediumGray,
  },
});
