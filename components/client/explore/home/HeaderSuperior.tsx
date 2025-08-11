import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { UserProfile } from '../../../../types/backend/users';

export interface HeaderSuperiorProps {
    userName: string;
    userAddress?: UserProfile['address'];
}

// Definição das três cores para o gradiente
const HERO_GRADIENT_START = 'rgba(45, 108, 233, 0.9)';
const HERO_GRADIENT_MIDDLE = 'rgba(120, 160, 240, 0.9)';
const HERO_GRADIENT_END = 'rgba(45, 101, 232, 0.9)';

const HeroHeader: React.FC<HeaderSuperiorProps> = ({ userName, userAddress }) => {
    const router = useRouter();
    const [busca, setBusca] = useState('');

    const reflexTranslateX = useSharedValue(-200);
    const reflexTranslateY = useSharedValue(-200);
    const reflexRotate = useSharedValue(0);

    useEffect(() => {
        reflexTranslateX.value = withRepeat(
            withTiming(200, { duration: 4000, easing: Easing.linear }),
            -1,
            true
        );
        reflexTranslateY.value = withRepeat(
            withTiming(200, { duration: 4000, easing: Easing.linear }),
            -1,
            true
        );
        reflexRotate.value = withRepeat(
            withTiming(360, { duration: 8000, easing: Easing.linear }),
            -1,
            true
        );
    }, []);

    const animatedReflexStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: reflexTranslateX.value },
            { translateY: reflexTranslateY.value },
            { rotateZ: `${reflexRotate.value}deg` },
        ],
    }));

    const handleProfilePress = () => {
        console.log("HeroHeader: Navegando para o perfil.");
        router.push('/(client)/profile' as any);
    };

    const handleMenuPress = () => {
        console.log("HeroHeader: Abrindo o menu lateral (DrawerMenu).");
        router.push('/(client)/drawer' as any);
    };

    const handleSearchSubmit = () => {
        Keyboard.dismiss();
        if (busca.trim()) {
            console.log(`HeroHeader: Buscando por "${busca.trim()}"`);
            router.push({
                pathname: '/(client)/explore/search-results',
                params: { query: busca.trim() },
            } as any);
        }
    };

    const handleFilterPress = () => {
        console.log("HeroHeader: Filtros pressionado");
        console.log("Funcionalidade de Filtros em breve!");
    };

    const formattedAddress = userAddress ?
        `${userAddress.street || ''}, ${userAddress.number || ''} - ${userAddress.neighborhood || ''} - ${userAddress.city || ''} ${userAddress.state || ''}`.trim().replace(/,?\s*-\s*$/, '') :
        'Endereço não disponível';

    return (
        <LinearGradient
            colors={[HERO_GRADIENT_START, HERO_GRADIENT_MIDDLE, HERO_GRADIENT_END]}
            start={{ x: 0.0, y: 0.0 }}
            end={{ x: 1.0, y: 1.0 }}
            style={styles.outerContainerGradient}
        >
            <Animated.View style={[styles.animatedReflex, animatedReflexStyle]}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.reflexGradient}
                />
            </Animated.View>

            <View style={{ height: Constants.statusBarHeight * 0.95 }} />

            <View style={styles.headerContent}>
                <TouchableOpacity onPress={handleProfilePress} style={styles.profileIconContainer}>
                    <Ionicons name="person-circle" size={40 * 0.95} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingHello}>Olá, {userName}</Text>
                    <Text style={styles.greetingWelcome}>Bem-vinda de volta!</Text>
                </View>
                <TouchableOpacity onPress={handleMenuPress} style={styles.menuIconContainer}>
                    <Ionicons name="menu" size={27 * 0.95} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.addressSection}>
                <Ionicons name="star" size={14 * 0.95} color="#FFD700" style={styles.addressStarIcon} />
                <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">{formattedAddress}</Text>
            </View>

            <View style={styles.buscaContainer}>
                <Ionicons name="search-outline" size={20 * 0.95} color="#6C757D" style={styles.buscaIcone} />
                <TextInput
                    style={styles.buscaInput}
                    placeholder="Busque por serviço ou profissional..."
                    placeholderTextColor="#ADB5BD"
                    value={busca}
                    onChangeText={setBusca}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                />
                <TouchableOpacity style={styles.filtroBotao} onPress={handleFilterPress}>
                    <Ionicons name="options-outline" size={18 * 0.95} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    outerContainerGradient: {
        // Aumentando o padding horizontal
        paddingHorizontal: 10, 
        paddingBottom: 20 * 0.95,
        borderBottomLeftRadius: 28 * 0.95,
        borderBottomRightRadius: 28 * 0.95,
        marginBottom: 12 * 0.95,
        width: '100%',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.2)',
                shadowOffset: { width: 0, height: 4 * 0.95 },
                shadowOpacity: 0.8,
                shadowRadius: 4 * 0.95,
            },
            android: {
                elevation: 8 * 0.95,
            },
        }),
    },
    animatedReflex: {
        ...StyleSheet.absoluteFillObject,
        width: 200 * 0.95,
        height: 300 * 0.95,
        borderRadius: 150 * 0.95,
        opacity: 0.8,
    },
    reflexGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 150 * 0.95,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        top: 17 * 0.95,
        paddingHorizontal: 5,
        marginTop: -15 * 0.95,
    },
    profileIconContainer: {
        padding: 4 * 0.95,
    },
    greetingContainer: {
        flex: 1,
        marginLeft: 0,
    },
    greetingHello: {
        fontSize: 14 * 0.95,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    greetingWelcome: {
        fontSize: 11 * 0.95,
        top: 2 * 0.95,
        color: '#E0EFFF',
    },
    menuIconContainer: {
        padding: 5 * 0.95,
    },
    addressSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 20 * 0.95,
        marginBottom: 25 * 0.95,
    },
    addressStarIcon: {
        marginRight: 8 * 0.95,
        textShadowColor: 'rgba(255, 223, 0, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 3 * 0.95,
    },
    addressText: {
        fontSize: 13 * 0.95,
        color: '#FFFFFF',
        fontWeight: '500',
        flexShrink: 1,
    },
    buscaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 15 * 0.95,
        marginTop: -10 * 0.95,
        paddingHorizontal: 15 * 0.95,
        height: 33 * 0.95,
        marginHorizontal: 10,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 5 * 0.95 },
                shadowOpacity: 0.15,
                shadowRadius: 10 * 0.95,
            },
            android: {
                elevation: 8 * 0.95,
            },
        }),
        borderWidth: StyleSheet.hairlineWidth * 0.95,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    buscaIcone: {
        marginRight: 2 * 0.95,
        
        fontSize: 19 * 0.95,
    },
    buscaInput: {
        flex: 1,
        fontSize: 12 * 0.95,
        top: 2 * 0.95,
        color: '#343A40',
        height: '100%',
    },
    filtroBotao: {
        backgroundColor: '#007AFF',
        borderRadius: 12 * 0.95,
        padding: 1 * 0.95,
        marginLeft: 10 * 0.95,
        left: 10,
        height: 30 * 0.95,
        width: 32 * 0.95,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 * 0.95 },
        shadowOpacity: 0.3,
        shadowRadius: 5 * 0.95,
        elevation: 6 * 0.95,
    },
});

export default HeroHeader;