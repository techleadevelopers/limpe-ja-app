import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface GiftSplashProps {
  onFinish: () => void;
}

const GiftSplash: React.FC<GiftSplashProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Presente desbloqueado!</Text>
        <Text style={styles.subtitle}>Você ganhou uma pequena surpresa para deixar o dia ainda mais leve.</Text>
        <TouchableOpacity onPress={onFinish} style={styles.button}>
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '85%',
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: Platform.OS === 'ios' ? 18 : 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  button: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default GiftSplash;
