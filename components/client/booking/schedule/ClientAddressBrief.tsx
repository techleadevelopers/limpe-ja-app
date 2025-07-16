// ./app/(client)/bookings/components/schedule/ClientAddressBrief.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Added TouchableOpacity
import { UserProfile } from '../../../../app/types/backend/users'; // Assuming UserProfile exists

interface ClientAddressBriefProps {
    user: UserProfile | null;
    address: {
        street: string;
        number: string;
        complement?: string | null;
        neighborhood: string;
        city: string;
        state: string;
        cep: string;
    };
    onEditPress: () => void; // Callback for edit button
}

export default function ClientAddressBrief({ user, address, onEditPress }: ClientAddressBriefProps) {
    // Cores do gradiente, usando as mesmas do ProviderBrief para consistência
    const gradientColors = [
        'rgba(173, 216, 230, 0.01)', // Azul claro com baixa opacidade (quase transparente)
        'rgba(135, 189, 250, 0.42)',  // Azul com média opacidade
        'rgba(100, 148, 237, 0)',    // Azul com opacidade zero (transparente)
    ] as const;

    if (!user || !address) {
        return (
            <View style={styles.clientBriefSkeleton}>
                <View style={styles.clientImageSkeleton} />
                <View style={styles.clientTextInfoSkeleton}>
                    <View style={styles.skeletonLineLarge} />
                    <View style={styles.skeletonLineSmall} />
                </View>
            </View>
        );
    }

    const fullAddress = `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''} - ${address.neighborhood}, ${address.city}/${address.state} - ${address.cep}`;

    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }} // Início do gradiente (canto superior esquerdo)
            end={{ x: 1, y: 1 }}   // Fim do gradiente (canto inferior direito)
            style={styles.clientBriefCard}
        >
            {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.clientImageSmall} />
            ) : (
                <View style={styles.clientImagePlaceholder}>
                    <Ionicons name="person-circle-outline" size={30} color="#666" />
                </View>
            )}
            <View style={styles.clientTextInfo}>
                <Text style={styles.clientNameSmall}>{user.fullName || 'Seu Endereço'}</Text>
                <Text style={styles.clientAddressSmall}>{fullAddress}</Text>
            </View>
            <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
                <Ionicons name="pencil-outline" size={18} color="#4A90E2" />
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    clientBriefCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        paddingLeft: 22,
        borderRadius: 15,
        marginHorizontal: 30,
        marginTop: 10,
        marginBottom: 25,
        shadowColor: 'rgb(9, 96, 196)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    clientImageSmall: {
        width: 55,
        height: 55,
        borderRadius: 37.5,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#E6F0FF',
    },
    clientImagePlaceholder: {
        width: 55,
        height: 55,
        borderRadius: 37.5,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#E6F0FF',
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientTextInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    clientNameSmall: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    clientAddressSmall: {
        fontSize: 12,
        color: '#666',
    },
    editButton: {
        padding: 5,
    },
    clientBriefSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        height: 80, // Adjusted height for client brief skeleton
    },
    clientImageSkeleton: {
        width: 50,
        height: 50,
        borderRadius: 27.5,
        marginRight: 15,
        backgroundColor: '#E0E0E0',
    },
    clientTextInfoSkeleton: {
        flex: 1,
        justifyContent: 'center',
    },
    skeletonLineLarge: {
        height: 18,
        width: '80%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonLineSmall: {
        height: 14,
        width: '90%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
    },
});