import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BookingDetails } from '../../types/backend/bookings';
import { safeFormatDate } from '../../utils/formatters';

interface FeedbackModalProps {
  visible: boolean;
  booking: BookingDetails | null;
  rating: number;
  comment: string;
  onRatingChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export default function FeedbackModal({
  visible,
  booking,
  rating,
  comment,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onClose,
  isSubmitting,
}: FeedbackModalProps) {
  if (!booking) return null;

  const completedLabel = safeFormatDate(booking.completedAt);
  const providerInitial = (booking.providerFullName?.charAt(0) ?? '?').toUpperCase();
  const hasAvatar = Boolean(booking.providerAvatarUrl);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.avatarRow}>
            {hasAvatar && booking.providerAvatarUrl ? (
              <Image source={{ uri: booking.providerAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{providerInitial}</Text>
              </View>
            )}
            <View style={styles.avatarInfo}>
              <Text style={styles.providerName} numberOfLines={1}>
                {booking.providerFullName}
              </Text>
              <Text style={styles.completedAt}>Finalizado em {completedLabel}</Text>
            </View>
          </View>
          <Text style={styles.title}>Como foi seu atendimento?</Text>
          <Text style={styles.subtitle}>Sua opinião ajuda a manter a qualidade da nossa comunidade.</Text>
          <View style={styles.ratingsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => onRatingChange(value)}
                style={styles.ratingButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={value <= rating ? '#F59E0B' : '#D1D5DB'}
                  style={styles.ratingStar}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={onCommentChange}
            style={styles.input}
            placeholder="Conte como foi a experiência (opcional)"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Enviar feedback</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryText}>Depois</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0F172A',
  },
  avatarInfo: {
    flex: 1,
  },
  providerName: {
    fontWeight: '700',
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 4,
  },
  completedAt: {
    fontSize: 12,
    color: '#6B7280',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ratingButton: {
    marginHorizontal: 4,
  },
  ratingStar: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    padding: 14,
    fontSize: 14,
    color: '#111827',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#0F62FF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#4B5563',
    fontWeight: '600',
  },
});
