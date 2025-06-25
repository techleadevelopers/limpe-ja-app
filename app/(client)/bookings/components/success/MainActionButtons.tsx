// LimpeJaApp/app/(client)/bookings/components/success/MainActionButtons.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MainActionButtonsProps {
  onGoToBookings: () => void;
  onGoHome: () => void;
  headerPrimaryColor: string;
}

export default function MainActionButtons({
  onGoToBookings,
  onGoHome,
  headerPrimaryColor,
}: MainActionButtonsProps) {
  return (
    <View style={styles.actionButtonsContainerNew}>
      <TouchableOpacity style={[styles.downloadButton, { backgroundColor: headerPrimaryColor }]} onPress={onGoToBookings}>
        <Ionicons name="list-outline" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
        <Text style={styles.downloadButtonText}>Ver Meus Agendamentos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.downloadButton, styles.secondaryDownloadButton]} onPress={onGoHome}>
        <Ionicons name="home-outline" size={20} color={headerPrimaryColor} style={{ marginRight: 10 }} />
        <Text style={[styles.downloadButtonText, { color: headerPrimaryColor }]}>Voltar para o Início</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainerNew: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
  },
  downloadButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginBottom: 15,
    // backgroundColor handled by prop
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryDownloadButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    // borderColor handled by prop
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});