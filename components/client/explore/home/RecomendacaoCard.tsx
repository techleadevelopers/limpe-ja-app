import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CLIENT_ROUTES } from '../../../../constants/routes';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { Icons3D } from '../../../../constants/icons3d'; // Importação do Icons3D

interface RecomendacaoCardProps {
    item: ProviderDisplayInfo;
}

const RecomendacaoCard: React.FC<RecomendacaoCardProps> = ({ item }) => {
    const router = useRouter();

    if (!item || !item.id || !item.fullName) {
        console.warn('[RecomendacaoCard] Item inválido ou incompleto. Render ignorado:', item);
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
                    color="#007AFF"
                    style={styles.ratingStarIcon}
                />
            );
        }
        return <View style={styles.ratingStarContainer}>{stars}</View>;
    };

    const handleCardPress = () => {
        try {
            router.push(CLIENT_ROUTES.PROVIDER_DETAILS(item.id));
        } catch (err) {
            console.error('[RecomendacaoCard] Erro ao navegar:', err);
        }
    };

    const avatarSource = item.avatarUrl
        ? { uri: item.avatarUrl }
        : require('../../../../assets/images/default-avatar.png');

    const minPrice = item.providerServices && item.providerServices.length > 0
        ? item.providerServices.reduce((min, service) => {
            let currentServicePrice = 0;
            if (service.price && typeof service.price === 'object' && 'toNumber' in service.price) {
                currentServicePrice = (service.price as any).toNumber();
            } else if (typeof service.price === 'number') {
                currentServicePrice = service.price;
            }

            let pricePerRoomValue = 0;
            if (service.pricePerRoom && typeof service.pricePerRoom === 'object' && 'toNumber' in service.pricePerRoom) {
                pricePerRoomValue = (service.pricePerRoom as any).toNumber();
            } else if (typeof service.pricePerRoom === 'number') {
                pricePerRoomValue = service.pricePerRoom;
            }

            let pricePerSquareMeterValue = 0;
            if (service.pricePerSquareMeter && typeof service.pricePerSquareMeter === 'object' && 'toNumber' in service.pricePerSquareMeter) {
                pricePerSquareMeterValue = (service.pricePerSquareMeter as any).toNumber();
            } else if (typeof service.pricePerSquareMeter === 'number') {
                pricePerSquareMeterValue = service.pricePerSquareMeter;
            }

            const effectivePrice = currentServicePrice > 0 ? currentServicePrice :
                                   pricePerRoomValue > 0 ? pricePerRoomValue :
                                   pricePerSquareMeterValue > 0 ? pricePerSquareMeterValue : 0;

            return (effectivePrice > 0 && effectivePrice < min) ? effectivePrice : min;
        }, Infinity)
        : 0;

    const categoriesToDisplay: string[] = [];
    if (item.providerServices && item.providerServices.length > 0) {
        if (item.providerServices[0].service?.name) {
            categoriesToDisplay.push(item.providerServices[0].service.name);
        }
    }
    if (categoriesToDisplay.length === 0) {
        if (item.bio?.toLowerCase().includes('comercial')) categoriesToDisplay.push('Comercial');
        if (item.bio?.toLowerCase().includes('escritórios')) categoriesToDisplay.push('Escritório');
        if (categoriesToDisplay.length === 0) {
            categoriesToDisplay.push('Limpeza Geral');
        }
    }
    const displayedCategories = categoriesToDisplay.slice(0, 2);

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
                    {/* O nome do prestador agora está sozinho neste container */}
                    <View style={styles.providerNameContainer}>
                        <Text style={styles.providerName} numberOfLines={1}>{item.fullName}</Text>
                    </View>

                    <Text style={styles.serviceDescription} numberOfLines={2}>
                        {item.bio || "Nenhuma descrição disponível."}
                    </Text>


                    <View style={styles.categoryChipsContainer}>
                        {displayedCategories.map((category, index) => (
                            <View key={index} style={styles.categoryChip}>
                               
                            </View>
                        ))}
                    </View>

                    <View style={styles.priceAndRatingSection}>
                        <View>
                            <Text style={styles.priceLabel}>A partir de</Text>
                            {minPrice > 0 && minPrice !== Infinity ? (
                                <Text style={styles.priceValue}>R$ {minPrice.toFixed(2).replace('.', ',')}</Text>
                            ) : (
                                <Text style={styles.priceValue}>R$ N/A</Text>
                            )}
                        </View>

                        <View style={styles.ratingSection}>
                            <LinearGradient
                                colors={['#67adfd95', '#5c93ec','#5c93ec36']}
                                style={styles.plusButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="add" size={22} color="#fff" />
                            </LinearGradient>

                            {renderStars(item.averageRating)}
                            {item.reviewCount !== undefined && (
                                <Text style={styles.reviewsCountText}>
                                    {item.reviewCount === 0 ? 'Sem Avaliações' : `${item.reviewCount} Avaliações`}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
            {/* Ícone docCheck2 posicionado absolutamente FORA DO FLUXO NORMAL */}
            <Image
                source={Icons3D.docCheck} // Caminho para o ícone docCheck2
                style={styles.docCheckIcon}
            />
     
        </Animated.View>
        
    );
};

const styles = StyleSheet.create({
    animatedCardContainer: {
  width: 170,
  marginRight: 15,
  marginBottom: 5,
  borderRadius: 12,
  overflow: 'visible',
  backgroundColor: '#FFFFFF',
   shadowColor: '#000',
    shadowOffset: { width: 4, height: 7 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Sombra para Android
},
    cardContentWrapper: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden', // Mantém o conteúdo interno do card dentro dos limites
    },
    imageWrapper: {
        width: '100%',
        height: 120,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    infoContainer: {
        padding: 12,
    },
    // Container para o nome do prestador (agora sem o ícone ao lado no fluxo)
    providerNameContainer: {
        flexDirection: 'row', // Mantido como row caso queira adicionar algo no futuro
        alignItems: 'center',
        marginBottom: 4,
    },
    providerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3748',
        // marginRight removido, pois o ícone não está mais no fluxo
        flexShrink: 1, // Permite que o texto encolha se for muito longo
    },
    // NOVO: Estilo para o ícone docCheck2 com posicionamento absoluto
    docCheckIcon: {
        position: 'absolute', // Posicionamento absoluto
        top: 10, // Ajuste este valor para mover o ícone verticalmente
        right: 10, // Ajuste este valor para mover o ícone horizontalmente
        width: 40, // Largura fixa
        height: 40, // Altura fixa
        resizeMode: 'contain', // Garante que o ícone inteiro seja visível dentro das dimensões
        zIndex: 1, // Garante que o ícone fique acima de outros elementos se houver sobreposição
    },

    
    serviceDescription: {
        fontSize: 11,
        color: '#6C757D',
        marginBottom: 8,
    },
    metricText: {
        fontSize: 10,
        color: '#555',
        marginBottom: 2,
    },
    categoryChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: -40,
        marginTop: 5,
    },
    categoryChip: {
        backgroundColor: '#E6EEF9',
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 4,
    },
    categoryChipText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#000000',
    },
    priceAndRatingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: -10,
    },
    priceLabel: {
        fontSize: 10,
        color: '#6C757D',
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    ratingSection: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    plusButton: {
        width: 28,
        height: 28,
        left: 20,
        bottom: 28,
        borderRadius: 53,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#212223ff', // Esta cor está em hexadecimal, mas o resto é rgba. Mantenha a consistência.
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    ratingStarContainer: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    ratingStarIcon: {
        marginRight: 1,
    },
    reviewsCountText: {
        fontSize: 8,
        color: '#6C757D',
    },
});

export default RecomendacaoCard;