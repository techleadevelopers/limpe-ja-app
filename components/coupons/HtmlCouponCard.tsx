import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, useColorScheme, Modal } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Toast from '../Toast'; // Assuming Toast component is correctly imported
import Colors from '../../constants/Colors'; // Assuming Colors is correctly imported
import Button from '../common/Button'; // Assuming Button component is correctly imported
import { BlurView } from 'expo-blur'; // Import BlurView for the blur effect

// Helper hook to get current theme colors
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// Props interface for the HtmlCouponCard component
interface HtmlCouponCardProps {
  code: string;
  title: string;
  subtitle?: string;
  expiresAt?: string | null;
  logoUrl?: string;
  onUseNow: (code: string) => void;
  onDismiss: () => void;
  isVisible: boolean; // New prop to control the visibility of the modal/overlay
}

export const HtmlCouponCard: React.FC<HtmlCouponCardProps> = ({
  code,
  title,
  subtitle,
  expiresAt,
  logoUrl,
  onUseNow,
  onDismiss,
  isVisible, // Destructure the new isVisible prop
}) => {
  const [copyButtonText, setCopyButtonText] = useState('COPY CODE');
  const theme = useTheme();

  // Function to copy the coupon code to clipboard
  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopyButtonText('COPIED');
      Toast.show({ type: 'info', text1: 'Código Copiado!', text2: 'Cole no seu aplicativo para usar.' });
      setTimeout(() => setCopyButtonText('COPY CODE'), 3000); // Reset button text after 3 seconds
    } catch (e) {
      console.error('Falha ao copiar para a área de transferência', e);
      Toast.show({ type: 'error', text1: 'Erro ao Copiar', text2: 'Tente novamente.' });
    }
  };

  // Memoized formatting for the expiration date
  const formattedExpiresAt = useMemo(() => {
    if (!expiresAt) return '';
    const date = new Date(expiresAt);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [expiresAt]);

  // Memoized image source for the logo
  const imageSource = useMemo(() => {
    return logoUrl
      ? { uri: logoUrl }
      : require('../../assets/images/logo2.png'); // Fallback local image
  }, [logoUrl]);

  // Handler for the "Usar" (Use Now) button
  const handleUseNow = (code: string) => {
    onUseNow(code); // Call the provided onUseNow callback
  };

  return (
    // Modal component to display the coupon card as an overlay
    <Modal
      visible={isVisible} // Control modal visibility with the isVisible prop
      transparent // Allows the background to be seen through (for blur)
      animationType="fade" // Smooth fade animation for modal appearance/disappearance
      onRequestClose={onDismiss} // Callback when the user requests to close the modal (e.g., hardware back button on Android)
    >
      {/* BlurView for the robust dark blur effect */}
      <BlurView
        intensity={80} // Adjust intensity for desired blur strength (e.g., 80 for robust blur)
        tint="dark" // Apply a dark tint over the blur
        style={styles.fullScreenBlur} // Style to make BlurView cover the entire screen
      >
        {/* Pressable wrapper to allow closing the modal by tapping outside the coupon card */}
        <Pressable style={styles.modalContentWrapper} onPress={onDismiss}>
          {/* The actual coupon card content, wrapped in a Pressable to stop propagation of taps */}
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.couponCardContainer}>
            {/* Close button for the coupon card */}
            <Pressable onPress={onDismiss} style={styles.closeButton} accessibilityLabel="Fechar">
              <Text style={[styles.closeButtonText, { color: '#fff' }]}>✕</Text>
            </Pressable>

            {/* Logo image */}
            <Image source={imageSource} style={styles.logo} />

            {/* Title and optional subtitle */}
            <Text style={styles.h3}>
              {title}
              {subtitle ? <Text style={styles.h3Subtitle}>{'\n'}{subtitle}</Text> : null}
            </Text>

            {/* Coupon code and copy button row */}
            <View style={styles.couponRow}>
              <Text style={styles.cpnCode}>{code}</Text>
              <TouchableOpacity onPress={copyToClipboard} style={styles.cpnBtn}>
                <Text style={styles.cpnBtnText}>{copyButtonText}</Text>
              </TouchableOpacity>
            </View>

            {/* Expiration date */}
            <Text style={styles.p}>Validade: {formattedExpiresAt}</Text>

            {/* "Usar" (Use Now) button */}
            <Button title="Usar" onPress={() => handleUseNow(code)} style={styles.useNowButton} />

            {/* Decorative circles on the sides */}
            <View style={[styles.circle, styles.circle1, { backgroundColor: theme.background }]} />
            <View style={[styles.circle, styles.circle2, { backgroundColor: theme.background }]} />
          </Pressable>
        </Pressable>
      </BlurView>
    </Modal>
  );
};

// Stylesheet for the component
const styles = StyleSheet.create({
  // Style for the full-screen blur overlay
  fullScreenBlur: {
    flex: 1,
    // A slight background color on top of the blur can enhance the dark effect
    backgroundColor: 'rgba(3, 3, 3, 0.1)',
  },
  // Wrapper to center the coupon card within the modal and handle taps outside
  modalContentWrapper: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  // Container style for the coupon card itself (replaces original couponCard positioning)
  couponCardContainer: {
    backgroundColor: '#56c7f7ff',
    paddingVertical: 10,
    paddingHorizontal: 55,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative', // Keep relative for positioning inner elements like circles
    width: '90%', // Make it responsive, take 90% of parent width
    maxWidth: 400, // Limit max width for larger screens
    alignItems: 'center', // Center content horizontally within the card
  },
  // Existing styles for internal elements, kept intact as requested
  closeButton: { position: 'absolute', top: 8, right: 19, zIndex: 2, padding: 2 },
  closeButtonText: { fontSize: 12, color: '#fff' },
  logo: { width: 85, height: 40, right: 10, borderRadius: 8, marginBottom: 3, resizeMode: 'contain' },
  h3: { fontSize: 18, fontWeight: 'bold', lineHeight: 12, color: '#fff', textAlign: 'center', marginBottom: 8 },
  h3Subtitle: { fontSize: 13, fontFamily: 'Montserrat-Thin', fontWeight: 'normal', lineHeight: 15, color: '#fff' },
  p: { fontSize: 11, color: '#174df0ff', marginBottom: 3, fontFamily: 'Montserrat-Thin', fontWeight: 'bold', left: 110, top: 38 },
  couponRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 5 },
  cpnCode: { borderWidth: 1, borderColor: '#fff', paddingVertical: 3, paddingHorizontal: 4, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, borderRightWidth: 0, color: '#3647dfff', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', fontSize: 10 },
  cpnBtn: { borderWidth: 1, borderColor: '#fff', backgroundColor: '#fff', paddingVertical: 3, paddingHorizontal: 8, borderTopRightRadius: 5, borderBottomRightRadius: 5 },
  cpnBtnText: { color: '#5887feff', fontWeight: 'bold', fontSize: 10 },
  circle: { width: 35, height: 35, borderRadius: 27.5, position: 'absolute', top: '50%', transform: [{ translateY: -7.5 }] },
  circle1: { left: -7.5 },
  circle2: { right: -7.5 },
  useNowButton: { marginTop: -8, width: '40%', paddingVertical: 1, marginBottom: 15 },
});

export default HtmlCouponCard;