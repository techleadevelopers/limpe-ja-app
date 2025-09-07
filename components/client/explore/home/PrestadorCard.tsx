import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View, Easing } from 'react-native'; // Importar Easing

import { ProviderDisplayInfo, ProviderServiceOffering } from '../../../../types/backend/providers';
import { PricingType } from '../../../../types/backend/services';
import { Icons3D } from '../../../../constants/icons3d'; // Importação corrigida para icons-3d

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PrestadorCardProps {
    item: ProviderDisplayInfo;
    onPress: (prestadorId: string) => void;
}

const PrestadorCard: React.FC<PrestadorCardProps> = ({ item, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease), // Entrada suave
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.ease), // Entrada suave
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    const onPressInCard = () => {
        Animated.spring(scaleAnim, { 
            toValue: 0.96, 
            useNativeDriver: true, 
            friction: 5, // Mais "mola"
            tension: 80, // Retorno rápido
        }).start();
    };

    const onPressOutCard = () => {
        Animated.spring(scaleAnim, { 
            toValue: 1, 
            friction: 5, 
            tension: 80, 
            useNativeDriver: true 
        }).start();
    };

    const renderStars = (rating: number | undefined) => {
        const stars = [];
        const actualRating = rating ?? 0;
        const fullStars = Math.floor(actualRating);
        const hasHalfStar = actualRating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            let iconName: keyof typeof Ionicons.glyphMap = 'star-outline';
            if (i < fullStars) iconName = 'star';
            else if (hasHalfStar && i === fullStars) iconName = 'star-half';
            stars.push(
                <Ionicons
                    key={i}
                    name={iconName}
                    size={12}
                    color="#1a7bbbff"
                    style={styles.starIcon}
                />
            );
        }
        return <View style={styles.starContainer}>{stars}</View>;
    };

    const primaryService = item.providerServices && item.providerServices.length > 0 ? item.providerServices[0] : null;
    const specialtyName = primaryService && primaryService.service ? primaryService.service.name : 'Serviço';

    const getPriceDisplay = () => {
        if (!primaryService) {
            return 'Consultar';
        }

        let priceValue;
        let priceUnit = '';

        const rawPrice = primaryService.price;
        const price = (typeof rawPrice === 'number') ? rawPrice : (rawPrice as any)?.toNumber?.() ?? 0;

        switch (primaryService.pricingType) {
            case PricingType.HOURLY:
                priceValue = price;
                priceUnit = '/h';
                break;
            case PricingType.BY_SIZE:
                priceValue = primaryService.pricePerSquareMeter; // CORRIGIDO AQUI
                priceUnit = '/m²';
                break;
            case PricingType.FIXED_PRICE:
            case PricingType.CUSTOM_QUOTE:
            default:
                priceValue = price;
                priceUnit = '';
                break;
        }

        return priceValue !== undefined && priceValue !== null && priceValue > 0
            ? `R$ ${priceValue.toFixed(2).replace('.', ',')}${priceUnit}`
            : 'Consultar';
    };

    const servicePrice = getPriceDisplay();
    const avatarSource = item.avatarUrl ? { uri: item.avatarUrl } : Icons3D.facial;

    return (
        <Animated.View style={[styles.animatedCardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={styles.cardContainer}
                onPress={() => onPress(item.id)}
                onPressIn={onPressInCard}
                onPressOut={onPressOutCard}
                activeOpacity={0.8}
            >
                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                </View>
                <View style={styles.detailsContent}>
                    <Text style={styles.providerName} numberOfLines={1}>{item.fullName}</Text>
                    <Text style={styles.specialtyText} numberOfLines={1}>{specialtyName}</Text>

                    {item.averageRating !== undefined && item.reviewCount !== undefined && (
                        <View style={styles.ratingRow}>
                            {renderStars(item.averageRating)}
                            {item.reviewCount > 0 && <Text style={styles.reviewsText}>({item.reviewCount})</Text>}
                        </View>
                    )}
                    <Text style={styles.priceText}>{servicePrice}</Text>
                </View>
                <TouchableOpacity style={styles.goButton}>
                    <Ionicons name="arrow-forward-sharp" size={20} color="#FFF" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    animatedCardContainer: {
        marginRight: 12,
        marginBottom: 10,
        marginTop: 12,
        borderRadius: 44,
        overflow: 'visible',
              borderRightWidth: 0,
           borderRightColor: '#45484b56',
           borderTopStartRadius: 44,
           borderBottomStartRadius: 44,
           borderTopEndRadius: 44,
           borderBottomEndRadius: 44,
           borderBottomColor: '#45484b56',
   
          
           borderBottomWidth: 0.1,
           borderLeftColor: '#45484b56',
           borderLeftWidth: 1,
           // Propriedades de sombra mantidas exatamente como fornecidas
           shadowColor: '#45484b56', // Cor da sombra
           shadowOffset: { width: -1, height: 1 }, // Deslocamento vertical mais pronunciado
           shadowOpacity: 1.55, // Opacidade aumentada para robustezs
           shadowRadius: 35, // Raio de desfoque para conforto
           elevation: 6, // Elevação aumentada para robustez no Android

    },
    cardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 280,
        backgroundColor: '#FFFFFF',
        borderRadius: 44,
        padding: 10,
                   borderRightWidth: 0.1,
           borderRightColor: '#45484b56',
           borderTopStartRadius: 44,
           borderBottomStartRadius: 44,
           borderTopEndRadius: 44,
           borderBottomEndRadius: 44,
           borderBottomColor: '#45484b56',
   
          
           borderBottomWidth: 0.1,
           borderLeftColor: '#45484b56',
           borderLeftWidth: 1,
           // Propriedades de sombra mantidas exatamente como fornecidas
           shadowColor: '#45484b18', // Cor da sombra
           shadowOffset: { width: -1, height: 1 }, // Deslocamento vertical mais pronunciado
           shadowOpacity: 1.55, // Opacidade aumentada para robustezs
           shadowRadius: 25, // Raio de desfoque para conforto
           elevation: 6, // Elevação aumentada para robustez no Android

        
    },
    imageWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#E0E0E0',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    detailsContent: {
        flex: 1,
        justifyContent: 'center',
    },
    providerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 2,
    },
    specialtyText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    starContainer: {
        flexDirection: 'row',
        marginRight: 4,
    },
    starIcon: {
        marginRight: 1,
    },
    reviewsText: {
        fontSize: 10,
        color: '#888',
    },
    metricText: {
        fontSize: 10,
        color: '#555',
        marginBottom: 2,
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    goButton: {
        backgroundColor: '#1A73E8',
        borderRadius: 25,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
});

export default PrestadorCard;