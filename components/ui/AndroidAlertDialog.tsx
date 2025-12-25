import React from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type AndroidAlertDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

const ANDROID_SCALE = 0.92;

const AndroidAlertDialog: React.FC<AndroidAlertDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, Platform.OS === 'android' && styles.androidScale]}>
          <Text style={[styles.title, Platform.OS === 'android' && styles.androidTitle]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.message, Platform.OS === 'android' && styles.androidMessage]} numberOfLines={4}>
            {message}
          </Text>
          <View style={styles.actions}>
            {cancelLabel && onCancel ? (
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                <Text style={[styles.buttonText, styles.cancelText]}>{cancelLabel}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={[styles.buttonText, styles.confirmText]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d2b3b',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: '#3c4a5a',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    minWidth: 80,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f5f7',
    marginRight: 6,
  },
  confirmButton: {
    backgroundColor: '#0b6ff2',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelText: {
    color: '#4f5a6c',
  },
  confirmText: {
    color: '#fff',
  },
  androidScale: {
    transform: [{ scale: ANDROID_SCALE }],
  },
  androidTitle: {
    fontSize: 15 * ANDROID_SCALE,
  },
  androidMessage: {
    fontSize: 13 * ANDROID_SCALE,
  },
});

export default AndroidAlertDialog;
