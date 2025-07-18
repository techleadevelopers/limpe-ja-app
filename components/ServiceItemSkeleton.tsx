// components/skeletons/ServiceItemSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ServiceItemSkeletonProps {
    delay?: number; // Optional delay for staggered animation
}

const ServiceItemSkeleton: React.FC<ServiceItemSkeletonProps> = ({ delay = 0 }) => {
    const translateX = useRef(new Animated.Value(-width)).current; // Start off-screen left
    const opacity = useRef(new Animated.Value(0.5)).current; // Initial opacity for the skeleton

    useEffect(() => {
        // Animation for the "shimmer" effect
        Animated.loop(
            Animated.timing(translateX, {
                toValue: width, // Move shimmer across the card
                duration: 1500, // Shimmer speed
                useNativeDriver: true,
            })
        ).start();

        // Fade in animation for the skeleton card itself
        Animated.timing(opacity, {
            toValue: 1, // Fade in to full opacity
            duration: 500,
            delay: delay, // Staggered delay
            useNativeDriver: true,
        }).start();
    }, [translateX, opacity, delay]);

    return (
        <Animated.View style={[styles.skeletonCard, { opacity }]}>
            <View style={styles.avatarPlaceholder} />
            <View style={styles.textContainer}>
                <View style={styles.textLineLarge} />
                <View style={styles.textLineMedium} />
                <View style={styles.textLineSmall} />
            </View>
            <View style={styles.badgePlaceholder} />

            {/* Shimmer effect overlay */}
            <Animated.View style={[styles.shimmerEffect, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginVertical: 6,
        borderRadius: 12,
        backgroundColor: '#E0E0E0', // Lighter grey for background
        overflow: 'hidden', // Crucial for shimmer effect
        position: 'relative', // For shimmer absolute positioning
        minHeight: 100, // Ensure enough height for the card
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
            android: { elevation: 2 },
        }),
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#C0C0C0', // Medium grey for avatar
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
        marginRight: 10,
    },
    textLineLarge: {
        width: '80%',
        height: 18,
        backgroundColor: '#C0C0C0', // Medium grey for text lines
        borderRadius: 4,
        marginBottom: 8,
    },
    textLineMedium: {
        width: '60%',
        height: 14,
        backgroundColor: '#C0C0C0',
        borderRadius: 4,
        marginBottom: 6,
    },
    textLineSmall: {
        width: '40%',
        height: 12,
        backgroundColor: '#C0C0C0',
        borderRadius: 4,
    },
    badgePlaceholder: {
        width: 70, // Width similar to a status badge
        height: 25,
        borderRadius: 12,
        backgroundColor: '#C0C0C0', // Medium grey for badge
        marginLeft: 10,
    },
    shimmerEffect: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
});

export default ServiceItemSkeleton;