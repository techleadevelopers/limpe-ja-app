// LimpeJaApp/app/(common)/safety/index.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated, Easing, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ============ Ícones 3D (injeção leve) ============
const Icons3D = {
  panic: require('@3d/panic.png'),
  shield: require('@3d/shield-safe.png'),
} as const;

const Icon3D: React.FC<{ name: keyof typeof Icons3D; size?: number; style?: any }> = ({ name, size = 28, style }) => (
  <Image source={Icons3D[name]} style={[{ width: size, height: size, resizeMode: 'contain' }, style]} />
);

// Reusing AnimatedMenuItem from ClientProfileScreen for consistency
const AnimatedMenuItem: React.FC<{
    label: string;
    iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
    delay: number;
    iconType?: 'Ionicons' | 'MaterialCommunityIcons';
    showChevron?: boolean;
}> = ({ label, iconName, onPress, delay, iconType = 'Ionicons', showChevron = true }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    const onPressInItem = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const onPressOutItem = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const IconComponent = iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

    // Mapeia ícone 2D para variante 3D sutil (sem alterar API)
    const threeDMap: Record<string, keyof typeof Icons3D | undefined> = {
      'alert-circle-outline': 'panic',          // Botão de pânico
      'document-text-outline': 'shield',        // Relatar incidente (com selo de segurança)
    };
    const mapped3D = threeDMap[String(iconName)] ?? undefined;

    return (
        <Animated.View
            style={[
                styles.menuItemWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
            ]}
        >
            <TouchableOpacity
                style={styles.menuItem}
                onPress={onPress}
                onPressIn={onPressInItem}
                onPressOut={onPressOutItem}
                activeOpacity={0.7}
            >
                {/* Ícone 3D sutil + ícone atual (empilhados) */}
                <View style={styles.menuIconStack}>
                  {mapped3D && <Icon3D name={mapped3D} size={28} style={styles.menuIcon3D} />}
                  <IconComponent
                      name={iconName as any}
                      size={22}
                      color="#4682B4"
                      style={styles.menuIconFG}
                  />
                </View>

                <Text style={styles.menuItemText}>{label}</Text>
                {showChevron && <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />}
            </TouchableOpacity>
        </Animated.View>
    );
};

/**
 * SafetyScreen component provides a central hub for safety and emergency features.
 * It includes links to the Panic Button and Incident Report functionalities.
 */
export default function SafetyScreen() {
    const router = useRouter();

    // Animations for header and content entry
    const headerAnim = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(100, [
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(contentAnim, {
                toValue: 1,
                duration: 700,
                delay: 100,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header with back button */}
            <Animated.View style={[styles.customHeaderWrapper, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <View style={styles.customHeader}>
                    <TouchableOpacity style={styles.headerIconLeft} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#2F4F4F" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Segurança e Emergência</Text>
                    <View style={styles.headerIconRightPlaceholder} /> {/* Placeholder for alignment */}
                </View>
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContentContainer}>
                {/* Safety Features Section */}
                <Animated.View style={[styles.sectionCard, { opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.sectionTitle}>Recursos de Segurança</Text>
                    <Text style={styles.sectionDescription}>
                        Em situações de emergência ou para relatar incidentes, utilize as opções abaixo.
                    </Text>

                    <AnimatedMenuItem
                        label="Botão de Pânico"
                        iconName="alert-circle-outline"
                        onPress={() => router.push('/(common)/safety/panic' as any)}
                        delay={0}
                    />
                    <AnimatedMenuItem
                        label="Relatar Incidente"
                        iconName="document-text-outline"
                        onPress={() => router.push('/(common)/safety/incident-report' as any)}
                        delay={50}
                    />
                    {/* Add more safety-related options here if needed */}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8FF', // AliceBlue
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContentContainer: {
        paddingBottom: 40,
        paddingHorizontal: 15,
    },
    customHeaderWrapper: {
        // No specific styles needed here, just for animation
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 50 : 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F4F4F',
        textAlign: 'center',
        flex: 1,
    },
    headerIconLeft: {
        padding: 5,
        zIndex: 1,
    },
    headerIconRightPlaceholder: {
        width: 24 + 10,
        zIndex: 1,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginTop: 20,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.08)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 10,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#6C757D',
        marginBottom: 20,
        lineHeight: 20,
    },
    menuItemWrapper: {
        marginBottom: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        backgroundColor: '#F8FAFB', // Slightly different background for menu items within card
        borderRadius: 8,
    },

    /* --- Pilha de ícones (3D + 2D) --- */
    menuIconStack: {
        width: 28,
        height: 28,
        marginRight: 15,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    menuIcon3D: {
        position: 'absolute',
        opacity: 0.95,
        transform: [{ scale: 0.98 }],
    },
    menuIconFG: {
        // ícone 2D fica por cima
    },

    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#212529',
    },
});
