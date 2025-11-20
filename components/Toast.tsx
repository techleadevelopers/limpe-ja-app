// LimpeJaApp/components/Toast.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

// Cores para os toasts
const COLORS = {
  success: '#4CAF50', // Verde
  error: '#F44336', // Vermelho
  info: '#2196F3', // Azul
  warning: '#FFC107', // Amarelo
  textDark: '#333333',
  textLight: '#FFFFFF',
};

// Configuração do Toast para diferentes tipos
export const toastConfig: ToastConfig = {
  // success via BaseToast
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: COLORS.success }}
      contentContainerStyle={styles.toastContentContainer}
      text1Style={styles.toastText1}
      text2Style={styles.toastText2}
      renderLeadingIcon={() => (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} style={styles.toastIcon} />
      )}
    />
  ),

  // error via ErrorToast
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: COLORS.error }}
      contentContainerStyle={styles.toastContentContainer}
      text1Style={styles.toastText1}
      text2Style={styles.toastText2}
      renderLeadingIcon={() => (
        <Ionicons name="close-circle" size={24} color={COLORS.error} style={styles.toastIcon} />
      )}
    />
  ),

  // info via BaseToast
  info: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: COLORS.info }}
      contentContainerStyle={styles.toastContentContainer}
      text1Style={styles.toastText1}
      text2Style={styles.toastText2}
      renderLeadingIcon={() => (
        <Ionicons name="information-circle" size={24} color={COLORS.info} style={styles.toastIcon} />
      )}
    />
  ),

  // warning via BaseToast
  warning: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: COLORS.warning }}
      contentContainerStyle={styles.toastContentContainer}
      text1Style={styles.toastText1}
      text2Style={styles.toastText2}
      renderLeadingIcon={() => (
        <Ionicons name="warning" size={24} color={COLORS.warning} style={styles.toastIcon} />
      )}
    />
  ),

  // Custom toast for login success (mantido para consistência)
  loginSuccess: ({ text1, text2 }: any) => (
    <View style={styles.customToastContainer}>
      <Image
        source={require('../assets/images/limp-Photoroom.png')}
        style={styles.customToastImage}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.customToastTitle}>{text1}</Text>
        {text2 ? <Text style={styles.customToastSubtitle}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContentContainer: {
    paddingHorizontal: 15,
  },
  toastText1: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  toastText2: {
    fontSize: 13,
    color: COLORS.textDark,
  },
  toastIcon: {
    marginRight: 10,
  },
  customToastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    ...Platform.select({
      android: {
        elevation: 3,
        shadowColor: 'rgba(0,0,0,0.08)',
      },
      default: {},
    }),
  },
  customToastImage: {
    width: 36,
    height: 36,
    marginRight: 10,
    resizeMode: 'contain',
  },
  customToastTitle: {
    color: COLORS.textLight,
    fontWeight: 'bold',
    fontSize: 15,
  },
  customToastSubtitle: {
    color: COLORS.textLight,
    fontSize: 13,
  },
});

export default Toast;
