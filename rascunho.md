import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, useColorScheme, ImageSourcePropType } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
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
  logoUrl,
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

  const imageSource = useMemo(() => {
    return logoUrl
      ? { uri: logoUrl }
      : require('../../assets/images/logo2.png');
  }, [logoUrl]);

  return (
    <View style={styles.couponCard}>
      {/* X de fechar */}
      <Pressable onPress={onDismiss} style={styles.closeButton} accessibilityLabel="Fechar">
        <Text style={[styles.closeButtonText, { color: '#fff' }]}>✕</Text>
      </Pressable>

      {/* Botão lateral pequeno (comentado no original, mas ajustado se for usado)
      <TouchableOpacity
        onPress={() => onUseNow(code)}
        style={styles.sideFab}
        accessibilityLabel="Usar cupom"
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-forward" size={8} color="#7158fe" />
      </TouchableOpacity>*/}

      {/* Logo */}
      <Image source={imageSource} style={styles.logo} />

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

      {/* Botão principal “Usar agora” */}
      <Button title="Usar" onPress={() => onUseNow(code)} style={styles.useNowButton} />

      {/* Círculos decorativos */}
      <View style={[styles.circle, styles.circle1, { backgroundColor: theme.background }]} />
      <View style={[styles.circle, styles.circle2, { backgroundColor: theme.background }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  couponCard: {
    backgroundColor: '#58ccfeff',
    paddingVertical: 10,
    paddingHorizontal: 55, // AUMENTADO: 65 (original) + 50 (metade do aumento total de 100px)
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative',
    top: 350,
    right: 0,
    width: '100%',
    maxWidth: 900, // AUMENTADO: 400 (original) + 100 (para o card ser 100px mais largo)
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 19,
    zIndex: 2,
    padding: 2,
  },
  closeButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  sideFab: {
    position: 'absolute',
    right: -5,
    top: '50%',
    transform: [{ translateY: -9 }],
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logo: {
    width: 85,
    height: 40,
    right: 10,
    borderRadius: 8,
    marginBottom: 3,
    resizeMode: 'contain',
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 12,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    
  },
  h3Subtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat-Thin',
    fontWeight: 'normal',
    lineHeight: 15,
    color: '#fff',
    
  },
  p: {
    fontSize: 11,
    color: '#174df0ff',
    marginBottom: 3,
    fontFamily: 'Montserrat-Thin', 
    fontWeight: 'bold',
    left: 115,
    top: 55,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  cpnCode: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderRightWidth: 0,
    color: '#3647dfff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    fontSize: 10,
  },
  cpnBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  cpnBtnText: {
    color: '#5887feff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  circle: {
    width: 35,
    height: 35,
    borderRadius: 27.5,
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -7.5 }],
  },
  circle1: { left: -7.5 },
  circle2: { right: -7.5 },
  useNowButton: {
    marginTop: -8,
    width: '40%',
    paddingVertical: 1,
    marginBottom: 15,
  },
});

export default HtmlCouponCard;