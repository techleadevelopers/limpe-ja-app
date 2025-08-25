// components/coupons/HtmlCouponCard.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, useColorScheme } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons'; // <— ADICIONADO
import Toast from '../Toast';
import Colors from '../../constants/Colors';
import Button from '../common/Button';

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
}

export const HtmlCouponCard: React.FC<HtmlCouponCardProps> = ({
  code,
  title,
  subtitle,
  expiresAt,
  logoUrl = 'https://i.postimg.cc/KvTqpZq9/uber.png',
  onUseNow,
  onDismiss,
}) => {
  const [copyButtonText, setCopyButtonText] = useState('COPY CODE');
  const theme = useTheme();

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopyButtonText('COPIED');
      Toast.show({ type: 'info', text1: 'Código Copiado!', text2: 'Cole no seu aplicativo para usar.' });
      setTimeout(() => setCopyButtonText('COPY CODE'), 3000);
    } catch (e) {
      console.error('Falha ao copiar para a área de transferência', e);
      Toast.show({ type: 'error', text1: 'Erro ao Copiar', text2: 'Tente novamente.' });
    }
  };

  const formattedExpiresAt = useMemo(() => {
    if (!expiresAt) return '';
    const date = new Date(expiresAt);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [expiresAt]);

  return (
    <View style={styles.couponCard}>
      {/* X de fechar */}
      <Pressable onPress={onDismiss} style={styles.closeButton} accessibilityLabel="Fechar">
        <Text style={[styles.closeButtonText, { color: '#fff' }]}>✕</Text>
      </Pressable>

      {/* Botão lateral pequeno “usar” */}
      <TouchableOpacity
        onPress={() => onUseNow(code)}
        style={styles.sideFab}
        accessibilityLabel="Usar cupom"
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-forward" size={18} color="#7158fe" />
      </TouchableOpacity>

      {/* Logo */}
      <Image source={{ uri: logoUrl }} style={styles.logo} />

      {/* Título + descrição */}
      <Text style={styles.h3}>
        {title}
        {subtitle ? <Text style={styles.h3Subtitle}>{'\n'}{subtitle}</Text> : null}
      </Text>

      {/* Código + copiar */}
      <View style={styles.couponRow}>
        <Text style={styles.cpnCode}>{code}</Text>
        <TouchableOpacity onPress={copyToClipboard} style={styles.cpnBtn}>
          <Text style={styles.cpnBtnText}>{copyButtonText}</Text>
        </TouchableOpacity>
      </View>

      {/* Validade */}
      <Text style={styles.p}>Valid Till: {formattedExpiresAt}</Text>

      {/* Botão principal “Usar agora” (mantido) */}
      <Button title="Usar agora" onPress={() => onUseNow(code)} style={styles.useNowButton} />

      {/* Círculos decorativos */}
      <View style={[styles.circle, styles.circle1, { backgroundColor: theme.background }]} />
      <View style={[styles.circle, styles.circle2, { backgroundColor: theme.background }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  couponCard: {
    backgroundColor: '#7158fe',
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 2,
    padding: 6,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  // MINI-BOTÃO LATERAL “USAR”
  sideFab: {
    position: 'absolute',
    right: 8,           // dentro do card, confortável
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 20,
  },
  h3: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 28,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  h3Subtitle: {
    fontSize: 18,
    fontWeight: 'normal',
    lineHeight: 24,
    color: '#fff',
  },
  p: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 20,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
  },
  cpnCode: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderRightWidth: 0,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cpnBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  cpnBtnText: {
    color: '#5887feff',
    fontWeight: 'bold',
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
  },
  circle1: { left: -25 },
  circle2: { right: -25 },
  useNowButton: {
    marginTop: 10,
    width: '80%',
  },
});

export default HtmlCouponCard;
