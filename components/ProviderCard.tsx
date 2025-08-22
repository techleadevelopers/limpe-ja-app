// LimpeJaApp/components/ProviderCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IProvider } from '../types/backend/IProvider'; // Verifique se o caminho está correto

interface ProviderCardProps {
    provider: IProvider;
    onPress: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image
                source={provider.avatarUrl ? { uri: provider.avatarUrl } : require('/assets/images/default-avatar.png')}
                style={styles.avatar}
            />
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{provider.fullName}</Text>
                <Text style={styles.description} numberOfLines={2}>
                    {provider.providerDetails.description}
                </Text>
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFC107" />
                    <Text style={styles.ratingText}>{provider.rating.toFixed(1)} ({provider.reviewsCount} Avaliações)</Text>
                </View>
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.priceText}>A partir de</Text>
                <Text style={styles.priceValue}>R$ {provider.providerDetails.price.toFixed(2).replace('.', ',')}</Text>
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