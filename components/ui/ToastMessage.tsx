// components/ui/ToastMessage.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // For modern gradient background

const { height } = Dimensions.get('window');
const DURATION = 3000; // Duration for toast message to be visible
const ANIMATION_DURATION = 300; // Duration for slide in/out animation

interface ToastMessageProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onHide: () => void;
}

const ToastMessage: React.FC<ToastMessageProps> = ({ message, type, onHide }) => {
    const translateY = useRef(new Animated.Value(height)).current; // Start off-screen bottom
    const opacity = useRef(new Animated.Value(0)).current; // Start invisible

    const backgroundColor = type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#17A2B8';
    const iconName = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'close-circle' : 'information-circle';

    useEffect(() => {
        // Slide in animation
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: height - 100, // Position above bottom of screen (adjust as needed)
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            })
        ]).start(() => {
            // Auto-hide after DURATION
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: height, // Slide out to bottom
                        duration: ANIMATION_DURATION,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: ANIMATION_DURATION,
                        useNativeDriver: true,
                    })
                ]).start(() => onHide());
            }, DURATION);

            return () => clearTimeout(timer); // Clear timeout if component unmounts
        });
    }, [translateY, opacity, onHide, message, type]); // Re-run animation if message/type changes

    return (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY }], opacity }]}>
            <LinearGradient // Gradient for a modern look
                colors={[`${backgroundColor}CC`, `${backgroundColor}FF`]} // From transparent to opaque
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
            />
            <TouchableOpacity onPress={onHide} style={styles.toastContent} activeOpacity={0.8}>
                <Ionicons name={iconName as any} size={20} color="#FFFFFF" style={styles.icon} />
                <Text style={styles.messageText}>{message}</Text>
                <Ionicons name="close-outline" size={18} color="#FFFFFF" style={styles.closeIcon} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 0, // Initially at the bottom edge, will slide up
        left: 20,
        right: 20,
        borderRadius: 10,
        overflow: 'hidden', // Ensures gradient stays within bounds
        zIndex: 1000, // Ensure it's on top of other content
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    gradientBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    icon: {
        marginRight: 10,
    },
    messageText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600', // Professional font weight
    },
    closeIcon: {
        marginLeft: 10,
        padding: 5, // Larger touch area
    },
});

export default ToastMessage;