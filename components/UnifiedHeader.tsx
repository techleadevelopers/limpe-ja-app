// components/UnifiedHeader.tsx
import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, StatusBar, StyleSheet, Image, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { UnifiedTheme } from "../constants/UnifiedTheme";
import { Icons3D } from "../constants/icons3d";

interface UnifiedHeaderProps {
  title: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Icons3D;
  onRightPress?: () => void;
}

export default function UnifiedHeader({ title, onBack, rightIcon, onRightPress }: UnifiedHeaderProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  return (
    <Animated.View style={[styles.container, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <LinearGradient
        colors={UnifiedTheme.gradients.header}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.row}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {rightIcon ? (
            <TouchableOpacity onPress={onRightPress} style={styles.iconRight}>
              <Image source={Icons3D[rightIcon]} style={styles.iconImg} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconRight} />
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    ...UnifiedTheme.shadow,
  },
  gradient: { paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 56 : 32, paddingBottom: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 40, height: 36, justifyContent: "center", alignItems: "center" },
  iconRight: { width: 40, height: 36, justifyContent: "center", alignItems: "center" },
  iconImg: { width: 28, height: 28, resizeMode: "contain" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#fff" },
});
