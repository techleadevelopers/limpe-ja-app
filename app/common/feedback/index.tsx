// LimpeJaApp/app/common/feedback/index.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FeedbackProps = {
  message: string;
  onClose?: () => void;
};

const Feedback: React.FC<FeedbackProps> = ({ message, onClose }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onClose ? (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>OK</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 0,
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default Feedback;