// src/app/(client)/explore/components/home/RecomendacaoCard.tsx

import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { CLIENT_ROUTES } from '../../../../../constants/routes';

interface RecomendacaoCardProps {
    item: ProviderDisplayInfo;
}

const RecomendacaoCard: React.FC<RecomendacaoCardProps> = ({ item }) => {
    const router = useRouter();

    if (!item || !item.id || !item.fullName) {
        console.warn('[RecomendacaoCard] Item inválido ou incompleto. Render ignorado:', item);
        return null;
    }

    // Animação de escala ao tocar o card
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96, // Escala o card ligeiramente para dentro
            useNativeDriver: true,
            friction: 8, // Mais fricção para um toque mais "macio"
            tension: 100,
        }).start();
    };
    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1, // Volta à escala normal
            useNativeDriver: true,
            friction: 8,
            tension: 100,
        }).start();
    };

    // Função para renderizar as estrelas de avaliação
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
                    size={14}
                    // Estrelas em tom de azul claro (roxo quase azul)
                    color="#88B0FF" // Tom de azul claro/roxo para estrelas
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
        : require('../../../../../assets/images/default-avatar.png');

    // --- RESTAURANDO A LÓGICA ORIGINAL DO PREÇO COM .toNumber() ---
    const averagePrice = item.providerServices && item.providerServices.length > 0
        ? item.providerServices.reduce((sum, service) => {
            // Se service.price for um objeto Prisma.Decimal, usa .toNumber()
            // Caso contrário (se já for number ou undefined/null), trata como 0
            const priceValue = (service.price && typeof (service.price as any).toNumber === 'function')
                ? (service.price as any).toNumber()
                : (typeof service.price === 'number' ? service.price : 0);
            return sum + priceValue;
          }, 0) / item.providerServices.length
        : 0;
    // --- FIM DA RESTAURAÇÃO DA LÓGICA DE PREÇO ---

    return (
        <Animated.View style={[styles.animatedCardContainer, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity 
                style={styles.cardContentWrapper} 
                onPress={handleCardPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.8}
            >
                {/* Área da Imagem */}
                <View style={styles.imageWrapper}>
                    <Image source={avatarSource} style={styles.cardImage} />
                    {/* Botão de coração (Like), em tom de azul claro */}
                    <TouchableOpacity style={styles.likeButton}>
                        <Ionicons name="heart" size={18} color="#A0D2EB" /> {/* Azul claro/roxo para o coração */}
                    </TouchableOpacity>
                </View>

                {/* Área de Conteúdo */}
                <View style={styles.infoContainer}>
                    <Text style={styles.providerName} numberOfLines={1}>{item.fullName}</Text>
                    {/* Bio concisa ou serviço principal (opcional, pode ser removido) */}
                    {item.bio && <Text style={styles.serviceDescription} numberOfLines={1}>{item.bio}</Text>}

                    {/* Preço */}
                    <View style={styles.priceAndRatingContainer}>
                        {averagePrice > 0 ? (
                            <Text style={styles.priceText}>R$ {averagePrice.toFixed(2).replace('.', ',')}</Text>
                        ) : (
                            <Text style={styles.noPriceText}>Consultar</Text>
                        )}
                        {/* Botão de Adicionar ou Ver Detalhes (Azul claro/roxo) */}
                        <TouchableOpacity style={styles.detailsButton}>
                            <Ionicons name="add" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Avaliação em Estrelas e Contagem de Reviews */}
                    <View style={styles.ratingRow}>
                        {renderStars(item.averageRating)}
                        {item.reviewCount !== undefined && (
                            <Text style={styles.reviewsCountText}>
                                ({item.reviewCount === 0 ? 'Sem avaliações' : `${item.reviewCount} avaliações`})
                            </Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// --- ESTILOS DO COMPONENTE ---
const styles = StyleSheet.create({
    animatedCardContainer: {
        marginTop: -5,
        marginRight: 18, // Espaçamento entre os cards
        marginBottom: 5, // Margem inferior para espaçamento vertical se não for horizontal
        borderRadius: 14, // Bordas mais arredondadas
        overflow: 'visible', // Permite que a sombra seja renderizada corretamente
        // Estilos de sombra suaves para profundidade
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 }, // Sombra mais para baixo
                shadowOpacity: 0.1, // Sombra mais transparente
                shadowRadius: 10,   // Sombra mais espalhada
            },
            android: {
                elevation: 6, // Elevação para Android
            },
        }),
    },
    cardContentWrapper: {
        width: 180, // Largura fixa para o card, similar à referência
        backgroundColor: '#FFFFFF',
        borderRadius: 14, // Borda arredondada consistente
        overflow: 'hidden', // Importante para o borderRadius da imagem
    },
    imageWrapper: {
        width: '100%',
        height: 120, // Altura da imagem
        backgroundColor: '#E0E0E0', // Cor de fundo para fallback da imagem
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    likeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1, // Para garantir que fique acima da imagem
    },
    infoContainer: {
        padding: 12, // Padding interno
        paddingBottom: 15, // Um pouco mais de padding inferior
    },
    providerName: {
        fontSize: 16, // Um pouco maior
        fontWeight: '700', // Mais negrito
        color: '#2C3E50', // Cor mais escura para destaque
        marginBottom: 4,
    },
    serviceDescription: {
        fontSize: 11, // Pequeno para ser sutil
        color: '#666',
        marginBottom: 8,
    },
    priceAndRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Espaçamento entre preço e botão
        marginBottom: 8,
    },
    priceText: {
        fontSize: 18, // Tamanho proeminente
        fontWeight: 'bold',
        color: '#007AFF', // Mantido como um azul primário forte para o preço (pode ser ajustado se quiser um azul mais claro para o preço tbm)
    },
    noPriceText: {
        fontSize: 14,
        color: '#888',
    },
    detailsButton: {
        // --- NOVO: Azul claro/roxo para o botão de detalhes/adicionar ---
        backgroundColor: '#A0D2EB', // Um azul mais claro, como o #A0D2EB
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
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
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingStarContainer: {
        flexDirection: 'row',
        marginRight: 4,
    },
    ratingStarIcon: {
        // Estilos já definidos
    },
    reviewsCountText: {
        fontSize: 11,
        color: '#888',
    },
});

export default RecomendacaoCard;