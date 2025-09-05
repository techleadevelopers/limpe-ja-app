// components/client/explore/home/ServiceCategoryCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react'; // Adicionado useRef aqui
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ProviderDisplayInfo } from '../../../../types/backend/providers'; // Assumindo que este tipo está correto
import { CLIENT_ROUTES } from '../../../../constants/routes'; // Importação adicionada

interface ServiceCategoryCardProps {
    item: ProviderDisplayInfo;
}

const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({ item }) => {
    const router = useRouter();

    if (!item || !item.id || !item.fullName) {
        console.warn('[ServiceCategoryCard] Item inválido ou incompleto. Render ignorado:', item);
        return null;
    }

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
        }).start();
    };
    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
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
                    color="#FFC107" // Cor dourada para as estrelas
                    style={styles.ratingStarIcon}
                />
            );
        }
        return <View style={styles.ratingStarContainer}>{stars}</View>;
    };

    const handleCardPress = () => {
        try {
            router.push(CLIENT_ROUTES.PROVIDER_DETAILS(item.id)); // Assumindo que CLIENT_ROUTES está definido
        } catch (err) {
            console.error('[ServiceCategoryCard] Erro ao navegar:', err);
        }
    };

    const avatarSource = item.avatarUrl
        ? { uri: item.avatarUrl }
        : require('../../../../assets/images/default-avatar.png'); // Avatar padrão

    // Exibição de preço simplificada para este card
    const priceDisplay = item.providerServices && item.providerServices.length > 0 && item.providerServices[0].price
        ? `R$ ${item.providerServices[0].price.toFixed(2).replace('.', ',')}`
        : 'Consultar';

    return (
        <Animated.View style={[styles.animatedCardContainer, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={styles.cardContentWrapper}
                onPress={handleCardPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.8}
            >
                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.providerName} numberOfLines={1}>{item.fullName}</Text>
                    <View style={styles.ratingAndPrice}>
                        {renderStars(item.averageRating)}
                        {item.reviewCount !== undefined && (
                            <Text style={styles.reviewsCountText}>
                                ({item.reviewCount})
                            </Text>
                        )}
                        <Text style={styles.priceValue}>{priceDisplay}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    animatedCardContainer: {
        width: 150, // Largura do card
        marginRight: 15,
        marginBottom: 5,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardContentWrapper: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageWrapper: {
        width: '100%',
        height: 100, // Altura da imagem
        backgroundColor: '#E0E0E0',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    infoContainer: {
        padding: 10,
    },
    providerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    ratingAndPrice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingStarContainer: {
        flexDirection: 'row',
    },
    ratingStarIcon: {
        marginRight: 1,
    },
    reviewsCountText: {
        fontSize: 10,
        color: '#888',
        marginLeft: 5,
    },
    priceValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#007AFF', // Cor azul para o preço
    },
});

export default ServiceCategoryCard;