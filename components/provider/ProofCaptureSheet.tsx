import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColors } from '../../constants/appStyles';
import {
  BookingProofPayload,
  BookingProofType,
  InsurancePlanId,
} from '../../types/backend/bookings';

type ProofCaptureSheetProps = {
  visible: boolean;
  type: BookingProofType;
  planId?: InsurancePlanId | null;
  isSubmitting?: boolean;
  onSubmit: (payload: BookingProofPayload) => Promise<void>;
  onClose: () => void;
};

export default function ProofCaptureSheet({
  visible,
  type,
  planId,
  onSubmit,
  onClose,
  isSubmitting,
}: ProofCaptureSheetProps) {
  const [photosInput, setPhotosInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setPhotosInput('');
      setVideoUrl('');
      setError(null);
    }
  }, [visible]);

  const requiresVideo = useMemo(
    () => type === 'CHECKOUT' && (planId === 'PREMIUM' || planId === 'TOTAL'),
    [planId, type],
  );

  const actionLabel = type === 'CHECKIN' ? 'Check-in' : 'Checkout';

  const handleSubmit = async () => {
    const photos = photosInput
      .split(/\n|,/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (photos.length === 0) {
      setError('Inclua ao menos uma foto.');
      return;
    }
    if (requiresVideo && !videoUrl.trim()) {
      setError('Vídeo é obrigatório para este plano.');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        photos,
        videoUrl: videoUrl.trim() || undefined,
        hashes: {},
        timestamps: { submittedAt: new Date().toISOString() },
      });
    } catch (submitError) {
      setError('Falha ao enviar comprovante.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{`Comprovante de ${actionLabel}`}</Text>
          <Text style={styles.subtitle}>
            {`Adicione imagens que provem que você iniciou ou concluiu o atendimento. ${requiresVideo ? 'Vídeo obrigatório neste plano.' : ''}`}
          </Text>
          <TextInput
            testID="proof-photos-input"
            style={styles.textInput}
            placeholder="URLs das fotos (uma por linha ou separadas por vírgula)"
            placeholderTextColor={AppColors.textAuxiliary}
            value={photosInput}
            onChangeText={setPhotosInput}
            editable={!isSubmitting}
            multiline
          />
          <TextInput
            testID="proof-video-input"
            style={styles.textInput}
            placeholder="URL do vídeo (opcional)"
            placeholderTextColor={AppColors.textAuxiliary}
            value={videoUrl}
            onChangeText={setVideoUrl}
            editable={!isSubmitting}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="proof-submit-button"
              style={[styles.button, styles.primaryButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.buttonText, styles.buttonTextWhite]}>Enviar comprovante</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.white,
    padding: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textBody,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textAuxiliary,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: AppColors.borderNeutral,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    minHeight: 44,
    color: AppColors.textBody,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: AppColors.backgroundNeutral,
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: AppColors.primaryInteractive,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textBody,
  },
  buttonTextWhite: {
    color: '#fff',
  },
  errorText: {
    color: AppColors.errorRed,
    fontSize: 12,
    marginBottom: 6,
  },
});
