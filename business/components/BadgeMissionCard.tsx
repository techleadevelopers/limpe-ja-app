// components/BadgeMissionCard.tsx
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Icons3D } from "../constants/icons3d";
import { UnifiedTheme } from "../constants/UnifiedTheme";

interface BadgeMissionCardProps {
  title: string;
  progress: number; // 0 ~ 1
  reward: string;
  onPress?: () => void;
}

export default function BadgeMissionCard({ title, progress, reward, onPress }: BadgeMissionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={Icons3D.trophyGold} style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.reward}>{reward}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UnifiedTheme.colors.card,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    ...UnifiedTheme.shadow,
  },
  icon: { width: 46, height: 46, resizeMode: "contain", marginRight: 12 },
  title: { fontSize: 15, fontWeight: "700", color: UnifiedTheme.colors.textPrimary },
  progressBar: {
    height: 8,
    borderRadius: 6,
    backgroundColor: "#E3E8F6",
    marginTop: 6,
    marginBottom: 4,
  },
  progressFill: {
    height: 8,
    borderRadius: 6,
    backgroundColor: UnifiedTheme.colors.accent,
  },
  reward: { fontSize: 12, fontWeight: "600", color: UnifiedTheme.colors.textSecondary },
});
