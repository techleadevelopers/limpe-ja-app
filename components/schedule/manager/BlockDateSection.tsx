// app/provider/schedule/components/BlockDateSection.tsx
import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BlockDateSectionProps {
  animation: Animated.Value;
}

const BlockDateSection: React.FC<BlockDateSectionProps> = ({ animation }) => {
  return (
    <Animated.View style={[styles.dayCard, styles.specialSectionCard, { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <Text style={styles.sectionTitle}>Datas Específicas</Text>
      <TouchableOpacity style={styles.blockDateButton} onPress={() => Alert.alert("Em Breve", "A funcionalidade de bloquear datas específicas para férias, feriados ou indisponibilidade temporária será adicionada em breve! Isso permitirá um controle mais granular da sua agenda.")}>
        <Ionicons name="calendar-outline" size={20} color="#455A64" style={{ marginRight: 8 }} />
        <Text style={styles.blockDateButtonText}>Bloquear Datas ou Períodos</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#8A8A8E" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  specialSectionCard: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C3A5F', marginBottom: 15 },
  blockDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CED4DA',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  blockDateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
  },
});

export default BlockDateSection;