import { UnifiedTheme } from '@/constants/UnifiedTheme';
import { Ionicons } from '@expo/vector-icons';
import {
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onUseCoupon: () => void;
  couponImage: string; // SVG/PNG que você vai criar
}

export default function CouponModal({ visible, onClose, onUseCoupon, couponImage }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={UnifiedTheme.colors.text} />
          </TouchableOpacity>

          <Image source={{ uri: couponImage }} style={styles.couponImage} />

          <TouchableOpacity style={styles.useBtn} onPress={onUseCoupon}>
            <Text style={styles.useBtnText}>Usar Agora</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: UnifiedTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: UnifiedTheme.colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    ...UnifiedTheme.shadow.default,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EDF4FF',
    padding: 6,
    borderRadius: 20,
    elevation: 0,
  },
  couponImage: {
    width: width * 0.7,
    height: 160,
    resizeMode: 'contain',
    marginVertical: 14,
  },
  useBtn: {
    backgroundColor: UnifiedTheme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
    marginTop: 8,
  },
  useBtnText: {
    color: UnifiedTheme.colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
