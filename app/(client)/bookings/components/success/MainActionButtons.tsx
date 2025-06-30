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
        <Ionicons name="list-outline" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
        <Text style={styles.downloadButtonText}>Ver Meus Agendamentos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.downloadButton, styles.secondaryDownloadButton]} onPress={onGoHome}>
        <Ionicons name="home-outline" size={18} color={headerPrimaryColor} style={{ marginRight: 10 }} />
        <Text style={[styles.downloadButtonText, { color: headerPrimaryColor }]}>Voltar para o Início</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainerNew: {
    width: '98%',
    alignItems: 'center',
    paddingVertical: 15,
    bottom: 13,
    marginBottom: 0,
  },
  downloadButton: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginBottom: 20,
    marginTop :-1,
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
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryDownloadButton: {
    backgroundColor: '#FFFFFF',
    bottom: 12,
    
    // borderColor handled by prop
    ...Platform.select({
      ios: {
        
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});