// LimpeJaApp/components/ProviderCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProviderDisplayInfo } from '../types/backend/providers'; // Alterado para ProviderDisplayInfo

interface ProviderCardProps {
    provider: ProviderDisplayInfo; // Alterado o tipo para ProviderDisplayInfo
    onPress: (providerId: string) => void; // FIX: A prop onPress agora espera o ID do provedor
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onPress }) => {
    // Lógica para calcular o preço mínimo, similar ao RecomendacaoCard
    const minPrice = provider.providerServices && provider.providerServices.length > 0
        ? provider.providerServices.reduce((min, service) => {
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

    return (
        // FIX: Chama onPress passando provider.id
        <TouchableOpacity style={styles.card} onPress={() => onPress(provider.id)}>
            <Image
                source={provider.avatarUrl ? { uri: provider.avatarUrl } : require('/assets/images/default-avatar.png')}
                style={styles.avatar}
            />
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{provider.fullName}</Text>
                <Text style={styles.description} numberOfLines={2}>
                    {provider.bio || "Nenhuma descrição disponível."} {/* Alterado para provider.bio */}
                </Text>
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFC107" />
                    <Text style={styles.ratingText}>
                        {provider.averageRating !== undefined ? provider.averageRating.toFixed(1) : 'N/A'} ({provider.reviewCount !== undefined ? provider.reviewCount : 0} Avaliações)
                    </Text> {/* Alterado para provider.averageRating e provider.reviewCount */}
                </View>
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.priceText}>A partir de</Text>
                {minPrice > 0 && minPrice !== Infinity ? (
                    <Text style={styles.priceValue}>R$ {minPrice.toFixed(2).replace('.', ',')}</Text>
                ) : (
                    <Text style={styles.priceValue}>R$ N/A</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    description: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    ratingText: {
        fontSize: 12,
        color: '#999',
        marginLeft: 4,
    },
    priceContainer: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },
    priceText: {
        fontSize: 12,
        color: '#666',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007BFF',
        marginTop: 2,
    },
});

export default ProviderCard;